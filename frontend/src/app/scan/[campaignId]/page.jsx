import { cookies } from 'next/headers';
import Link from 'next/link';
import ScanClientResolver from './ScanClientResolver';

export default async function ScanPage(props) {
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
    console.error('Invalid Campaign Object ID:', err);
  }

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
    console.error('Scan session verify error:', err);
  }

  return (
    <ScanClientResolver 
      campaign={campaign} 
      business={business} 
      initialUser={userDetails}
    />
  );
}
