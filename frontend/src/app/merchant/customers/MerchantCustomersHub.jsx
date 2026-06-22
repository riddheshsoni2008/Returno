"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function MerchantCustomersHub({
  initialJoinedCustomers = [],
  initialRecentStamps = [],
}) {
  const router = useRouter();
  const [joinedCustomers, setJoinedCustomers] = useState(
    initialJoinedCustomers,
  );
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
            r._id === rewardId ? { ...r, status: "redeemed" } : r,
          );
          return { ...cust, rewards: updatedRewards };
        }),
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
    const nameMatch =
      cust.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const emailMatch =
      cust.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const campaignMatch =
      cust.campaignName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false;
    return nameMatch || emailMatch || campaignMatch;
  });

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-bg-card border border-border-standard p-6 md:p-8 rounded-xl shadow-sm">
        <div>
          <span className="px-2.5 py-1 bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-wider rounded-md border border-primary/20">
            Members Directory
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mt-3">
            Customer Database
          </h1>
          <p className="text-text-secondary text-xs mt-1.5 font-medium">
            Monitor active customer enrollments, streaks, and stamp collections.
          </p>
        </div>
        <div className="bg-bg-page px-6 py-4 rounded-xl border border-border-standard flex flex-col items-center min-w-[140px] shadow-sm">
          <span className="text-3xl font-bold text-primary tracking-tight">
            {joinedCustomers.length}
          </span>
          <span className="text-[10px] text-text-muted uppercase font-semibold tracking-wider mt-1">
            Total Members
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">
          🔍
        </span>
        <input
          type="text"
          placeholder="Search by name, email, or campaign..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-bg-card border border-border-standard rounded-lg py-3 pl-10 pr-4 text-xs text-black focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium placeholder-outline shadow-sm transition-all"
        />
      </div>

      {/* Feedback Alert */}
      {feedback.text && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold border shadow-sm animate-fade-in-up ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-150 text-secondary"
              : "bg-red-50 border-red-150 text-error"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Main Customers List */}
      <div className="bg-bg-card border border-border-standard rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border-standard bg-bg-page flex items-center gap-2">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Enrolled Loyalty Customers
          </h3>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-text-secondary text-sm bg-bg-card">
            No enrolled customers found matching your search.
          </div>
        ) : (
          <div className="divide-y divide-outline-variant bg-bg-card">
            {filteredCustomers.map((cust) => {
              // Only display unredeemed or pending rewards
              const activeRewards = cust.rewards.filter(
                (r) => r.status === "unredeemed" || r.status === "pending",
              );

              return (
                <div
                  key={`${cust.customerId}-${cust.campaignId}`}
                  className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-surface-container-low/55 transition-colors"
                >
                  {/* Customer details & campaign */}
                  <div className="space-y-3 max-w-md">
                    <div>
                      <div className="font-bold text-text-primary text-base flex items-center gap-2">
                        {cust.name}
                        {cust.currentStreak > 0 && (
                          <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 px-2.5 py-0.5 rounded-md text-[10px] font-bold border border-amber-250/50 shadow-sm">
                            🔥 {cust.currentStreak} check-ins
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5 font-medium">
                        {cust.email}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[10px] text-text-muted font-semibold">
                      <span className="bg-bg-page px-2.5 py-1 rounded border border-border-standard">
                        📋 {cust.campaignName || "Campaign"}
                      </span>
                      <span className="bg-bg-page px-2.5 py-1 rounded border border-border-standard">
                        ⚡ Scans: {cust.totalCheckins}
                      </span>
                      <span className="bg-primary/5 text-primary px-2.5 py-1 rounded border border-primary/10">
                        🔄 Completed: {cust.cyclesRefreshed}{" "}
                        {cust.cyclesRefreshed === 1 ? "time" : "times"}
                      </span>
                    </div>
                  </div>

                  {/* Won Rewards / Actions */}
                  <div className="flex-1 max-w-lg lg:text-right">
                    <div className="flex flex-col lg:items-end gap-3">
                      {activeRewards.length === 0 ? (
                        <div className="text-xs text-text-muted font-semibold italic">
                          No active rewards won yet
                        </div>
                      ) : (
                        <div className="w-full flex flex-col gap-2.5">
                          {activeRewards.map((reward) => (
                            <div
                              key={reward._id}
                              className="flex items-center justify-between lg:justify-end gap-4 bg-bg-page border border-border-standard p-3.5 rounded-xl shadow-sm"
                            >
                              <div className="text-left">
                                <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                                  <span>🎁</span> {reward.rewardTitle}
                                </div>
                                <div className="text-[10px] text-text-muted mt-0.5 font-medium">
                                  Unlocked on{" "}
                                  {new Date(
                                    reward.unlockedAt,
                                  ).toLocaleDateString()}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {reward.status === "pending" ? (
                                  <span className="px-2 py-1 bg-amber-50 border border-amber-250 text-amber-700 text-[9px] font-black rounded uppercase tracking-wider animate-pulse flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                    Pending
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-surface-container border border-border-standard text-text-secondary text-[9px] font-bold rounded uppercase tracking-wider">
                                    Ready
                                  </span>
                                )}

                                <button
                                  onClick={() =>
                                    handleApproveRedeem(reward._id)
                                  }
                                  disabled={loadingId !== null}
                                  className="px-3.5 py-1.5 bg-primary text-on-primary hover:bg-opacity-95 disabled:opacity-80 font-bold text-[10px] rounded-lg shadow-sm transition-all uppercase tracking-wider whitespace-nowrap"
                                >
                                  {loadingId === reward._id
                                    ? "Claiming..."
                                    : "Collect Item"}
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
      <div className="bg-bg-card border border-border-standard p-5 md:p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
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
          Recent Stamp Visits Log
        </h3>

        {recentStamps.length === 0 ? (
          <div className="text-center py-12 text-text-secondary text-sm bg-bg-card">
            No customer visits logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-page border-b border-border-standard text-xs font-semibold text-text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-4">Customer Info</th>
                  <th className="py-3.5 px-4">Bill Details</th>
                  <th className="py-3.5 px-4">Transaction Amount</th>
                  <th className="py-3.5 px-4">Scanned At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-xs text-text-primary bg-bg-card">
                {recentStamps.map((stamp) => (
                  <tr
                    key={stamp._id}
                    className="hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary">
                        {stamp.customerId?.name || "Anonymous Customer"}
                      </div>
                      <div className="text-[10px] text-text-secondary mt-0.5 font-medium">
                        {stamp.customerId?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-text-secondary">
                      {stamp.billNumber || "—"}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-text-primary">
                      {stamp.amount ? `₹${stamp.amount}` : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary font-medium">
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
