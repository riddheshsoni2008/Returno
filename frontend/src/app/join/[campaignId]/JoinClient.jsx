"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function JoinClient({ campaign, business, initialUser }) {
  const router = useRouter();
  
  const [user, setUser] = useState(initialUser);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinResult, setJoinResult] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setFeedbackMsg({ type: '', text: '' });
    try {
      const res = await apiFetch('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ email, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOtpSent(true);
      setFeedbackMsg({ type: 'success', text: 'Verification OTP sent to your email!' });
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setFeedbackMsg({ type: '', text: '' });
    try {
      const res = await apiFetch('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser(data.user);
      setFeedbackMsg({ type: 'success', text: 'Verified! Now join the campaign.' });
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    setFeedbackMsg({ type: '', text: '' });
    try {
      const res = await apiFetch(`/checkin/join/${campaign._id}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJoinResult(data);
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-text-primary flex items-center justify-center py-12 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xl relative z-10 space-y-6" style={{ animation: 'fade-in-up 0.5s ease-out' }}>
        
        {/* Business Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center font-bold text-2xl mx-auto shadow-lg shadow-red-500/10 border border-border-standard mb-4 text-white">
            {business.name?.[0] || '?'}
          </div>
          <h1 className="text-xl font-black text-text-primary">{business.name}</h1>
          <p className="text-xs text-text-secondary mt-1 capitalize">📍 {business.address || business.city || 'Local Business'}</p>
        </div>

        {/* Campaign Info Card */}
        <div className="bg-gradient-to-br from-slate-50 to-red-50/30 border border-slate-200/60 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-red-600">
              Loyalty Campaign
            </span>
            <span className="text-[10px] text-text-secondary font-semibold bg-white px-2 py-0.5 rounded border border-border-standard">
              {campaign.requiredStamps} stamps to reward
            </span>
          </div>
          <h2 className="text-lg font-black text-text-primary">{campaign.title}</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{campaign.description}</p>
          <div className="flex items-center gap-2 bg-white border border-border-standard rounded-xl p-3">
            <span className="text-lg">🎁</span>
            <div>
              <div className="text-[9px] text-text-muted font-bold uppercase tracking-wider">Reward</div>
              <div className="text-sm font-bold text-amber-700">{campaign.rewardTitle}</div>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div className="flex-1 bg-white rounded-xl p-2.5 border border-border-standard">
              <div className="text-lg font-black text-red-600">{campaign.pointsPerCheckin || 10}</div>
              <div className="text-[9px] text-text-muted font-bold uppercase">Pts/Check-in</div>
            </div>
            <div className="flex-1 bg-white rounded-xl p-2.5 border border-border-standard">
              <div className="text-lg font-black text-amber-600">🔥</div>
              <div className="text-[9px] text-text-muted font-bold uppercase">Streak Bonus</div>
            </div>
            <div className="flex-1 bg-white rounded-xl p-2.5 border border-border-standard">
              <div className="text-lg font-black text-text-primary">{campaign.requiredStamps}</div>
              <div className="text-[9px] text-text-muted font-bold uppercase">Goal</div>
            </div>
          </div>
        </div>

        {feedbackMsg.text && (
          <div className={`p-3.5 rounded-xl text-xs font-semibold ${
            feedbackMsg.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' 
              : 'bg-red-50 border border-red-100 text-red-600'
          }`}>
            {feedbackMsg.type === 'success' ? '✓' : '⚠️'} {feedbackMsg.text}
          </div>
        )}

        {/* Not logged in — auth flow */}
        {!user && (
          <div className="space-y-5">
            <div className="text-center border-t border-border-standard pt-4">
              <h3 className="font-bold text-sm text-text-primary">Sign in to join this campaign</h3>
              <p className="text-xs text-text-secondary mt-1">Quick OTP verification — no password needed</p>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <input 
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-border-standard rounded-xl py-3 px-4 text-text-primary text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
                <input 
                  type="email"
                  required
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-border-standard rounded-xl py-3 px-4 text-text-primary text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
                <button 
                  type="submit"
                  className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-500/10 transition-colors"
                >
                  Send OTP Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <input 
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full bg-slate-50 border border-border-standard rounded-xl py-3 px-4 text-center tracking-[0.5em] text-lg font-bold focus:outline-none focus:border-red-500 transition-colors text-text-primary"
                />
                <button 
                  type="submit"
                  className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-500/10 transition-colors"
                >
                  Verify & Continue
                </button>
              </form>
            )}
          </div>
        )}

        {/* Logged in, no result yet — show join button */}
        {user && !joinResult && (
          <div className="space-y-4 border-t border-border-standard pt-5">
            <div className="text-center">
              <p className="text-xs text-text-secondary">Signed in as <span className="font-bold text-slate-700">{user.email || user.name}</span></p>
            </div>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-80 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/10 transition-all uppercase tracking-wider"
            >
              {joining ? 'Joining...' : '🎯 Join This Campaign'}
            </button>
          </div>
        )}

        {/* Join result */}
        {joinResult && (
          <div className="space-y-5 text-center border-t border-border-standard pt-5" style={{ animation: 'fade-in-up 0.4s ease-out' }}>
            {joinResult.alreadyJoined ? (
              <div className="space-y-2">
                <div className="text-4xl">👋</div>
                <h3 className="text-lg font-black text-text-primary">Already a Member!</h3>
                <p className="text-xs text-text-secondary">You&apos;re already enrolled in this loyalty campaign.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl">🎉</div>
                <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">Welcome Aboard!</h3>
                <p className="text-xs text-text-secondary">You&apos;ve successfully joined <span className="font-bold text-slate-700">{campaign.title}</span></p>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-left space-y-2">
              <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">How it works</div>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li className="flex items-start gap-2"><span>1️⃣</span> Visit {business.name} and make a purchase</li>
                <li className="flex items-start gap-2"><span>2️⃣</span> Scan the check-in QR at the counter</li>
                <li className="flex items-start gap-2"><span>3️⃣</span> Build your daily streak for bonus points</li>
                <li className="flex items-start gap-2"><span>4️⃣</span> Reach {campaign.requiredStamps} stamps → earn your reward!</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Link 
                href="/wallet" 
                className="w-full py-3 bg-gradient-to-tr from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-all uppercase tracking-wider text-center"
              >
                💼 Go to My Wallet
              </Link>
              <Link 
                href="/" 
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all border border-border-standard text-center"
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
