import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Campaign from '@/lib/models/Campaign';
import Visit from '@/lib/models/Visit';
import Reward from '@/lib/models/Reward';
import { verifyToken } from '@/lib/auth';
import WalletHub from './WalletHub';

export default async function WalletPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/auth');
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    redirect('/auth');
  }

  await dbConnect();
  const user = await User.findById(decoded.id).select('-passwordHash -otp');
  
  if (!user) {
    redirect('/auth');
  }

  // Fetch all active campaigns to map customer stamps
  const activeCampaigns = await Campaign.find({ isActive: true }).populate('businessId');
  
  // Aggregate card counts
  const walletCards = [];
  for (const camp of activeCampaigns) {
    if (!camp.businessId) continue;
    
    const stampCount = await Visit.countDocuments({ customerId: user._id, campaignId: camp._id });
    if (stampCount > 0) {
      const target = camp.requiredStamps;
      walletCards.push({
        campaign: camp,
        currentStamps: stampCount % target === 0 ? 0 : stampCount % target,
        totalEarned: stampCount
      });
    }
  }

  // Fetch customer rewards
  const rewards = await Reward.find({ customerId: user._id }).sort({ createdAt: -1 });

  return (
    <main className="min-h-screen bg-dark-950 text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <WalletHub 
          user={JSON.parse(JSON.stringify(user))} 
          initialCards={JSON.parse(JSON.stringify(walletCards))} 
          initialRewards={JSON.parse(JSON.stringify(rewards))} 
        />
      </div>
    </main>
  );
}
