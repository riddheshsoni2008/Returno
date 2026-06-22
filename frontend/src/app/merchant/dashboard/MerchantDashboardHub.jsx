"use client";

export default function MerchantDashboardHub({ business, metrics }) {
  const {
    uniqueCustomers = 0,
    redeemedRewardsCount = 0,
    recentStamps = [],
  } = metrics || {};

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome / Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Overview</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Welcome back, <span className="font-semibold text-primary">{business?.name || "Merchant"}</span>. Track customer activity and loyalty milestones.
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Metric 1 */}
        <div className="bg-surface border border-outline-variant p-5 rounded-xl hover:border-primary/45 transition-all duration-200 shadow-sm">
          <p className="text-xs font-semibold text-outline mb-2.5 uppercase tracking-wider">Total Customers</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-on-surface tracking-tight">{uniqueCustomers}</h3>
            <span className="text-secondary text-xs font-semibold flex items-center gap-1 bg-secondary/10 px-2.5 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Active
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface border border-outline-variant p-5 rounded-xl hover:border-primary/45 transition-all duration-200 shadow-sm">
          <p className="text-xs font-semibold text-outline mb-2.5 uppercase tracking-wider">Rewards Redeemed</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-on-surface tracking-tight">{redeemedRewardsCount}</h3>
            <span className="text-primary text-xs font-semibold flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4" />
              </svg>
              Milestones
            </span>
          </div>
        </div>
      </div>

      {/* Recent Stamp Scan History Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low flex items-center gap-2">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Recent Stamp Scan History
          </h4>
        </div>

        {recentStamps.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant text-sm bg-surface">
            No stamps awarded yet. Check-ins will appear here in real-time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-6 py-4 text-xs font-semibold text-outline uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold text-outline uppercase tracking-wider">Bill Number</th>
                  <th className="px-6 py-4 text-xs font-semibold text-outline uppercase tracking-wider">Bill Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-outline uppercase tracking-wider">Scanned At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant bg-surface">
                {recentStamps.map((stamp) => (
                  <tr
                    key={stamp._id}
                    className="hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-on-surface text-sm">
                        {stamp.customerId?.name || "Anonymous"}
                      </div>
                      <div className="text-xs text-on-surface-variant mt-0.5">
                        {stamp.customerId?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-on-surface text-sm">
                      {stamp.billNumber || "—"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-on-surface text-sm">
                      {stamp.amount ? `₹${stamp.amount}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs font-medium">
                      {new Date(stamp.createdAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
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
