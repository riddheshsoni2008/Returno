import { cookies } from 'next/headers';
import Link from 'next/link';
import JoinClient from './JoinClient';

export default async function JoinPage(props) {
  const params = await props.params;
  const campaignId = params.campaignId;

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  let campaign = null;
  let business = null;
  
  try {
    const res = await fetch(`${backendUrl}/campaigns/${campaignId}`, {
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
    console.error('Invalid Campaign ID:', err);
  }

  if (!campaign || !campaign.isActive || !business) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center py-12 px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 text-center space-y-6 shadow-xl">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-2xl font-black text-slate-900">Invalid Campaign</h1>
          <p className="text-slate-500">
            This campaign QR code is invalid, expired, or has been deactivated by the business.
          </p>
          <Link 
            href="/" 
            className="inline-block px-6 py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
          >
            Return to Homepage
          </Link>
        </div>
      </main>
    );
  }

  let userDetails = null;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) {
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
    }
  } catch (err) {
    console.error('Join session verify error:', err);
  }

  return (
    <JoinClient 
      campaign={campaign} 
      business={business} 
      initialUser={userDetails}
    />
  );
}
