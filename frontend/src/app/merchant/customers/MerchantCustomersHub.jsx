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
    <div className="space-y-8 text-slate-800 animate-fade-in-up">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-red-800 to-red-900 text-white p-6 rounded-3xl shadow-md">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Customer Database</h1>
          <p className="text-red-200 text-xs mt-1">
            Monitor enrollments, active streaks, and process free item rewards.
          </p>
        </div>
        <div className="bg-white/10 px-4 py-2.5 rounded-2xl border border-white/10 flex flex-col items-center min-w-[120px]">
          <span className="text-2xl font-black">{joinedCustomers.length}</span>
          <span className="text-[10px] text-red-200 uppercase font-extrabold tracking-wider">Total Members</span>
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
          className="w-full bg-white border border-slate-200/80 rounded-2xl py-3 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium placeholder-slate-400 shadow-sm transition-all"
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
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Enrolled Loyalty Customers
          </h3>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
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
                <div key={`${cust.customerId}-${cust.campaignId}`} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50/30 transition-colors">
                  {/* Left Column: Customer details & campaign */}
                  <div className="space-y-2.5 max-w-md">
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        {cust.name}
                        {cust.currentStreak > 0 && (
                          <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-black border border-amber-200/50">
                            🔥 {cust.currentStreak}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-450 mt-0.5">{cust.email}</div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-bold">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                        📋 {cust.campaignName || "Campaign"}
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                        ⚡ Scans: {cust.totalCheckins}
                      </span>
                      <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200/40">
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
                              className="flex items-center justify-between lg:justify-end gap-4 bg-slate-50 border border-slate-150 p-3 rounded-2xl"
                            >
                              <div className="text-left">
                                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                  <span>🎁</span> {reward.rewardTitle}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Unlocked on {new Date(reward.unlockedAt).toLocaleDateString()}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {reward.status === "pending" ? (
                                  <span className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-black rounded-lg uppercase tracking-wider animate-pulse flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-amber-500 animate-ping"></span>
                                    Pending
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-650 text-[9px] font-black rounded-lg uppercase tracking-wider">
                                    Ready
                                  </span>
                                )}
                                
                                <button
                                  onClick={() => handleApproveRedeem(reward._id)}
                                  disabled={loadingId !== null}
                                  className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-extrabold text-[10px] rounded-xl shadow-sm transition-all uppercase tracking-wider whitespace-nowrap"
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
      <div className="bg-white border border-slate-200/80 p-5 md:p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-black text-slate-900 mb-4">Recent Stamp Visits Log</h3>

        {recentStamps.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
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
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {recentStamps.map((stamp) => (
                  <tr key={stamp._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-xs md:text-sm text-slate-900">
                        {stamp.customerId?.name || "Anonymous Customer"}
                      </div>
                      <div className="text-[10px] md:text-xs text-slate-450">
                        {stamp.customerId?.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs md:text-sm">{stamp.billNumber}</td>
                    <td className="py-3 px-4 text-xs md:text-sm font-semibold">₹{stamp.amount}</td>
                    <td className="py-3 px-4 text-[10px] md:text-xs text-slate-450">
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
