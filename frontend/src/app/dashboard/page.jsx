import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RedemptionApprovalHub from './RedemptionApprovalHub';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/auth');
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  let business = null;
  let metrics = null;
  let redirectPath = null;

  try {
    // First fetch business profile
    const busRes = await fetch(`${backendUrl}/business`, {
      headers: { 'Cookie': `token=${token}` },
      cache: 'no-store'
    });
    
    if (!busRes.ok) {
      redirectPath = '/auth';
    } else {
      const busData = await busRes.json();
      business = busData.business;

      if (business) {
        // Fetch metrics
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
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    redirectPath = '/auth';
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
    // Fallback if metrics fails but business loaded
    metrics = {
      totalStamps: 0,
      uniqueCustomers: 0,
      openRewardsCount: 0,
      pendingRedemptions: [],
      recentStamps: []
    };
  }

  const { totalStamps, uniqueCustomers, openRewardsCount, pendingRedemptions, recentStamps } = metrics;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Merchant Dashboard</h1>
        <p className="text-slate-400 mt-1">Real-time loyalty management and metrics for {business.name}</p>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-dark-900 border border-white/10 p-6 rounded-2xl">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Stamps Awarded</div>
          <div className="text-4xl font-extrabold text-brand-400">{totalStamps}</div>
          <p className="text-[10px] text-slate-500 mt-2">Visits logged via QR code scans</p>
        </div>
        <div className="bg-dark-900 border border-white/10 p-6 rounded-2xl">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Active Customers</div>
          <div className="text-4xl font-extrabold text-purple-400">{uniqueCustomers}</div>
          <p className="text-[10px] text-slate-500 mt-2">Unique mobile numbers registered</p>
        </div>
        <div className="bg-dark-900 border border-white/10 p-6 rounded-2xl">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Unlocked Rewards</div>
          <div className="text-4xl font-extrabold text-yellow-400">{openRewardsCount}</div>
          <p className="text-[10px] text-slate-500 mt-2">Milestone cards completed</p>
        </div>
        <div className="bg-dark-900 border border-white/10 p-6 rounded-2xl">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Verification PIN</div>
          <div className="text-3xl font-extrabold tracking-wider text-slate-200 bg-white/5 border border-white/5 px-3 py-1 rounded inline-block">
            {business.verificationCode}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Share with staff to confirm redemptions</p>
        </div>
      </div>

      {/* Redemption Approvals section */}
      <div className="bg-dark-900 border border-white/10 p-6 rounded-2xl">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🎁</span> Pending Reward Approvals
        </h3>
        <RedemptionApprovalHub initialClaims={pendingRedemptions} verificationCode={business.verificationCode} />
      </div>

      {/* Recent Visits Logs */}
      <div className="bg-dark-900 border border-white/10 p-6 rounded-2xl">
        <h3 className="text-xl font-bold mb-4">🕒 Recent Stamp Scan History</h3>
        
        {recentStamps.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No stamps awarded yet. Print your QR Code to start collecting!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Bill Number</th>
                  <th className="py-3 px-4">Bill Amount</th>
                  <th className="py-3 px-4">Scanned At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                {recentStamps.map((stamp) => (
                  <tr key={stamp._id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold">{stamp.customerId.name}</div>
                      <div className="text-xs text-slate-500">+{stamp.customerId.phone}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">{stamp.billNumber}</td>
                    <td className="py-3 px-4">₹{stamp.amount}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {new Date(stamp.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
