"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import QRScannerModal from './QRScannerModal';

// Reuse our custom 3D Star SVG
const ThreeDStar = ({ filled, className = "" }) => {
  if (!filled) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`text-slate-200 ${className}`}>
        <path
          d="M12 2L14.2 8.9L21.5 8.9L15.6 13.2L17.9 20.1L12 15.8L6.1 20.1L8.4 13.2L2.5 8.9L9.8 8.9Z"
          fill="rgba(0,0,0,0.01)"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={`drop-shadow-[0_0_12px_rgba(234,179,8,0.6)] ${className}`}>
      <defs>
        <linearGradient id="goldLightWallet" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="100%" stopColor="#FFB300" />
        </linearGradient>
        <linearGradient id="goldDarkWallet" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFA000" />
          <stop offset="100%" stopColor="#FF6F00" />
        </linearGradient>
        <linearGradient id="goldHighlightWallet" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" opacity="0.8" />
          <stop offset="100%" stopColor="#FFE082" opacity="0" />
        </linearGradient>
      </defs>
      <path d="M12 12 L9.8 8.9 L12 2 Z" fill="url(#goldLightWallet)" />
      <path d="M12 12 L12 2 L14.2 8.9 Z" fill="url(#goldDarkWallet)" />
      <path d="M12 12 L14.2 8.9 L21.5 8.9 Z" fill="url(#goldLightWallet)" />
      <path d="M12 12 L21.5 8.9 L15.6 13.2 Z" fill="url(#goldDarkWallet)" />
      <path d="M12 12 L15.6 13.2 L17.9 20.1 Z" fill="url(#goldLightWallet)" />
      <path d="M12 12 L17.9 20.1 L12 15.8 Z" fill="url(#goldDarkWallet)" />
      <path d="M12 12 L12 15.8 L6.1 20.1 Z" fill="url(#goldDarkWallet)" />
      <path d="M12 12 L6.1 20.1 L8.4 13.2 Z" fill="url(#goldLightWallet)" />
      <path d="M12 12 L8.4 13.2 L2.5 8.9 Z" fill="url(#goldLightWallet)" />
      <path d="M12 12 L2.5 8.9 L9.8 8.9 Z" fill="url(#goldDarkWallet)" />
      <path d="M12 2 L14.2 8.9 L21.5 8.9 L15.6 13.2 L17.9 20.1 L12 15.8 L6.1 20.1 L8.4 13.2 L2.5 8.9 L9.8 8.9 Z" fill="url(#goldHighlightWallet)" opacity="0.4" />
    </svg>
  );
};

