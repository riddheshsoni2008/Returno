"use client";

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function CheckinClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Auth state
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  // Store JWT auth token directly — avoids unreliable cookie round-trip
  const authTokenRef = useRef(null);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await apiFetch('/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  // Auto-validate when user is available and token exists
  useEffect(() => {
    if (user && token && !result && !processing && !error) {
      handleValidate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleValidate = async () => {
    if (!token) return;
    setProcessing(true);
    setError('');
    try {
      // Build request options with explicit auth header if we have a fresh token
      const fetchOptions = {
        method: 'POST',
        body: JSON.stringify({ token }),
      };

      // If we just got a fresh JWT from OTP verify, pass it directly
      // This bypasses the cookie round-trip which fails on cross-origin mobile
      if (authTokenRef.current) {
        fetchOptions.headers = {
          'Authorization': `Bearer ${authTokenRef.current}`,
        };
      }

      const res = await apiFetch('/checkin/validate', fetchOptions);
      const data = await res.json();
      if (!res.ok) {
        if (data.notEnrolled) {
          setError(`not_enrolled:${data.campaignId}`);
        } else {
          setError(data.error || 'Check-in failed');
        }
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setFeedbackMsg({ type: '', text: '' });
    try {
      const res = await apiFetch('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ email, name: isSignup ? name : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOtpSent(true);
      setFeedbackMsg({ type: 'success', text: 'OTP sent to your email!' });
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
      
      if (data.token) {
        // Save to ref for immediate use in the next API call
        authTokenRef.current = data.token;
        // Also save to cookie for future page loads
        document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        // Save to localStorage as a robust cross-origin fallback
        try {
          localStorage.setItem('token', data.token);
        } catch (err) {
          console.error('Error writing token to localStorage:', err);
        }
      }
      
      setUser(data.user);
      setFeedbackMsg({ type: 'success', text: 'Verified!' });
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 text-center space-y-5 shadow-xl">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-xl font-black text-slate-900">Missing QR Token</h1>
          <p className="text-sm text-slate-500">No check-in token found. Please scan the QR code at the shop counter.</p>
          <Link href="/" className="inline-block px-6 py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xl relative z-10 space-y-6" style={{ animation: 'fade-in-up 0.5s ease-out' }}>

        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-red-500/10 border border-slate-100 mb-3 text-white">
            📱
          </div>
          <h1 className="text-lg font-black text-slate-900">Daily Check-In</h1>
          <p className="text-xs text-slate-500 mt-1">Scan completed — processing your visit</p>
        </div>

        {feedbackMsg.text && (
          <div className={`p-3 rounded-xl text-xs font-semibold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-100 text-emerald-600'
              : 'bg-red-50 border border-red-100 text-red-600'
          }`}>
            {feedbackMsg.type === 'success' ? '✓' : '⚠️'} {feedbackMsg.text}
          </div>
        )}

        {/* Not logged in */}
        {!user && (
          <div className="space-y-5">
            <div className="text-center border-t border-slate-100 pt-4">
              <div className="flex justify-center gap-4 mb-4">
                <button 
                  onClick={() => setIsSignup(false)}
                  className={`text-sm font-bold pb-2 border-b-2 transition-colors ${!isSignup ? 'border-red-600 text-red-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Log In
                </button>
                <button 
                  onClick={() => setIsSignup(true)}
                  className={`text-sm font-bold pb-2 border-b-2 transition-colors ${isSignup ? 'border-red-600 text-red-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Sign Up
                </button>
              </div>
              <h3 className="font-bold text-sm text-slate-800">
                {isSignup ? 'Create an account to join' : 'Welcome back, log in to check in'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Quick OTP — no password needed</p>
            </div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                {isSignup && (
                  <input type="text" required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors" />
                )}
                <input type="email" required placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors" />
                <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-500/10 transition-colors">
                  Send OTP
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <input type="text" required maxLength={6} placeholder="Enter 6-digit OTP" value={otpCode} onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-center tracking-[0.5em] text-lg font-bold focus:outline-none focus:border-red-500 transition-colors text-slate-800" />
                <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-500/10 transition-colors">
                  Verify & Check In
                </button>
              </form>
            )}
          </div>
        )}

        {/* Processing */}
        {user && processing && (
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-600 font-medium">Validating check-in...</p>
          </div>
        )}

        {/* Error state */}
        {user && !processing && error && (
          <div className="space-y-5 text-center">
            {error.startsWith('not_enrolled:') ? (
              <>
                <div className="text-4xl">🔒</div>
                <h3 className="text-lg font-black text-slate-900">Not Enrolled</h3>
                <p className="text-xs text-slate-500">You need to join this campaign first before checking in.</p>
                <Link
                  href={`/join/campaign/${error.split(':')[1]}`}
                  className="inline-block w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-colors uppercase tracking-wider"
                >
                  Join Campaign Now
                </Link>
              </>
            ) : (
              <>
                <div className="text-4xl">❌</div>
                <h3 className="text-lg font-black text-slate-900">Check-in Failed</h3>
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</p>
                <Link href="/wallet" className="inline-block px-6 py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
                  Go to Wallet
                </Link>
              </>
            )}
          </div>
        )}

        {/* Success — already claimed today */}
        {result && result.alreadyClaimed && (
          <div className="space-y-5 text-center" style={{ animation: 'fade-in-up 0.4s ease-out' }}>
            <div className="text-4xl">✅</div>
            <h3 className="text-lg font-black text-slate-900">Already Checked In Today!</h3>
            <p className="text-xs text-slate-500">Come back tomorrow to keep your streak alive.</p>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-5 space-y-3">
              <div className="text-3xl">🔥</div>
              <div className="text-2xl font-black text-amber-700">{result.currentStreak}-day streak</div>
              <div className="flex gap-3 justify-center text-xs text-slate-600">
                <span>Best: <span className="font-bold text-amber-700">{result.longestStreak}</span></span>
                <span>•</span>
                <span>Points: <span className="font-bold text-red-600">{result.totalPoints}</span></span>
              </div>
            </div>
            <Link href="/wallet" className="inline-block w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-all uppercase tracking-wider">
              💼 Go to Wallet
            </Link>
          </div>
        )}

        {/* Success — new check-in */}
        {result && !result.alreadyClaimed && (
          <div className="space-y-6 text-center" style={{ animation: 'fade-in-up 0.4s ease-out' }}>
            {result.rewardUnlocked ? (
              <div className="space-y-2">
                <div className="text-5xl" style={{ animation: 'bounce 0.6s ease-out' }}>🎉🏆</div>
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">Reward Unlocked!</h3>
                <p className="text-xs text-slate-500">You earned: <span className="font-bold text-red-600">{result.rewardTitle}</span></p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl">✨</div>
                <h3 className="text-xl font-black text-slate-900">Check-in Complete!</h3>
              </div>
            )}

            {/* Streak Display */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl">🔥</span>
                <span className="text-3xl font-black text-amber-700">{result.currentStreak}</span>
                <span className="text-sm font-bold text-amber-600">day streak</span>
              </div>
              <div className="flex justify-center gap-1">
                {Array.from({ length: Math.min(result.currentStreak, 7) }).map((_, i) => (
                  <div key={i} className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold shadow-sm" style={{ animation: `scale-up 0.3s ease-out ${i * 0.08}s both` }}>
                    {i + 1}
                  </div>
                ))}
                {result.currentStreak > 7 && (
                  <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 text-[8px] font-bold">
                    +{result.currentStreak - 7}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white rounded-xl p-2 border border-amber-100">
                  <div className="text-sm font-black text-red-600">+{result.pointsAwarded}</div>
                  <div className="text-[8px] text-slate-400 font-bold uppercase">Points</div>
                </div>
                <div className="bg-white rounded-xl p-2 border border-amber-100">
                  <div className="text-sm font-black text-slate-800">{result.totalPoints}</div>
                  <div className="text-[8px] text-slate-400 font-bold uppercase">Total Pts</div>
                </div>
                <div className="bg-white rounded-xl p-2 border border-amber-100">
                  <div className="text-sm font-black text-amber-700">{result.longestStreak}</div>
                  <div className="text-[8px] text-slate-400 font-bold uppercase">Best</div>
                </div>
              </div>
            </div>

            {/* Stamp Progress */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stamp Progress</div>
              <div className="flex justify-center gap-1.5 flex-wrap">
                {Array.from({ length: result.requiredStamps }).map((_, idx) => {
                  const isStamped = idx < result.currentStamps;
                  return (
                    <div
                      key={idx}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs font-bold transition-all ${
                        isStamped
                          ? 'border-amber-300 bg-amber-100 text-amber-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-300'
                      }`}
                    >
                      {isStamped ? '⭐' : idx + 1}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">
                {result.currentStamps}/{result.requiredStamps} stamps collected
              </p>
            </div>

            <Link href="/wallet" className="inline-block w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-all uppercase tracking-wider">
              💼 Go to Wallet
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
