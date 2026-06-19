import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MerchantDashboardHub from './MerchantDashboardHub';

export default async function MerchantDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/merchant/auth');
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://returno-eight.vercel.app';
  let business = null;
  let metrics = null;
  let campaigns = [];
  let redirectPath = null;

  try {
    const busRes = await fetch(`${backendUrl}/business`, {
      headers: { 'Cookie': `token=${token}` },
      cache: 'no-store'
    });
    
    if (!busRes.ok) {
      redirectPath = '/merchant/auth';
    } else {
      const busData = await busRes.json();
      business = busData.business;

      if (business) {
        // Fetch Metrics
        const metRes = await fetch(`${backendUrl}/business/metrics`, {
          headers: { 'Cookie': `token=${token}` },
          cache: 'no-store'
        });
        
        if (metRes.ok) {
          const metData = await metRes.json();
          if (metData.success) {
            metrics = metData.metrics;
          }
        }

        // Fetch Campaigns
        const campRes = await fetch(`${backendUrl}/campaigns`, {
          headers: { 'Cookie': `token=${token}` },
          cache: 'no-store'
        });
        if (campRes.ok) {
          const campData = await campRes.json();
          campaigns = campData.campaigns || [];
        }
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    redirectPath = '/merchant/auth';
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  if (!business) {
    return (
      <div className="text-center py-20 bg-dark-900 border border-white/10 rounded-3xl">
        <h2 className="text-2xl font-bold mb-4">No Business Profile Found</h2>
        <p className="text-slate-400">Please contact support or register again.</p>
      </div>
    );
  }

  if (!metrics) {
    metrics = {
      totalStamps: 0,
      uniqueCustomers: 0,
      openRewardsCount: 0,
      recentStamps: []
    };
  }

  return (
    <MerchantDashboardHub
      business={business}
      metrics={metrics}
      initialCampaigns={campaigns}
      appUrl={appUrl}
    />
  );
}
