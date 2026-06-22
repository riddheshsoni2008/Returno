"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function MerchantCustomersHub({
  initialJoinedCustomers = [],
  initialRecentStamps = [],
}) {
  const router = useRouter();
  const [joinedCustomers, setJoinedCustomers] = useState(initialJoinedCustomers);
  const [recentStamps, setRecentStamps] = useState(initialRecentStamps);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const handleApproveRedeem = async (rewardId) => {
    setLoadingId(rewardId);
    setFeedback({ type: "", text: "" });

    try {
      const res = await apiFetch("/rewards/approve", {
        method: "POST",
        body: JSON.stringify({ rewardId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to approve redemption");
      }

      setFeedback({
        type: "success",
        text: "Reward successfully claimed & removed!",
      });

      // Update local state: remove the redeemed reward from the customer's rewards list
      setJoinedCustomers((prev) =>
        prev.map((cust) => {
          const updatedRewards = cust.rewards.map((r) =>
            r._id === rewardId ? { ...r, status: "redeemed" } : r
          );
          return { ...cust, rewards: updatedRewards };
        })
      );

      setTimeout(() => setFeedback({ type: "", text: "" }), 3000);
      router.refresh();
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
      setTimeout(() => setFeedback({ type: "", text: "" }), 4000);
    } finally {
      setLoadingId(null);
    }
  };

  // Filter joined customers based on search query
  const filteredCustomers = joinedCustomers.filter((cust) => {
    const nameMatch = cust.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const emailMatch = cust.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const campaignMatch = cust.campaignName?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    return nameMatch || emailMatch || campaignMatch;
  });

  return (
    <div className="space-y-8 text-slate-900 animate-fade-in-up pb-10">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white p-6 md:p-8 rounded-3xl shadow-lg border border-purple-800/20">
        <div>
          <span className="px-2.5 py-1 bg-white/10 text-purple-200 font-extrabold text-[9px] uppercase tracking-widest rounded-full border border-white/10">
            👥 Members Directory
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-2.5">Customer Database</h1>
          <p className="text-purple-200/80 text-xs mt-1 font-medium">
            Monitor enrollments, active streaks, and process free item rewards.
          </p>
        </div>
        <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/10 flex flex-col items-center min-w-[130px] shadow-sm">
          <span className="text-3xl font-black tracking-tight">{joinedCustomers.length}</span>
          <span className="text-[9px] text-purple-200 uppercase font-extrabold tracking-widest mt-0.5">Total Members</span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="relative max-w-md">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Search by name, email, or campaign..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-150 rounded-2xl py-3.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 font-medium placeholder-slate-400 shadow-sm transition-all"
        />
      </div>

      {/* Feedback Alert */}
      {feedback.text && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-100 text-emerald-600"
              : "bg-red-50 border-red-100 text-red-600"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Main Customers List */}
      <div className="bg-white border border-slate-150 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
            Enrolled Loyalty Customers
          </h3>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-slate-450 text-xs">
            No enrolled customers found matching your query.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCustomers.map((cust) => {
              // Only display unredeemed or pending rewards
              const activeRewards = cust.rewards.filter(
                (r) => r.status === "unredeemed" || r.status === "pending"
              );

              return (
                <div key={`${cust.customerId}-${cust.campaignId}`} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50/30 transition-colors">
                  {/* Left Column: Customer details & campaign */}
                  <div className="space-y-2.5 max-w-md">
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        {cust.name}
                        {cust.currentStreak > 0 && (
                          <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 px-2 py-0.5 rounded-lg text-[9px] font-black border border-amber-200/50">
                            🔥 {cust.currentStreak} check-ins
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-450 mt-0.5 font-medium">{cust.email}</div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-bold">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/50">
                        📋 {cust.campaignName || "Campaign"}
                      </span>
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/50">
                        ⚡ Scans: {cust.totalCheckins}
                      </span>
                      <span className="bg-purple-50 text-purple-750 px-2.5 py-1 rounded-lg border border-purple-100/50">
                        🔄 Completed: {cust.cyclesRefreshed} {cust.cyclesRefreshed === 1 ? "time" : "times"}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Won Rewards / Actions */}
                  <div className="flex-1 max-w-lg lg:text-right">
                    <div className="flex flex-col lg:items-end gap-3">
                      {activeRewards.length === 0 ? (
                        <div className="text-[11px] text-slate-400 font-semibold italic">
                          No active rewards won yet
                        </div>
                      ) : (
                        <div className="w-full flex flex-col gap-2.5">
                          {activeRewards.map((reward) => (
                            <div
                              key={reward._id}
                              className="flex items-center justify-between lg:justify-end gap-4 bg-purple-50/30 border border-purple-100/50 p-3 rounded-2xl"
                            >
                              <div className="text-left">
                                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                  <span>🎁</span> {reward.rewardTitle}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                  Unlocked on {new Date(reward.unlockedAt).toLocaleDateString()}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {reward.status === "pending" ? (
                                  <span className="px-2 py-1 bg-amber-50 border border-amber-250 text-amber-700 text-[9px] font-black rounded-lg uppercase tracking-wider animate-pulse flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                    Pending
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-black rounded-lg uppercase tracking-wider">
                                    Ready
                                  </span>
                                )}
                                
                                <button
                                  onClick={() => handleApproveRedeem(reward._id)}
                                  disabled={loadingId !== null}
                                  className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-550 disabled:opacity-50 text-white font-extrabold text-[10px] rounded-xl shadow-sm transition-all uppercase tracking-wider whitespace-nowrap"
                                >
                                  {loadingId === reward._id ? "Claiming..." : "Collect Item"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Visits Table */}
      <div className="bg-white border border-slate-150 p-5 md:p-6 rounded-3xl shadow-sm">
        <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Stamp Visits Log
        </h3>

        {recentStamps.length === 0 ? (
          <div className="text-center py-12 text-slate-450 text-sm">
            No customer visits logged yet. Share your scan codes to onboard customers.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-3 px-4">Customer Info</th>
                  <th className="py-3 px-4">Bill Details</th>
                  <th className="py-3 px-4">Transaction Amount</th>
                  <th className="py-3 px-4">Scanned At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-705">
                {recentStamps.map((stamp) => (
                  <tr key={stamp._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {stamp.customerId?.name || "Anonymous Customer"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {stamp.customerId?.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{stamp.billNumber || "—"}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{stamp.amount ? `₹${stamp.amount}` : "—"}</td>
                    <td className="py-3 px-4 text-slate-400 font-medium">
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
