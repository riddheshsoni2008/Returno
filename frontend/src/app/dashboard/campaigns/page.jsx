import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Business from '@/lib/models/Business';
import Campaign from '@/lib/models/Campaign';
import { verifyToken } from '@/lib/auth';
import CampaignsHub from './CampaignsHub';

export default async function CampaignsPage() {
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
  const user = await User.findById(decoded.id);
  const business = await Business.findOne({ ownerId: user._id });

  if (!business) {
    redirect('/auth');
  }

  const campaigns = await Campaign.find({ businessId: business._id }).sort({ createdAt: -1 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Campaign Manager</h1>
        <p className="text-slate-400 mt-1">Configure and manage active stamp reward cards for your customers.</p>
      </div>

      <CampaignsHub initialCampaigns={JSON.parse(JSON.stringify(campaigns))} />
    </div>
  );
}
