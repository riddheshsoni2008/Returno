"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

// Reuse our custom 3D Star SVG
const ThreeDStar = ({ filled, className = "" }) => {
  if (!filled) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`text-white/20 ${className}`}>
        <path
          d="M12 2L14.2 8.9L21.5 8.9L15.6 13.2L17.9 20.1L12 15.8L6.1 20.1L8.4 13.2L2.5 8.9L9.8 8.9Z"
          fill="rgba(255,255,255,0.02)"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={`drop-shadow-[0_0_15px_rgba(234,179,8,0.7)] animate-[scale-up_0.4s_ease-out_both] ${className}`}>
      <defs>
        <linearGradient id="goldLightScan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="100%" stopColor="#FFB300" />
        </linearGradient>
        <linearGradient id="goldDarkScan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFA000" />
          <stop offset="100%" stopColor="#FF6F00" />
        </linearGradient>
        <linearGradient id="goldHighlightScan" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFE082" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M12 12 L9.8 8.9 L12 2 Z" fill="url(#goldLightScan)" />
      <path d="M12 12 L12 2 L14.2 8.9 Z" fill="url(#goldDarkScan)" />
      <path d="M12 12 L14.2 8.9 L21.5 8.9 Z" fill="url(#goldLightScan)" />
      <path d="M12 12 L21.5 8.9 L15.6 13.2 Z" fill="url(#goldDarkScan)" />
      <path d="M12 12 L15.6 13.2 L17.9 20.1 Z" fill="url(#goldLightScan)" />
      <path d="M12 12 L17.9 20.1 L12 15.8 Z" fill="url(#goldDarkScan)" />
      <path d="M12 12 L12 15.8 L6.1 20.1 Z" fill="url(#goldDarkScan)" />
      <path d="M12 12 L6.1 20.1 L8.4 13.2 Z" fill="url(#goldLightScan)" />
      <path d="M12 12 L8.4 13.2 L2.5 8.9 Z" fill="url(#goldLightScan)" />
      <path d="M12 12 L2.5 8.9 L9.8 8.9 Z" fill="url(#goldDarkScan)" />
      <path d="M12 2 L14.2 8.9 L21.5 8.9 L15.6 13.2 L17.9 20.1 L12 15.8 L6.1 20.1 L8.4 13.2 L2.5 8.9 L9.8 8.9 Z" fill="url(#goldHighlightScan)" opacity="0.4" />
    </svg>
  );
};

