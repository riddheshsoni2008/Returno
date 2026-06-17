"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

// Reuse our custom 3D Star SVG
const ThreeDStar = ({ filled, className = "" }) => {
  if (!filled) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`text-slate-300 ${className}`}>
        <path
          d="M12 2L14.2 8.9L21.5 8.9L15.6 13.2L17.9 20.1L12 15.8L6.1 20.1L8.4 13.2L2.5 8.9L9.8 8.9Z"
          fill="rgba(0,0,0,0.02)"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={`drop-shadow-[0_0_15px_rgba(234,179,8,0.7)] ${className}`}>
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
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFE082" stopOpacity="0" />
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

export default function WalletHub({ user, initialCards, initialRewards }) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [rewards, setRewards] = useState(initialRewards);
  
  const [loadingId, setLoadingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

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
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 text-slate-800">
      {/* Wallet Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">My Loyalty Wallet</h1>
          <p className="text-slate-500 mt-1">Logged in as customer: <span className="text-slate-900 font-bold">{user.name} ({user.email})</span></p>
        </div>
        <button
          onClick={handleLogout}
          className="px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors border border-red-200/50 w-full sm:w-auto text-center"
        >
          🚪 Sign Out Wallet
        </button>
      </div>

      {feedback.text && (
        <div className={`p-4 rounded-xl text-xs font-semibold ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' 
            : 'bg-red-50 border border-red-100 text-red-600'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* STAMP CARDS PROGRESS */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <span>⭐</span> Stamped Loyalty Cards
        </h2>
        
        {cards.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200/80 rounded-2xl text-slate-400 text-sm shadow-sm">
            You haven&apos;t visited any partner shops yet. Scan a shop&apos;s QR code to collect your first stamp!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-delayed">
            {cards.map((card) => (
              <div key={card.campaign._id} className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
                <div className="absolute right-4 top-4 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold text-xs uppercase border border-red-100">
                  {card.campaign.businessId.name[0]}
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-1">{card.campaign.businessId.name}</h3>
                <p className="text-xs text-slate-500 mb-4">{card.campaign.title}</p>
                
                {/* Visual stamps slots */}
                <div className="grid grid-cols-5 gap-3 bg-slate-50 border border-slate-100 p-4 rounded-xl mb-4">
                  {Array.from({ length: card.campaign.requiredStamps }).map((_, idx) => {
                    const isStamped = idx < card.currentStamps;
                    return (
                      <div 
                        key={idx}
                        className={`aspect-square rounded-lg flex items-center justify-center border transition-all ${
                          isStamped ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <ThreeDStar filled={isStamped} className="w-2/3 h-2/3" />
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                  <span>Progress: {card.currentStamps} / {card.campaign.requiredStamps} Stamps</span>
                  <span>Total visits: {card.totalEarned}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACTIVE REWARDS CLAIM SECTION */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <span>🎁</span> Unlocked Rewards
        </h2>

        {activeRewards.length === 0 ? (
          <div className="text-center py-10 bg-white border border-slate-200/80 rounded-2xl text-slate-400 text-sm shadow-sm">
            Complete a stamp card to unlock rewards and freebies!
          </div>
        ) : (
          <div className="space-y-3">
            {activeRewards.map((reward) => (
              <div 
                key={reward._id} 
                className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all shadow-sm"
              >
                <div>
                  <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Milestone Unlocked</div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{reward.rewardTitle}</h3>
                  <p className="text-xs text-slate-500 mt-1">Unlocked on {new Date(reward.unlockedAt).toLocaleDateString()}</p>
                </div>

                {reward.status === 'unredeemed' ? (
                  <button
                    onClick={() => handleRequestRedeem(reward._id)}
                    disabled={loadingId !== null}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-all uppercase tracking-wider w-full sm:w-auto"
                  >
                    Redeem Reward
                  </button>
                ) : (
                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl text-xs font-bold w-full sm:w-auto justify-center animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    Waiting for Shop Verification...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HISTORICAL REDEEMED LOGS */}
      {claimedRewards.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900">History Log</h2>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 divide-y divide-slate-100 shadow-sm">
            {claimedRewards.map((reward) => (
              <div key={reward._id} className="py-3.5 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900">🎁 {reward.rewardTitle}</div>
                  <div className="text-slate-500 mt-1">Claimed successfully</div>
                </div>
                <div className="text-slate-500 text-right">
                  <div className="font-bold text-emerald-600">Verified</div>
                  <div className="mt-1">{new Date(reward.redeemedAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
