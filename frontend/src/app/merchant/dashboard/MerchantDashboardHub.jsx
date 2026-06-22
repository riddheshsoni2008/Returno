"use client";

export default function MerchantDashboardHub({ business, metrics }) {
  const {
    uniqueCustomers = 0,
    redeemedRewardsCount = 0,
    recentStamps = [],
  } = metrics || {};

  return (
    <div className="space-y-8 text-slate-900 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome back, {business?.name || "Merchant"}
          </h1>
          <p className="text-sm text-slate-550 mt-1">
            Here is a summary of your loyalty customer actions and stamp check-ins.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            label: "Total Customers",
            value: uniqueCustomers,
            color: "text-purple-650 font-extrabold",
            desc: "Unique enrollments",
            icon: (
              <svg
                className="w-4 h-4 text-purple-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ),
          },
          {
            label: "Rewards Redeemed",
            value: redeemedRewardsCount,
            color: "text-emerald-650 font-extrabold",
            desc: "Milestones completed",
            icon: (
              <svg
                className="w-4 h-4 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            ),
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                {stat.label}
              </span>
              {stat.icon}
            </div>
            <div>
              <div
                className={`text-2xl font-extrabold text-slate-900 tracking-tight ${stat.color}`}
              >
                {stat.value}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                {stat.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Visits Logs */}
      <div className="bg-white border border-slate-150 p-5 md:p-6 rounded-3xl shadow-sm">
        <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-purple-500"
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
          Recent Stamp Scan History
        </h3>

        {recentStamps.length === 0 ? (
          <div className="text-center py-8 text-slate-450 text-sm">
            No stamps awarded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Bill Number</th>
                  <th className="py-3.5 px-4">Bill Amount</th>
                  <th className="py-3.5 px-4">Scanned At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-705">
                {recentStamps.map((stamp) => (
                  <tr
                    key={stamp._id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {stamp.customerId?.name || "Anonymous"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {stamp.customerId?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-650">
                      {stamp.billNumber || "—"}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {stamp.amount ? `₹${stamp.amount}` : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-medium">
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
