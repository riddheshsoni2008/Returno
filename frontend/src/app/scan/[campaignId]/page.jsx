import { cookies } from 'next/headers';
import Link from 'next/link';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Business from '@/lib/models/Business';
import Campaign from '@/lib/models/Campaign';
import { verifyToken } from '@/lib/auth';
import ScanClientResolver from './ScanClientResolver';

export default async function ScanPage(props) {
  // Await params to access dynamic route parameter in Next.js 15/16 App Router
  const params = await props.params;
  const campaignId = params.campaignId;

  await dbConnect();

  let campaign = null;
  let business = null;
  
  try {
    campaign = await Campaign.findById(campaignId);
    if (campaign) {
      business = await Business.findById(campaign.businessId);
    }
  } catch (err) {
    console.error('Invalid Campaign Object ID:', err);
  }

  // Handle missing campaign
  if (!campaign || !campaign.isActive || !business) {
    return (
      <main className="min-h-screen bg-dark-950 text-white flex items-center justify-center py-12 px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="w-full max-w-md bg-dark-900 border border-white/10 rounded-3xl p-8 text-center space-y-6">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-2xl font-bold">Invalid Loyalty Card QR</h1>
          <p className="text-slate-400">
            This QR code token is invalid, expired, or has been deleted by the shop owner.
          </p>
          <Link 
            href="/" 
            className="inline-block px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </main>
    );
  }

  // Fetch session details if already authenticated
  let userDetails = null;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await User.findById(decoded.id).select('-passwordHash -otp');
        if (user) {
          userDetails = user.toObject();
        }
      }
    }
  } catch (err) {
    console.error('Scan session verify error:', err);
  }

  return (
    <ScanClientResolver 
      campaign={JSON.parse(JSON.stringify(campaign))} 
      business={JSON.parse(JSON.stringify(business))} 
      initialUser={JSON.parse(JSON.stringify(userDetails))}
    />
  );
}