export default function ScanClientResolver({ campaign, business, initialUser }) {
  const router = useRouter();
  
  // Auth state
  const [user, setUser] = useState(initialUser);
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  // Geolocation state
  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState('');
  
  // Claim form state
  const [billNumber, setBillNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null); // { success, rewardUnlocked, currentStamps, totalStamps, requiredStamps }
  
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  const requestLocation = () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('GPS location is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (err) => {
        console.error('Geo Error:', err);
        setGeoError('GPS Location access is strictly required to verify visits and prevent stamp fraud.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Get GPS on mount or auth success
  useEffect(() => {
    if (user && !coords) {
      const timer = setTimeout(() => {
        requestLocation();
      }, 0);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // OTP auth sequence
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setFeedbackMsg({ type: '', text: '' });
    try {
      const res = await apiFetch('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ email }),
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
      setFeedbackMsg({ type: 'success', text: 'Auth verified!' });
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  };

  // Claim stamp sequence
  const handleClaimStamp = async (e) => {
    e.preventDefault();
    if (!coords) {
      requestLocation();
      return;
    }

    setClaiming(true);
    setFeedbackMsg({ type: '', text: '' });

    try {
      const res = await apiFetch('/visit/stamp', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: campaign._id,
          billNumber,
          amount,
          lat: coords.lat,
          lng: coords.lng,
          deviceFingerprint: navigator.userAgent
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim stamp');
      }

      setClaimResult(data);
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setClaiming(false);
    }
  };

  // RENDER MOCKUP SCREEN IN AUTH WINDOW
  return (
    <div className="min-h-screen bg-dark-950 text-white flex items-center justify-center py-12 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-dark-900/70 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-2xl relative z-10 space-y-6">
        
        {/* Shop Header Banner */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-purple-500 flex items-center justify-center font-bold text-2xl mx-auto shadow-lg border border-white/10 mb-4 text-white">
            {business.name[0]}
          </div>
          <h1 className="text-xl font-extrabold text-slate-100">{business.name}</h1>
          <p className="text-xs text-slate-400 mt-1 capitalize">📍 {business.address}</p>
        </div>

        {feedbackMsg.text && (
          <div className={`p-4 rounded-xl text-xs font-semibold ${
            feedbackMsg.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {feedbackMsg.type === 'success' ? '✓' : '⚠️'} {feedbackMsg.text}
          </div>
        )}

        {/* 1. LOGIN MODE */}
        {!user && (
          <div className="space-y-6">
            <div className="text-center border-t border-white/5 pt-4">
              <h3 className="font-bold text-sm text-slate-300">Customer verification</h3>
              <p className="text-xs text-slate-500 mt-1">Authenticate instantly to track stamps card.</p>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <input 
                  type="email"
                  required
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
                <button 
                  type="submit"
                  className="w-full py-3 bg-brand-600 hover:bg-brand-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Request OTP Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input 
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-center tracking-[0.5em] text-lg font-bold focus:outline-none focus:border-brand-500 transition-colors text-white"
                />
                <button 
                  type="submit"
                  className="w-full py-3 bg-brand-600 hover:bg-brand-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Verify & Proceed
                </button>
              </form>
            )}
          </div>
        )}

        {/* 2. GEOLOCATION WARNING */}
        {user && !coords && (
          <div className="text-center space-y-4 border-t border-white/5 pt-6">
            <div className="text-3xl animate-bounce">📍</div>
            <h3 className="font-bold text-slate-200 text-md">Requesting Location Access</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Returno matches your location to verify you are currently at the merchant branch counter to prevent fraud.
            </p>
            {geoError && (
              <p className="text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{geoError}</p>
            )}
            <button
              onClick={requestLocation}
              className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all"
            >
              🔄 Retry Location Check
            </button>
          </div>
        )}

        {/* 3. CLAIM FORM MODE */}
        {user && coords && !claimResult && (
          <form onSubmit={handleClaimStamp} className="space-y-5 border-t border-white/5 pt-6">
            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Active Loyalty Reward</div>
              <div className="text-sm font-bold text-yellow-400">🎁 {campaign.rewardTitle}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Unique Bill Number</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. BILL-99218"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Amount Paid</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-500 text-sm font-medium">₹</span>
                  <input 
                    type="number"
                    required
                    min={1}
                    placeholder="250"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={claiming}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-[0_5px_15px_rgba(37,99,235,0.3)] transition-all uppercase tracking-wider"
            >
              {claiming ? 'Processing Check-in...' : 'Claim Loyalty Stamp'}
            </button>
          </form>
        )}

        {/* 4. SUCCESS CELEBRATION STAMPS ANIMATION */}
        {claimResult && (
          <div className="space-y-6 text-center border-t border-white/5 pt-6 animate-[fade-in_0.4s_ease-out]">
            {claimResult.rewardUnlocked ? (
              <div className="space-y-2 animate-bounce">
                <div className="text-5xl">🎉🏆</div>
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">Reward Unlocked!</h3>
                <p className="text-xs text-slate-300">You&apos;ve unlocked: <span className="font-bold text-yellow-400">{campaign.rewardTitle}</span></p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-4xl">✨⭐</div>
                <h3 className="text-xl font-bold text-slate-100">Stamp Collected!</h3>
                <p className="text-xs text-slate-400">Your loyalty card has been stamped.</p>
              </div>
            )}

            {/* Stamp Slots Progress card */}
            <div className="bg-dark-950/80 border border-white/5 p-6 rounded-2xl">
              <div className="grid grid-cols-5 gap-3">
                {Array.from({ length: claimResult.requiredStamps }).map((_, idx) => {
                  const stampNum = idx + 1;
                  const isStamped = stampNum <= claimResult.currentStamps;
                  const isNewStamp = stampNum === claimResult.currentStamps && !claimResult.rewardUnlocked;
                  
                  return (
                    <div 
                      key={idx}
                      className={`aspect-square rounded-xl flex items-center justify-center border transition-all duration-300 ${
                        isStamped 
                          ? 'border-brand-500/30 bg-gradient-to-b from-brand-500/10 to-brand-500/5 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                          : 'border-white/5 bg-white/2'
                      }`}
                    >
                      <ThreeDStar 
                        filled={isStamped} 
                        className={`w-2/3 h-2/3 ${isNewStamp ? 'animate-[scale-up_0.6s_ease-out_both]' : ''}`} 
                      />
                    </div>
                  );
                })}
              </div>
              
              <div className="text-xs text-slate-400 mt-4">
                Card progress: <span className="text-brand-400 font-bold">{claimResult.currentStamps}</span> / {claimResult.requiredStamps} stamps
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link 
                href="/wallet" 
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all uppercase tracking-wider"
              >
                💼 Go to Customer Wallet
              </Link>
              <button 
                onClick={() => setClaimResult(null)}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-semibold text-xs rounded-xl transition-all"
              >
                Scan Another Bill
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
