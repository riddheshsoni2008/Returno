import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RewardsHub from './RewardsHub';

export default async function MerchantRewardsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/merchant/auth');
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let campaigns = [];
  let pendingClaims = [];
  let business = null;

  try {
    // Fetch business profile
    const busRes = await fetch(`${backendUrl}/business`, {
      headers: { 'Cookie': `token=${token}` },
      cache: 'no-store'
    });

    if (busRes.ok) {
      const busData = await busRes.json();
      business = busData.business;

      if (business) {
        // Fetch campaigns
        const campRes = await fetch(`${backendUrl}/campaigns`, {
          headers: { 'Cookie': `token=${token}` },
          cache: 'no-store'
        });
        if (campRes.ok) {
          const campData = await campRes.json();
          campaigns = campData.campaigns || [];
        }

        // Fetch metrics to extract pending approvals
        const metRes = await fetch(`${backendUrl}/business/metrics`, {
          headers: { 'Cookie': `token=${token}` },
          cache: 'no-store'
        });
        if (metRes.ok) {
          const metData = await metRes.json();
          if (metData.success) {
            pendingClaims = metData.metrics?.pendingRedemptions || [];
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading merchant rewards server page:', error);
  }

  if (!business) {
    redirect('/merchant/auth');
  }

  return (
    <div className="space-y-8 text-slate-800 animate-fade-in-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Loyalty & Rewards</h1>
        <p className="text-sm text-slate-550 mt-1">Configure customer milestone milestones, review claims, and generate check-in codes.</p>
      </div>

      <RewardsHub 
        initialCampaigns={campaigns} 
        initialClaims={pendingClaims} 
        verificationCode={business.verificationCode} 
        appUrl={appUrl} 
      />
    </div>
  );
}
