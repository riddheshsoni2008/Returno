import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function MerchantCustomersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/merchant/auth');
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  let metrics = null;

  try {
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
  } catch (error) {
    console.error('Error fetching customers metrics:', error);
  }

  if (!metrics) {
    metrics = {
      recentStamps: [],
      uniqueCustomers: 0
    };
  }

  const { recentStamps, uniqueCustomers } = metrics;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Customer Database</h1>
        <p className="text-sm text-slate-400 mt-1">
          You have {uniqueCustomers} active loyalty customer{uniqueCustomers !== 1 ? 's' : ''} enrolled in your campaigns.
        </p>
      </div>

      {/* Customer Visits Table */}
      <div className="bg-dark-900 border border-white/10 p-5 md:p-6 rounded-2xl">
        <h3 className="text-lg md:text-xl font-bold mb-4">👥 Customer Loyalty Visits Log</h3>

        {recentStamps.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No customer visits logged yet. Share your scan codes to onboard customers.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Customer Info</th>
                  <th className="py-3 px-4">Bill Details</th>
                  <th className="py-3 px-4">Transaction Amount</th>
                  <th className="py-3 px-4">Scanned At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                {recentStamps.map((stamp) => (
                  <tr key={stamp._id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-xs md:text-sm">{stamp.customerId?.name || 'Anonymous Customer'}</div>
                      <div className="text-[10px] md:text-xs text-slate-500">{stamp.customerId?.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs md:text-sm">{stamp.billNumber}</td>
                    <td className="py-3 px-4 text-xs md:text-sm">₹{stamp.amount}</td>
                    <td className="py-3 px-4 text-[10px] md:text-xs text-slate-500">
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
