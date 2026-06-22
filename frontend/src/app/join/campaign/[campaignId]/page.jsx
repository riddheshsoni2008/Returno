import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import JoinClient from './JoinClient';

export default async function CampaignJoinPage(props) {
  const params = await props.params;
  const campaignId = params.campaignId;

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';
  let campaign = null;
  let business = null;
  
  // 1. Fetch public campaign details
  try {
    const res = await fetch(`${backendUrl}/campaigns/public/${campaignId}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        campaign = data.campaign;
        business = data.business;
      }
    }
  } catch (err) {
    console.error('Fetch public campaign error:', err);
  }

  // 2. If invalid or inactive, show error
  if (!campaign || !campaign.isActive || !business) {
    return (
      <main className="min-h-screen bg-slate-50 text-text-primary flex items-center justify-center py-12 px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 text-center space-y-6 shadow-xl">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-2xl font-black text-text-primary">Campaign Not Active</h1>
          <p className="text-text-secondary">
            This campaign QR code is invalid, expired, or has been deactivated by the business.
          </p>
          <Link 
            href="/" 
            className="inline-block px-6 py-3 bg-slate-100 border border-border-standard hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
          >
            Return to Homepage
          </Link>
        </div>
      </main>
    );
  }

  // 3. Verify user session
  let userDetails = null;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect(`/auth?redirect=/join/campaign/${campaignId}`);
  }

  try {
    const res = await fetch(`${backendUrl}/auth/me`, {
      headers: {
        'Cookie': `token=${token}`
      },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        userDetails = data.user;
      }
    }
  } catch (err) {
    console.error('Session verify error:', err);
  }

  if (!userDetails) {
    redirect(`/auth?redirect=/join/campaign/${campaignId}`);
  }

  // 4. Check if already joined this campaign
  let alreadyJoined = false;
  try {
    const res = await fetch(`${backendUrl}/customers/me/campaigns/${campaignId}`, {
      headers: {
        'Cookie': `token=${token}`
      },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.joined) {
        alreadyJoined = true;
      }
    }
  } catch (err) {
    console.error('Check campaign enrollment error:', err);
  }

  if (alreadyJoined) {
    redirect('/wallet');
  }

  return (
    <JoinClient 
      campaign={campaign} 
      business={business} 
      user={userDetails}
    />
  );
}
