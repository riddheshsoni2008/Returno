"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function JoinClient({ campaign, business, user }) {
  const router = useRouter();
  
  const [joining, setJoining] = useState(false);
  const [joinResult, setJoinResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const joinAttempted = useRef(false);

  const handleJoin = async () => {
    if (joining || joinResult) return;
    setJoining(true);
    setErrorMsg('');
    try {
      const res = await apiFetch(`/campaigns/${campaign._id}/join`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join campaign');
      }
      setJoinResult(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    // Auto-join campaign immediately on page load, exactly once
    if (user && !joinResult && !joining && !joinAttempted.current) {
      joinAttempted.current = true;
      handleJoin();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-[2rem] p-6 md:p-8 shadow-xl relative z-10 space-y-6 transition-all duration-300 hover:shadow-2xl">
        
        {/* Business Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-red-500/20 border border-slate-100 mb-4 text-white">
            {business.name?.[0]?.toUpperCase() || '?'}
          </div>
          <span className="inline-block text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/50 text-slate-500 mb-2">
            {business.category || 'Retail'}
          </span>
          <h1 className="text-xl font-black text-slate-900 leading-tight">{business.name}</h1>
          <p className="text-xs text-slate-500 mt-1">📍 {business.address || business.city || 'Local Business'}</p>
        </div>

        {/* Campaign Info Card */}
        <div className="bg-gradient-to-br from-slate-50 to-red-50/20 border border-slate-200/60 rounded-3xl p-5 space-y-4">
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-100">
              Active Loyalty Tiers
            </span>
            <h2 className="text-md font-bold text-slate-900 pt-1.5">{campaign.title}</h2>
            <p className="text-xs text-slate-650 leading-relaxed">{campaign.description}</p>
          </div>

          {/* Reward highlights */}
          <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
            <span className="text-2xl">🎁</span>
            <div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Redeemable Reward</div>
              <div className="text-xs font-bold text-amber-700">{campaign.rewardTitle}</div>
            </div>
          </div>

          {/* Campaign stats details */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-white rounded-xl p-2.5 border border-slate-100 shadow-sm">
              <div className="text-md font-black text-red-600">+{campaign.pointsPerCheckin || 10}</div>
              <div className="text-[9px] text-slate-450 font-bold uppercase tracking-wide">Points</div>
            </div>
            <div className="bg-white rounded-xl p-2.5 border border-slate-100 shadow-sm">
              <div className="text-md font-black text-amber-600">🔥</div>
              <div className="text-[9px] text-slate-455 font-bold uppercase tracking-wide">Streaks</div>
            </div>
            <div className="bg-white rounded-xl p-2.5 border border-slate-100 shadow-sm">
              <div className="text-md font-black text-slate-800">{campaign.requiredStamps}</div>
              <div className="text-[9px] text-slate-460 font-bold uppercase tracking-wide">Stamps</div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl text-xs font-semibold bg-red-50 border border-red-100 text-red-600">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Logged in, show Join Campaign Button */}
        {!joinResult ? (
          <div className="space-y-4 border-t border-slate-100 pt-5">
            <div className="text-center">
              <p className="text-xs text-slate-500">
                Logged in as <span className="font-bold text-slate-700">{user.email}</span>
              </p>
            </div>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/10 hover:-translate-y-0.5 transition-all uppercase tracking-wider"
            >
              {joining ? 'Adding Card to Wallet...' : '🎯 Join Campaign'}
            </button>
          </div>
        ) : (
          /* Success Screen on Campaign Joined */
          <div className="space-y-5 text-center border-t border-slate-100 pt-5 animate-[fade-in_0.4s_ease-out]">
            <div className="space-y-2">
              <div className="text-5xl animate-bounce">🎉</div>
              <h3 className="text-lg font-black text-slate-900">Successfully Enrolled!</h3>
              <p className="text-xs text-slate-500">
                You are now a loyalty member of <span className="font-bold text-slate-750">{business.name}</span>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 text-left space-y-2.5 shadow-sm">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">How to earn rewards</div>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">1.</span>
                  <span>Make a purchase at {business.name}.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">2.</span>
                  <span>Scan the in-store check-in QR code.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">3.</span>
                  <span>Check in daily to build your streak and earn multipliers!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">4.</span>
                  <span>Collect {campaign.requiredStamps} stamps to earn your free reward.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link 
                href="/wallet" 
                className="w-full py-3.5 bg-gradient-to-tr from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-all uppercase tracking-wider text-center"
              >
                💼 Go to My Wallet
              </Link>
              <Link 
                href="/" 
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-xs rounded-xl transition-all border border-slate-200 text-center"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
