"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import QRScannerModal from "./QRScannerModal";

// Premium gold gradient Star Icon
const ShinyStar = ({ filled, className = "" }) => {
  if (!filled) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`text-gray-300 stroke-[1.5] ${className}`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499c.198-.39.73-.39.927 0l2.184 4.3c.092.18.272.31.479.33l4.885.69c.43.06.6.578.29.87l-3.535 3.32a.777.777 0 00-.226.68l.835 4.74a.524.524 0 01-.75.534l-4.37-2.22a.777.777 0 00-.712 0l-4.37 2.22a.524.524 0 01-.75-.534l.835-4.74a.777.777 0 00-.226-.68L3.25 9.69c-.31-.29-.14-.808.29-.87l4.885-.69c.207-.02.387-.15.479-.33l2.184-4.3z"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`text-[#F59E0B] drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)] ${className}`}
    >
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

export default function WalletHub({
  user,
  initialCards,
  initialRewards,
  initialExploreCampaigns = [],
  initialCheckins = [],
}) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [rewards, setRewards] = useState(initialRewards);
  const [exploreCampaigns, setExploreCampaigns] = useState(initialExploreCampaigns);
  const [checkins, setCheckins] = useState(initialCheckins);

  // Tab State: 'home', 'rewards', 'scan', 'activity', 'profile'
  const [activeTab, setActiveTab] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const [loadingId, setLoadingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showScanModal, setShowScanModal] = useState(false);

  // Group rewards
  const activeRewards = rewards.filter(
    (r) => r.status === "unredeemed" || r.status === "pending"
  );
  const claimedRewards = rewards.filter((r) => r.status === "redeemed");

  // Sum total points
  const totalPoints = cards.reduce((acc, c) => acc + (c.totalPoints || 0), 0);

  // Calculate membership tier level name
  let tierName = "Standard Member";
  if (totalPoints >= 1000) tierName = "Elite Gold Member";
  else if (totalPoints >= 400) tierName = "Silver Member";

  // Auto milestone progress on home tab (e.g. progress on the card closest to completion)
  const mostProgressedCard = cards.length > 0 
    ? [...cards].sort((a, b) => (b.currentStamps / b.campaign.requiredStamps) - (a.currentStamps / a.campaign.requiredStamps))[0]
    : null;

  const handleRequestRedeem = async (rewardId) => {
    setLoadingId(rewardId);
    setFeedback({ type: "", text: "" });

    try {
      const res = await apiFetch("/rewards/redeem", {
        method: "POST",
        body: JSON.stringify({ rewardId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to request redemption");
      }

      setFeedback({
        type: "success",
        text: "Redemption requested! Hand your device to the shop staff.",
      });

      setRewards(
        rewards.map((r) =>
          r._id === rewardId ? { ...r, status: "pending" } : r
        )
      );
      setTimeout(() => setFeedback({ type: "", text: "" }), 4000);
      router.refresh();
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setLoadingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/me", { method: "POST" });
    } catch (err) {
      console.error("Logout API failed, logging out locally:", err);
    } finally {
      if (typeof document !== "undefined") {
        document.cookie =
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
        try {
          localStorage.removeItem("token");
        } catch (err) {
          // Ignore
        }
      }
      router.push("/");
      router.refresh();
    }
  };

  const exploreList = [
    ...cards.map((c) => ({
      ...c.campaign,
      currentStamps: c.currentStamps,
      hasCard: true,
      totalEarned: c.totalEarned,
    })),
    ...exploreCampaigns.map((e) => ({
      ...e.campaign,
      currentStamps: 0,
      hasCard: false,
      totalEarned: 0,
    })),
  ];

  const filteredExplore = exploreList.filter((item) => {
    const nameMatch = item.businessId?.name?.toLowerCase() || "";
    const titleMatch = item.title?.toLowerCase() || "";
    const descMatch = item.description?.toLowerCase() || "";
    const categoryMatch = item.businessId?.category?.toLowerCase() || "retail";

    const matchesSearch =
      nameMatch.includes(searchQuery.toLowerCase()) ||
      titleMatch.includes(searchQuery.toLowerCase()) ||
      descMatch.includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === "All" ||
      categoryMatch === activeCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-[#111827]">
      {/* DESKTOP STICKY NAVBAR */}
      <header className="hidden md:block bg-white border-b border-[#E5E7EB] sticky top-0 z-30 w-full shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-[#111827]"
            >
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563EB] to-blue-500 flex items-center justify-center text-sm text-white shadow-md">
                ✨
              </span>
              Returno
            </Link>

            <nav className="flex gap-1">
              {[
                { id: "home", label: "Home" },
                { id: "rewards", label: "Rewards" },
                { id: "activity", label: "Activity" },
                { id: "profile", label: "Profile" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-[#2563EB] shadow-sm border border-blue-100/50"
                      : "text-[#4B5563] hover:bg-slate-50 hover:text-[#111827]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowScanModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-tr from-[#2563EB] to-blue-500 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all uppercase tracking-wider"
            >
              <span>📷</span> Scan QR Code
            </button>
            <div className="h-6 w-[1px] bg-[#E5E7EB]"></div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-150 text-[#2563EB] font-bold flex items-center justify-center text-xs border border-blue-200">
                {user?.name?.[0]?.toUpperCase() || "C"}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-[#111827] leading-none">
                  {user.name}
                </div>
                <div className="text-[10px] text-[#4B5563] mt-0.5">
                  {user.email}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-[#4B5563] hover:text-[#2563EB] transition-colors ml-2"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-grow w-full max-w-md mx-auto px-4 py-6 pb-28 md:max-w-6xl md:px-6 md:py-8 md:pb-12">
        {/* Alerts / Feedback */}
        {feedback.text && (
          <div className="mb-4">
            <div
              className={`p-4 rounded-2xl text-xs font-bold ${
                feedback.type === "success"
                  ? "bg-emerald-50 border border-emerald-100 text-[#10B981]"
                  : "bg-red-50 border border-red-150 text-red-600"
              }`}
            >
              {feedback.text}
            </div>
          </div>
        )}

        {/* TAB 1: CUSTOMER HOME SCREEN */}
        {activeTab === "home" && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Welcome Section */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-[#111827]">
                  Hello, {user.name} 👋
                </h1>
                <p className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider mt-0.5">
                  {tierName}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-[#E5E7EB] flex items-center justify-center text-sm font-bold text-[#2563EB]">
                {user?.name?.[0]?.toUpperCase() || "C"}
              </div>
            </div>

            {/* Large Points Balance Card */}
            <div className="bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-blue-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[160px]">
              {/* Subtle background decoration */}
              <div className="absolute top-[-30px] right-[-30px] w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
              <div className="absolute bottom-[-20px] left-[10%] w-20 h-20 bg-blue-400/20 rounded-full blur-lg pointer-events-none"></div>

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                    Total Balance
                  </span>
                  <div className="text-4xl font-extrabold tracking-tight mt-1 flex items-baseline gap-1">
                    {totalPoints}
                    <span className="text-xs font-bold uppercase opacity-90">pts</span>
                  </div>
                </div>
                <div className="bg-white/15 px-3 py-1 rounded-full border border-white/10 text-[9px] font-bold uppercase tracking-wider">
                  🔥 {cards.length} Active Cards
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-4">
                <p className="text-[10px] opacity-90 font-medium max-w-[200px]">
                  Collect stamps at partner outlets to unlock rewards automatically
                </p>
                <button
                  onClick={() => setShowScanModal(true)}
                  className="bg-white text-[#2563EB] font-bold text-[10px] uppercase tracking-wider py-2 px-3.5 rounded-xl shadow-md hover:bg-slate-50 transition-all flex items-center gap-1.5"
                >
                  📷 Scan Now
                </button>
              </div>
            </div>

            {/* Reward Progress Tracker (Starbucks Style) */}
            {mostProgressedCard ? (
              <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                      Closest Milestone
                    </h3>
                    <p className="text-[11px] text-[#4B5563] mt-0.5 font-semibold">
                      {mostProgressedCard.campaign.businessId?.name}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-100/50 px-2.5 py-1 rounded-full">
                    {mostProgressedCard.currentStamps} / {mostProgressedCard.campaign.requiredStamps} Stamps
                  </span>
                </div>

                {/* Star visual progress bar */}
                <div className="flex items-center justify-between gap-1 bg-slate-50 border border-[#E5E7EB] p-3 rounded-2xl">
                  {Array.from({ length: mostProgressedCard.campaign.requiredStamps }).map((_, idx) => {
                    const isStamped = idx < mostProgressedCard.currentStamps;
                    return (
                      <div
                        key={idx}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
                          isStamped ? "border-amber-200 bg-amber-50" : "border-[#E5E7EB] bg-white"
                        }`}
                      >
                        <ShinyStar filled={isStamped} className="w-4 h-4" />
                      </div>
                    );
                  })}
                </div>

                <div className="text-[10px] text-[#4B5563] font-medium leading-relaxed">
                  🎁 Next Unlock: <span className="font-bold text-[#111827]">{mostProgressedCard.campaign.rewardTitle}</span>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 text-center shadow-sm space-y-3">
                <div className="text-2xl">🏆</div>
                <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                  No Active Progress
                </h3>
                <p className="text-xs text-[#4B5563] max-w-xs mx-auto">
                  Find partner shops below and scan their QR code to begin collecting stamps and earn milestones.
                </p>
              </div>
            )}

            {/* Filter pills & Carousel / Grid Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                  Partner Shops Near You
                </h2>
                <div className="relative max-w-[150px]">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-[#E5E7EB] rounded-lg py-1 px-2.5 pl-7 text-[11px] text-[#111827] focus:outline-none focus:border-[#2563EB]"
                  />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                    🔍
                  </span>
                </div>
              </div>

              {/* Category Pills horizontal list */}
              <div className="overflow-x-auto scrollbar-hide py-1 flex gap-2">
                {["All", "Restaurant", "Coffee", "Salon", "Gym", "Retail"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all whitespace-nowrap ${
                      activeCategory === cat
                        ? "bg-[#2563EB] border-[#2563EB] text-white shadow-sm"
                        : "bg-white border-[#E5E7EB] text-[#4B5563] hover:bg-slate-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Active Campaigns List */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredExplore.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedCampaign(item)}
                    className="bg-white border border-[#E5E7EB] rounded-3xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] font-bold text-sm flex-shrink-0">
                        {item.businessId?.name?.[0]?.toUpperCase() || "B"}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <div className="flex items-center gap-1">
                          <h4 className="text-xs font-bold text-[#111827] truncate">
                            {item.businessId?.name}
                          </h4>
                          <span className="text-[10px] text-[#2563EB] flex-shrink-0">✔</span>
                        </div>
                        <p className="text-[11px] text-[#4B5563] font-semibold truncate mt-0.5">
                          {item.title}
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl p-2.5 flex items-center justify-between text-[10px]">
                      <span className="text-[#4B5563] font-medium">Reward:</span>
                      <span className="font-bold text-[#2563EB] truncate max-w-[150px]">
                        {item.rewardTitle}
                      </span>
                    </div>

                    {item.hasCard ? (
                      <div className="flex justify-between items-center text-[10px] text-[#4B5563] font-bold pt-1.5 border-t border-[#E5E7EB]">
                        <span>Stamps: {item.currentStamps} / {item.requiredStamps}</span>
                        <span className="text-[#10B981]">Active membership</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-[10px] text-[#4B5563] font-bold pt-1.5 border-t border-[#E5E7EB]">
                        <span>Goal: {item.requiredStamps} Stamps</span>
                        <span className="text-[#2563EB]">New Campaign</span>
                      </div>
                    )}
                  </div>
                ))}

                {filteredExplore.length === 0 && (
                  <p className="text-center py-10 text-xs text-[#4B5563] col-span-full">
                    No active loyalty programs found matching search filters.
                  </p>
                )}
              </div>
            </div>

            {/* Quick Activity Timeline Preview */}
            {checkins.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                    Recent Activity
                  </h3>
                  <button
                    onClick={() => setActiveTab("activity")}
                    className="text-xs font-bold text-[#2563EB] hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-3xl p-4 divide-y divide-[#E5E7EB]">
                  {checkins.slice(0, 3).map((item) => (
                    <div key={item._id} className="py-2.5 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-[#111827]">
                          {item.campaignId?.title || "Check-In Visit"}
                        </div>
                        <p className="text-[10px] text-[#4B5563] mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                          +{item.pointsAwarded} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REWARDS SCREEN */}
        {activeTab === "rewards" && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <h1 className="text-xl font-bold text-[#111827]">My Rewards</h1>
              <p className="text-xs text-[#4B5563]">Manage and redeem your loyalty achievements</p>
            </div>

            {/* Unlocked rewards tickets list */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                Unlocked Coupons
              </h2>

              {activeRewards.length === 0 ? (
                <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 text-center text-xs text-[#4B5563]">
                  No unlocked coupons. Collect more stamps to claim rewards!
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {activeRewards.map((reward) => (
                    <div
                      key={reward._id}
                      className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between min-h-[140px] relative border-l-4 border-l-[#2563EB]"
                    >
                      {/* Ticket cutouts on borders */}
                      <div className="absolute top-1/2 -left-2.5 -translate-y-1/2 w-5 h-5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-full z-10"></div>
                      <div className="absolute top-1/2 -right-2.5 -translate-y-1/2 w-5 h-5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-full z-10"></div>

                      <div className="p-5 flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-bold text-[#2563EB] bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Ready to Claim
                          </span>
                          <h3 className="text-sm font-bold text-[#111827] mt-2">
                            {reward.rewardTitle}
                          </h3>
                          <p className="text-[10px] text-[#4B5563] mt-0.5">
                            Unlocked {new Date(reward.unlockedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-3xl">🎁</div>
                      </div>

                      <div className="bg-slate-50/80 px-5 py-3 border-t border-[#E5E7EB] flex justify-between items-center">
                        <span className="text-[10px] text-[#4B5563] font-medium">Redeem in-store</span>
                        {reward.status === "unredeemed" ? (
                          <button
                            onClick={() => handleRequestRedeem(reward._id)}
                            disabled={loadingId !== null}
                            className="bg-[#2563EB] hover:opacity-95 text-white font-bold text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg shadow-sm"
                          >
                            Redeem
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-[#F59E0B] animate-pulse">
                            Pending Shop Approval...
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Locked rewards section */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                Locked Milestones (In Progress)
              </h2>

              {cards.filter((c) => c.currentStamps < c.campaign.requiredStamps).length === 0 ? (
                <p className="text-xs text-[#4B5563] italic">No active milestones in progress.</p>
              ) : (
                <div className="space-y-3">
                  {cards
                    .filter((c) => c.currentStamps < c.campaign.requiredStamps)
                    .map((c) => {
                      const stampsLeft = c.campaign.requiredStamps - c.currentStamps;
                      return (
                        <div
                          key={c.campaign._id}
                          className="bg-white border border-[#E5E7EB] rounded-3xl p-4 flex items-center justify-between shadow-sm gap-4"
                        >
                          <div className="min-w-0 flex-grow">
                            <h3 className="text-xs font-bold text-[#111827] truncate">
                              {c.campaign.rewardTitle}
                            </h3>
                            <p className="text-[10px] text-[#4B5563] truncate mt-0.5">
                              at {c.campaign.businessId?.name}
                            </p>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden max-w-[200px]">
                              <div
                                className="bg-[#2563EB] h-1.5 rounded-full"
                                style={{
                                  width: `${(c.currentStamps / c.campaign.requiredStamps) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="inline-block text-[9px] font-bold bg-slate-100 text-[#4B5563] px-2 py-0.5 rounded-full uppercase tracking-wider">
                              🔒 Locked
                            </span>
                            <p className="text-[10px] text-[#4B5563] font-medium mt-1">
                              {stampsLeft} stamps left
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Redemption History List */}
            {claimedRewards.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                  Redemption History
                </h3>
                <div className="bg-white border border-[#E5E7EB] rounded-3xl p-4 divide-y divide-[#E5E7EB] shadow-sm">
                  {claimedRewards.map((reward) => (
                    <div key={reward._id} className="py-2.5 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-[#111827]">
                          {reward.rewardTitle}
                        </div>
                        <p className="text-[10px] text-[#4B5563] mt-0.5">
                          Redeemed on {new Date(reward.redeemedAt || reward.unlockedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Completed
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SCAN SCREEN */}
        {activeTab === "scan" && (
          <div className="space-y-6 text-center py-8 max-w-sm mx-auto animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-[#2563EB] text-2xl shadow-sm">
              📷
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-[#111827]">Primary Scanner</h1>
              <p className="text-xs text-[#4B5563] max-w-xs mx-auto leading-relaxed">
                Aim your device at the vendor check-in QR code to instantly verify your visit and add stamp progress.
              </p>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-sm space-y-5">
              {/* Scan Area mock decoration */}
              <div className="w-48 h-48 border-2 border-dashed border-[#2563EB] rounded-2xl mx-auto flex items-center justify-center relative overflow-hidden bg-slate-50">
                <div className="w-full h-0.5 bg-[#2563EB] shadow-[0_0_8px_#2563EB] absolute top-1/2 -translate-y-1/2 left-0 animate-[bounce_3s_infinite_ease-in-out]"></div>
                <span className="text-3xl opacity-30 select-none">QR</span>
              </div>

              <button
                onClick={() => setShowScanModal(true)}
                className="w-full py-3 bg-[#2563EB] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider"
              >
                Launch QR Camera
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: ACTIVITY LOG SCREEN */}
        {activeTab === "activity" && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <h1 className="text-xl font-bold text-[#111827]">Activity Log</h1>
              <p className="text-xs text-[#4B5563]">A complete timeline of your check-ins and rewards earned</p>
            </div>

            {checkins.length === 0 ? (
              <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 text-center text-xs text-[#4B5563]">
                No check-in activity recorded yet.
              </div>
            ) : (
              <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 shadow-sm space-y-6">
                <div className="relative border-l-2 border-[#E5E7EB] pl-6 space-y-6">
                  {checkins.map((item) => (
                    <div key={item._id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-[#2563EB] border-2 border-white shadow-sm"></div>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="font-bold text-[#111827] text-sm">
                            {item.campaignId?.title || "Shop Stamp Earned"}
                          </div>
                          <p className="text-[10px] text-[#4B5563] mt-0.5">
                            Checked in at partner outlet
                          </p>
                          {item.streakAtCheckin > 1 && (
                            <span className="inline-block mt-1 text-[9px] font-bold text-[#F59E0B] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-wider">
                              🔥 {item.streakAtCheckin}-Day Streak
                            </span>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="font-bold text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 text-xs">
                            +{item.pointsAwarded} PTS
                          </span>
                          <p className="text-[10px] text-[#4B5563] mt-1">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROFILE SCREEN */}
        {activeTab === "profile" && (
          <div className="space-y-6 max-w-md mx-auto animate-fade-in-up">
            {/* Airbnb Style profile card */}
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-lg text-[#2563EB]">
                  {user?.name?.[0]?.toUpperCase() || "C"}
                </div>
                <div>
                  <h3 className="font-bold text-[#111827] text-base">{user.name}</h3>
                  <p className="text-xs text-[#4B5563]">{user.email}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-[#E5E7EB] text-center">
                <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl p-2.5">
                  <div className="text-base font-extrabold text-[#2563EB]">{totalPoints}</div>
                  <div className="text-[9px] text-[#4B5563] font-bold uppercase tracking-wider mt-0.5">
                    Points
                  </div>
                </div>
                <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl p-2.5">
                  <div className="text-base font-extrabold text-[#111827]">{cards.length}</div>
                  <div className="text-[9px] text-[#4B5563] font-bold uppercase tracking-wider mt-0.5">
                    Cards
                  </div>
                </div>
                <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl p-2.5">
                  <div className="text-base font-extrabold text-[#10B981]">{claimedRewards.length}</div>
                  <div className="text-[9px] text-[#4B5563] font-bold uppercase tracking-wider mt-0.5">
                    Redeemed
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E5E7EB] pt-4 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#4B5563] font-semibold">Tier Level</span>
                  <span className="font-bold text-[#2563EB]">{tierName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#4B5563] font-semibold">Active Memberships</span>
                  <span className="font-bold text-[#111827]">{cards.length} programs</span>
                </div>
              </div>
            </div>

            {/* Clean Mock Settings List */}
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider pb-2 border-b border-[#E5E7EB]">
                Account Settings
              </h3>

              <div className="space-y-3.5 text-xs font-semibold text-[#4B5563]">
                <div className="flex justify-between items-center cursor-pointer hover:text-[#111827] transition-colors">
                  <span>🔔 Push Notifications</span>
                  <span className="text-xs text-[#2563EB]">Enabled</span>
                </div>
                <div className="flex justify-between items-center cursor-pointer hover:text-[#111827] transition-colors">
                  <span>📍 Location Services</span>
                  <span className="text-xs text-[#10B981]">Active</span>
                </div>
                <div className="flex justify-between items-center cursor-pointer hover:text-[#111827] transition-colors">
                  <span>📄 Terms of Service</span>
                  <span>➔</span>
                </div>
                <div className="flex justify-between items-center cursor-pointer hover:text-[#111827] transition-colors">
                  <span>🛡️ Privacy Policy</span>
                  <span>➔</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors border border-red-200/50 text-center uppercase tracking-wider"
            >
              🚪 Sign Out Account
            </button>
          </div>
        )}
      </main>

      {/* MOBILE STICKY BOTTOM NAV BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] px-4 py-2.5 flex justify-between items-center z-45 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${
            activeTab === "home" ? "text-[#2563EB] scale-105" : "text-[#4B5563] hover:text-[#111827]"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-[9px] font-bold tracking-wide">Home</span>
        </button>

        <button
          onClick={() => setActiveTab("rewards")}
          className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${
            activeTab === "rewards" ? "text-[#2563EB] scale-105" : "text-[#4B5563] hover:text-[#111827]"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0h4a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h4"
            />
          </svg>
          <span className="text-[9px] font-bold tracking-wide">Rewards</span>
        </button>

        {/* Floating Scan center button */}
        <div className="flex-shrink-0 -translate-y-4">
          <button
            onClick={() => setShowScanModal(true)}
            className="bg-[#2563EB] text-white rounded-full p-4 shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all border-4 border-white"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v1m6 11h2m-6 0h-2v4m0-4v-4m-6 10h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>

        <button
          onClick={() => setActiveTab("activity")}
          className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${
            activeTab === "activity" ? "text-[#2563EB] scale-105" : "text-[#4B5563] hover:text-[#111827]"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-[9px] font-bold tracking-wide">Activity</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${
            activeTab === "profile" ? "text-[#2563EB] scale-105" : "text-[#4B5563] hover:text-[#111827]"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-[9px] font-bold tracking-wide">Profile</span>
        </button>
      </nav>

      {/* DETAIL MODAL popup (gorgeous Airbnb style) */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-slate-50/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative overflow-hidden border border-[#E5E7EB] animate-scale-in space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#2563EB]">
                {selectedCampaign.businessId?.category || "Retail"}
              </span>
              <span className="text-[10px] text-[#4B5563] font-bold bg-slate-100 px-2.5 py-1 rounded-full">
                Goal: {selectedCampaign.requiredStamps} stamps
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-extrabold text-lg shadow-sm border border-blue-600">
                {selectedCampaign.businessId?.name?.[0]?.toUpperCase() || "B"}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111827]">
                  {selectedCampaign.businessId?.name}
                </h3>
                {selectedCampaign.businessId?.address && (
                  <p className="text-[10px] text-[#4B5563] font-medium mt-0.5">
                    📍 {selectedCampaign.businessId.address}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-[#111827] uppercase tracking-wide">
                {selectedCampaign.title}
              </h4>
              <p className="text-[#4B5563] text-xs leading-relaxed">
                {selectedCampaign.description}
              </p>
            </div>

            <div className="bg-[#FAFAFA] border border-[#E5E7EB] p-4 rounded-2xl flex items-center gap-3">
              <span className="text-xl">🎁</span>
              <div>
                <span className="text-[9px] text-[#6B7280] font-bold uppercase tracking-wider block">
                  Earn Reward Milestone
                </span>
                <span className="text-xs font-bold text-[#111827]">
                  {selectedCampaign.rewardTitle}
                </span>
              </div>
            </div>

            {/* Stamps progress grid (Only if visited) */}
            {selectedCampaign.hasCard && selectedCampaign.currentStamps > 0 && (
              <div className="space-y-2">
                <span className="text-[9px] text-[#6B7280] font-bold uppercase tracking-wider block">
                  Stamp Card Progress
                </span>
                <div className="grid grid-cols-5 gap-2 bg-[#FAFAFA] border border-[#E5E7EB] p-3 rounded-2xl">
                  {Array.from({ length: selectedCampaign.requiredStamps }).map((_, idx) => {
                    const isStamped = idx < selectedCampaign.currentStamps;
                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-lg flex items-center justify-center border transition-all ${
                          isStamped ? "border-amber-200 bg-amber-50" : "border-[#E5E7EB] bg-white"
                        }`}
                      >
                        <ShinyStar filled={isStamped} className="w-2/3 h-2/3" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-[10px] text-center text-[#6B7280] leading-normal font-bold">
              Scan the outlet&apos;s QR code to collect stamp checks automatically.
            </p>

            <button
              onClick={() => {
                setSelectedCampaign(null);
                setShowScanModal(true);
              }}
              className="w-full py-3 bg-[#2563EB] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2"
            >
              📷 Scan in-store
            </button>

            <button
              onClick={() => setSelectedCampaign(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-xl transition-all uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* SCANNER POPUP MODAL */}
      {showScanModal && (
        <QRScannerModal onClose={() => setShowScanModal(false)} />
      )}
    </div>
  );
}
