import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Business from '@/lib/models/Business';
import Visit from '@/lib/models/Visit';
import Reward from '@/lib/models/Reward';
import AuditLog from '@/lib/models/AuditLog';
import { verifyToken } from '@/lib/auth';

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/auth');
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'admin') {
    // If not admin, redirect to general dashboard
    redirect('/dashboard');
  }

  await dbConnect();
  
  // Platform metrics
  const totalShops = await Business.countDocuments();
  const totalCustomers = await User.countDocuments({ role: 'customer' });
  const totalStamps = await Visit.countDocuments();
  const totalRedeemed = await Reward.countDocuments({ status: 'redeemed' });

  // Onboarded shops
  const recentShops = await Business.find()
    .populate('ownerId', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  // Security and Anti-Fraud Logs
  const securityLogs = await AuditLog.find()
    .populate('actorId', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);

  return (
    <main className="min-h-screen bg-dark-950 text-white py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Super Admin Hub</h1>
            <p className="text-slate-400 mt-1">Platform management and security log auditing</p>
          </div>
          <Link 
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold transition-all hover:bg-white/10"
          >
            📊 Go to Shop Dashboard
          </Link>
        </div>

        {/* Global Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-dark-900 border border-white/10 p-6 rounded-2xl">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Partner Shops</div>
            <div className="text-4xl font-extrabold text-brand-400">{totalShops}</div>
          </div>
          <div className="bg-dark-900 border border-white/10 p-6 rounded-2xl">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Registered Customers</div>
            <div className="text-4xl font-extrabold text-purple-400">{totalCustomers}</div>
          </div>
          <div className="bg-dark-900 border border-white/10 p-6 rounded-2xl">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Stamps Claimed</div>
            <div className="text-4xl font-extrabold text-blue-400">{totalStamps}</div>
          </div>
          <div className="bg-dark-900 border border-white/10 p-6 rounded-2xl">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Redeemed Rewards</div>
            <div className="text-4xl font-extrabold text-yellow-400">{totalRedeemed}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Shops Column */}
          <div className="lg:col-span-1 bg-dark-900 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-200 text-md">Onboarded Businesses</h3>
            
            {recentShops.length === 0 ? (
              <p className="text-slate-500 text-xs">No shops registered yet.</p>
            ) : (
              <div className="space-y-3">
                {recentShops.map((shop) => (
                  <div key={shop._id} className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-1">
                    <div className="font-bold text-xs text-slate-200">{shop.name}</div>
                    <div className="text-[10px] text-slate-500 capitalize">{shop.category} • {shop.address}</div>
                    {shop.ownerId && (
                      <div className="text-[9px] text-slate-400 font-medium mt-1">Owner: {shop.ownerId.name} ({shop.ownerId.email})</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anti-Fraud Audit Logs Column */}
          <div className="lg:col-span-2 bg-dark-900 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-200 text-md flex items-center gap-2">
              <span>🛡️</span> Security & Anti-Fraud Logs
            </h3>

            {securityLogs.length === 0 ? (
              <p className="text-slate-500 text-xs">No system alerts recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 px-3">Severity</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Details</th>
                      <th className="py-2.5 px-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {securityLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                            log.severity === 'critical' 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' 
                              : log.severity === 'warning'
                                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold font-mono text-[10px]">{log.action}</td>
                        <td className="py-2.5 px-3 max-w-xs truncate" title={log.details}>{log.details}</td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', timeStyle: 'short', dateStyle: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