export default function WalletHub({ user, initialCards, initialRewards, initialExploreCampaigns = [], initialCheckins = [] }) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [rewards, setRewards] = useState(initialRewards);
  const [exploreCampaigns, setExploreCampaigns] = useState(initialExploreCampaigns);
  const [checkins, setCheckins] = useState(initialCheckins);

  // Tab State: 'explore' is the default active view
  const [activeTab, setActiveTab] = useState('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const [loadingId, setLoadingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Modals state
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showScanModal, setShowScanModal] = useState(false);

  // Group rewards
  const activeRewards = rewards.filter(r => r.status === 'unredeemed' || r.status === 'pending');
  const claimedRewards = rewards.filter(r => r.status === 'redeemed');

  const handleRequestRedeem = async (rewardId) => {
    setLoadingId(rewardId);
    setFeedback({ type: '', text: '' });

    try {
      const res = await apiFetch('/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({ rewardId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request redemption');
      }

      setFeedback({ type: 'success', text: 'Redemption requested! Hand your device to the shop staff.' });

      // Update local state status to pending
      setRewards(rewards.map(r => r._id === rewardId ? { ...r, status: 'pending' } : r));
      setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
      router.refresh();

    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoadingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/me', { method: 'POST' });
    } catch (err) {
      console.error('Logout API failed, logging out locally:', err);
    } finally {
      if (typeof document !== 'undefined') {
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
      }
      router.push('/');
      router.refresh();
    }
  };

  // Combine explore and stamped cards for the explore search listing
  const exploreList = [
    ...cards.map(c => ({ ...c.campaign, currentStamps: c.currentStamps, hasCard: true, totalEarned: c.totalEarned })),
    ...exploreCampaigns.map(e => ({ ...e.campaign, currentStamps: 0, hasCard: false, totalEarned: 0 }))
  ];

  // Apply filters
  const filteredExplore = exploreList.filter(item => {
    const nameMatch = item.businessId?.name?.toLowerCase() || '';
    const titleMatch = item.title?.toLowerCase() || '';
    const descMatch = item.description?.toLowerCase() || '';
    const categoryMatch = item.businessId?.category?.toLowerCase() || 'retail';

    const matchesSearch = nameMatch.includes(searchQuery.toLowerCase()) ||
      titleMatch.includes(searchQuery.toLowerCase()) ||
      descMatch.includes(searchQuery.toLowerCase());

    const matchesCategory = activeCategory === 'All' ||
      categoryMatch === activeCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">

      {/* DESKTOP HEADER NAVBAR */}
      <header className="hidden md:block bg-white border-b border-slate-200/80 sticky top-0 z-30 w-full shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-sm text-white shadow-md">🏢</span>
              Returno
            </Link>

            <nav className="flex gap-1">
              {[
                { id: 'explore', label: 'Explore', emoji: '🧭' },
                { id: 'home', label: 'My Wallet', emoji: '⭐' },
                { id: 'rewards', label: 'Rewards', emoji: '🎁' },
                { id: 'profile', label: 'Profile', emoji: '👤' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                    ? 'bg-red-50 text-red-600 border border-red-100/50 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowScanModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-tr from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-md shadow-red-500/10 transition-all uppercase tracking-wider"
            >
              <span>📷</span> Scan QR Code
            </button>
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 font-black flex items-center justify-center text-xs border border-red-200/50">
                {user.name[0].toUpperCase()}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-slate-800 leading-none">{user.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors ml-2"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-28 md:pb-12">

        {/* Dynamic header / banners */}
        {activeTab === 'explore' && (
          <>
            {/* Desktop Banner View */}
            <div className="hidden md:flex bg-gradient-to-r from-red-800 to-red-900 text-white p-8 rounded-3xl justify-between items-center gap-6 shadow-md mb-8">
              <div>
                <h1 className="text-3xl  font-black tracking-tight">Explore Partner Shops</h1>
                <p className="text-red-200 text-xs mt-1">Discover rewards, collect stamps, and save on your favorites</p>
              </div>
              <div className="bg-white text-slate-800 rounded-2xl p-4 shadow-xl border border-slate-100 flex gap-3 min-w-[420px] items-center">
                <button
                  type="button"
                  className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-red-600 hover:text-red-700 transition-colors uppercase tracking-wider bg-red-50 py-2.5 px-4 rounded-xl border border-red-100/50 whitespace-nowrap"
                >
                  <span>📍</span> Use my location
                </button>
                <div className="relative flex-grow">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                  <input
                    type="text"
                    placeholder="Find businesses near you"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium placeholder-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Banner View */}
            <div className="md:hidden bg-gradient-to-b from-red-800 to-red-900 text-white pt-8 pb-16 px-6 rounded-b-[2.5rem] relative shadow-lg shadow-red-950/20 -mx-4 -mt-6 mb-12">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h1 className="text-3xl font-black tracking-tight">Explore</h1>
                  <p className="text-red-200 text-[11px] mt-0.5">Find new favorites near you</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">
                  🧭
                </div>
              </div>

              {/* Overlapping search box */}
              <div className="absolute bottom-0 left-6 right-6 translate-y-1/2 z-10">
                <div className="bg-white text-slate-800 rounded-2xl p-3 shadow-xl border border-slate-100 flex flex-col gap-2">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-red-600 hover:text-red-700 transition-colors uppercase tracking-wider bg-red-50 py-1.5 px-3 rounded-xl border border-red-100/50"
                  >
                    <span>📍</span> Use my current location
                  </button>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                    <input
                      type="text"
                      placeholder="Find businesses near you"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Banners for other tabs on mobile */}
        {activeTab !== 'explore' && (
          <div className="md:hidden bg-gradient-to-b from-red-800 to-red-900 text-white pt-8 pb-8 px-6 rounded-b-[2.5rem] shadow-lg shadow-red-950/20 -mx-4 -mt-6 mb-6">
            <h1 className="text-2xl font-black tracking-tight">
              {activeTab === 'home' && "My Wallet"}
              {activeTab === 'rewards' && "Unlocked Rewards"}
              {activeTab === 'profile' && "My Profile"}
            </h1>
            <p className="text-red-200 text-xs mt-0.5">
              {activeTab === 'home' && "Your stamped loyalty cards & progress"}
              {activeTab === 'rewards' && "Unlocked rewards & coupons"}
              {activeTab === 'profile' && "Manage your loyalty account"}
            </p>
          </div>
        )}

        {/* Feedback Messages */}
        {feedback.text && (
          <div className="mb-6">
            <div className={`p-4 rounded-xl text-xs font-semibold ${feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-100 text-emerald-600'
              : 'bg-red-50 border border-red-100 text-red-600'
              }`}>
              {feedback.text}
            </div>
          </div>
        )}

        {/* TAB 1: EXPLORE VIEW */}
        {activeTab === 'explore' && (
          <div className="animate-fade-in-up">

            {/* Category pills */}
            <div className="overflow-x-auto scrollbar-hide py-2 flex gap-2 mb-6">
              {[
                { name: 'All', emoji: '🌐' },
                { name: 'Restaurant', emoji: '🍔' },
                { name: 'Coffee', emoji: '☕' },
                { name: 'Salon', emoji: '💇' },
                { name: 'Gym', emoji: '🏋️' },
                { name: 'Retail', emoji: '🛍️' },
                { name: 'Pharmacy', emoji: '💊' },
                { name: 'Car Wash', emoji: '🧼' },
                { name: 'Hotel', emoji: '🏨' }
              ].map(cat => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap ${activeCategory === cat.name
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Section Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Trending Near You</h3>
              <button
                onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
                className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
              >
                View all
              </button>
            </div>

            {/* List/Grid of Shops (Responsive: Grid on Desktop, List on Mobile) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExplore.map((item) => (
                <div
                  key={item._id}
                  className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md hover:scale-[1.015] transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedCampaign(item)}>
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-red-500/20 border border-slate-100 flex-shrink-0">
                        {item.businessId?.name ? item.businessId.name[0].toUpperCase() : 'B'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-wide">{item.businessId?.name}</span>
                          <span className="text-[10px] text-red-600">✔</span>
                        </div>
                        <div className="text-[10px] font-bold text-red-600 mt-0.5">
                          Win: {item.rewardTitle}
                        </div>
                        {item.businessId?.address && (
                          <div className="text-[9px] text-slate-400 mt-0.5 max-w-[190px] truncate">
                            📍 {item.businessId.city ? `${item.businessId.city}, ${item.businessId.state}` : item.businessId.address}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                      Open
                    </div>
                  </div>

                  {/* JOIN VIA QR BUTTON */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowScanModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-[11px] rounded-xl shadow-md shadow-red-500/10 transition-all uppercase tracking-wider"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-4v-4m-6 10h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Scan QR to Join
                  </button>
                </div>
              ))}

              {filteredExplore.length === 0 && (
                <div className="col-span-full text-center py-16 bg-white border border-slate-200/50 rounded-2xl text-slate-400 text-xs shadow-sm">
                  No active loyalty campaigns found for your query.
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: MY WALLET VIEW */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span>⭐</span> Stamped Loyalty Cards
            </h2>

            {cards.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl text-slate-400 text-xs shadow-sm">
                You haven&apos;t visited any partner shops yet. Go to explore tab to discover active campaigns!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                  <div
                    key={card.campaign._id}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 relative overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.015] flex flex-col justify-between"
                  >
                    <div>
                      <div className="absolute right-4 top-4 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold text-xs uppercase border border-red-100">
                        {card.campaign.businessId.name[0]}
                      </div>

                      <h3 className="text-md font-bold text-slate-900 mb-1">{card.campaign.businessId.name}</h3>
                      <p className="text-xs text-slate-500 mb-2">{card.campaign.title}</p>
                      
                      {/* Streak info */}
                      {card.currentStreak > 0 && (
                        <div className="inline-flex items-center gap-1.5 mb-3 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 px-2.5 py-1 rounded-lg text-[10px] font-extrabold border border-amber-200/60 uppercase tracking-wider shadow-sm">
                          <span className="text-sm">🔥</span> {card.currentStreak}-Day Streak
                        </div>
                      )}

                      {/* Stamps stars grid */}
                      <div className="grid grid-cols-5 gap-2 bg-slate-50 border border-slate-100 p-3 rounded-xl mb-4">
                        {Array.from({ length: card.campaign.requiredStamps }).map((_, idx) => {
                          const isStamped = idx < card.currentStamps;
                          return (
                            <div
                              key={idx}
                              className={`aspect-square rounded-lg flex items-center justify-center border transition-all ${isStamped ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'
                                }`}
                            >
                              <ThreeDStar filled={isStamped} className="w-2/3 h-2/3" />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold border-t border-slate-100 pt-3 mt-1">
                      <span>Progress: {card.currentStamps} / {card.campaign.requiredStamps}</span>
                      <span>Total Pts: <span className="text-red-600">{card.totalPoints || 0}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CHECK-IN HISTORY TIMELINE */}
            {checkins && checkins.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-slate-200/80">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Recent Check-Ins</h3>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm max-w-2xl">
                  <div className="relative border-l-2 border-slate-100 pl-4 md:pl-6 space-y-6">
                    {checkins.map((checkin) => (
                      <div key={checkin._id} className="relative">
                        <div className="absolute -left-[25px] md:-left-[33px] top-1 w-4 h-4 rounded-full bg-red-100 border-2 border-white flex items-center justify-center shadow-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                        </div>
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{checkin.campaignId?.title || 'Loyalty Campaign'}</div>
                            <div className="text-slate-500 text-xs mt-1 leading-relaxed">
                              Earned <span className="font-bold text-red-600">+{checkin.pointsAwarded}</span> pts
                              {checkin.streakAtCheckin > 1 && (
                                <span className="ml-1 text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                  🔥 {checkin.streakAtCheckin} streak
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap text-right">
                            {new Date(checkin.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}<br/>
                            {new Date(checkin.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REWARDS VIEW */}
        {activeTab === 'rewards' && (
          <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span>🎁</span> Unlocked Rewards
            </h2>

            {activeRewards.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl text-slate-400 text-xs shadow-sm">
                Complete a stamp card to unlock rewards and freebies!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeRewards.map((reward) => (
                  <div
                    key={reward._id}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:shadow-md transition-all shadow-sm"
                  >
                    <div>
                      <div className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full inline-block uppercase tracking-wider">Milestone Unlocked</div>
                      <h3 className="text-md font-bold text-slate-900 mt-2">{reward.rewardTitle}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Unlocked on {new Date(reward.unlockedAt).toLocaleDateString()}</p>
                    </div>

                    {reward.status === 'unredeemed' ? (
                      <button
                        onClick={() => handleRequestRedeem(reward._id)}
                        disabled={loadingId !== null}
                        className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-md shadow-red-500/10 transition-all uppercase tracking-wider"
                      >
                        Redeem Reward
                      </button>
                    ) : (
                      <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-xl text-xs font-bold justify-center animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                        Waiting for Shop Verification...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* HISTORICAL LOGS */}
            {claimedRewards.length > 0 && (
              <div className="space-y-3 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Redeemed History</h3>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 divide-y divide-slate-100 shadow-sm max-w-2xl">
                  {claimedRewards.map((reward) => (
                    <div key={reward._id} className="py-3 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-slate-900">🎁 {reward.rewardTitle}</div>
                        <div className="text-slate-500 text-[10px] mt-0.5">Redeemed & Verified</div>
                      </div>
                      <div className="text-right text-[10px] text-slate-500">
                        <div className="font-bold text-emerald-600">Verified</div>
                        <div className="mt-0.5">{new Date(reward.redeemedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROFILE VIEW */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in-up flex justify-center">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 w-full max-w-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black text-lg">
                  {user.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">{user.name}</h3>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Account Tier</span>
                  <span className="font-bold text-red-600">Standard Member</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Active Cards</span>
                  <span className="font-bold text-slate-900">{cards.length} cards</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors border border-red-200/50 text-center uppercase tracking-wider"
              >
                🚪 Sign Out Wallet
              </button>
            </div>
          </div>
        )}

      </main>

      {/* MOBILE STICKY BOTTOM NAV BAR (Shown only on mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 px-4 py-2.5 flex justify-between items-center z-40 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === 'home' ? 'text-red-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[9px] font-bold tracking-wide">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === 'explore' ? 'text-red-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[9px] font-bold tracking-wide">Explore</span>
        </button>

        {/* Floating Scan Button */}
        <div className="flex-shrink-0 -translate-y-4">
          <button
            onClick={() => setShowScanModal(true)}
            className="bg-gradient-to-tr from-red-600 to-rose-600 text-white rounded-full p-4 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 active:scale-95 transition-all border-4 border-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-4v-4m-6 10h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === 'rewards' ? 'text-red-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm-2 4h4M5 11h14a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1v-7a1 1 0 011-1z" />
          </svg>
          <span className="text-[9px] font-bold tracking-wide">Reward</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === 'profile' ? 'text-red-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[9px] font-bold tracking-wide">Profile</span>
        </button>
      </nav>

      {/* DETAIL MODAL (First Picture UI style) */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative overflow-hidden border border-slate-100 animate-scale-in space-y-4">

            {/* Header info */}
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-red-600">
                {selectedCampaign.businessId?.category || 'Retail'}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-full">
                Goal: {selectedCampaign.requiredStamps} stamps
              </span>
            </div>

            {/* Shop avatar & location */}
            <div className="flex items-center gap-3 mt-1">
              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-red-500/20 border border-slate-100">
                {selectedCampaign.businessId?.name ? selectedCampaign.businessId.name[0].toUpperCase() : 'B'}
              </div>
              <div>
                <h3 className="text-md font-black text-slate-900">{selectedCampaign.businessId?.name}</h3>
                {selectedCampaign.businessId?.address && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    📍 {selectedCampaign.businessId.address}
                  </p>
                )}
              </div>
            </div>

            {/* Campaign text */}
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{selectedCampaign.title}</h4>
              <p className="text-slate-600 text-xs leading-relaxed">{selectedCampaign.description}</p>
            </div>

            {/* Reward Box */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Reward Details</span>
                <span className="text-xs font-bold text-slate-900">{selectedCampaign.rewardTitle}</span>
              </div>
            </div>

            {/* Stamps stars grid (Only if they have visited at least once) */}
            {selectedCampaign.hasCard && selectedCampaign.currentStamps > 0 && (
              <div className="space-y-2">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Your Stamps Progress</span>
                <div className="grid grid-cols-5 gap-2 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  {Array.from({ length: selectedCampaign.requiredStamps }).map((_, idx) => {
                    const isStamped = idx < selectedCampaign.currentStamps;
                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-lg flex items-center justify-center border transition-all ${isStamped ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'
                          }`}
                      >
                        <ThreeDStar filled={isStamped} className="w-2/3 h-2/3" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-[10px] text-center text-slate-400 leading-normal font-medium">
              Scan the shop's QR code in-store to join the campaign and start earning rewards!
            </p>

            {/* JOIN VIA QR BUTTON IN MODAL */}
            <button
              onClick={() => {
                setSelectedCampaign(null);
                setShowScanModal(true);
              }}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-4v-4m-6 10h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Scan QR to Join
            </button>

            <button
              onClick={() => setSelectedCampaign(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* SCAN INSTRUCTIONS MODAL */}
      {showScanModal && (
        <QRScannerModal onClose={() => setShowScanModal(false)} />
      )}

    </div>
  );
}
