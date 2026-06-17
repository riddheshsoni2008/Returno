"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function CustomerAuthPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-850">
        <div className="text-sm font-semibold tracking-wider text-slate-400 animate-pulse">Initializing Customer Session...</div>
      </main>
    }>
      <CustomerAuthContent />
    </Suspense>
  );
}

function CustomerAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: 'login' or 'signup'
  const [mode, setMode] = useState('login');

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Status states
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (otpSent && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, cooldown]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = { email: email.toLowerCase().trim() };
      if (mode === 'signup') {
        payload.name = name.trim();
      }

      const res = await apiFetch('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setOtpSent(true);
      setCooldown(60);
      setSuccess(data.message || 'OTP verification code sent to your email!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase().trim(), code: otpCode.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setSuccess('Logged in successfully! Redirecting...');
      setTimeout(() => {
        router.push('/wallet');
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800 font-sans relative overflow-hidden px-6 py-8">
      {/* Background radial glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-b from-red-500/5 via-transparent to-transparent blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="w-full max-w-md mx-auto flex justify-between items-center z-10 pt-4">
        <Link href="/" className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-sm shadow-lg shadow-red-500/20 text-white">✨</span>
          Returno
        </Link>
        <Link href="/merchant/auth" className="text-xs font-semibold text-red-600 hover:text-red-500 transition-colors bg-white border border-slate-200/80 rounded-full px-4 py-2 shadow-sm">
          Merchant Portal
        </Link>
      </header>

      {/* Main Form container */}
      <div className="w-full max-w-md mx-auto my-auto z-10 pt-8 pb-12">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fade-in-up">
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {otpSent ? "Verify your email" : mode === 'login' ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-sm text-slate-550 font-medium">
              {otpSent ? `Enter the 6-digit code sent to ${email}` : "Sign in or register using email verification code"}
            </p>
          </div>

          {/* Toggle login/signup - only show if OTP not sent */}
          {!otpSent && (
            <div className="grid grid-cols-2 p-1 bg-slate-50 rounded-xl border border-slate-200/50">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className={`py-2.5 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${mode === 'login' ? 'bg-red-600 text-white shadow shadow-red-500/10' : 'text-slate-400 hover:text-slate-700'}`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                className={`py-2.5 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${mode === 'signup' ? 'bg-red-600 text-white shadow shadow-red-500/10' : 'text-slate-400 hover:text-slate-700'}`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-4 rounded-xl font-medium flex items-start gap-2.5">
              <span>⚠️</span>
              <span className="leading-normal">{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-4 rounded-xl font-medium flex items-start gap-2.5">
              <span>✓</span>
              <span className="leading-normal">{success}</span>
            </div>
          )}

          {/* Forms */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
                <h3 className="text-slate-400 text-xs mt-2">OTP may arrive in your Inbox or Spam folder</h3>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-500/10 transition-all text-xs uppercase tracking-wider"
              >
                {loading ? 'Sending Code...' : 'Send Verification OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-3">
                <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider text-center">Enter 6-Digit Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-slate-800 text-center tracking-[0.75em] text-xl font-black focus:outline-none focus:border-red-500 transition-colors"
                />
                <div className="flex justify-between items-center text-xs text-slate-500 px-1 pt-1">
                  <button type="button" onClick={() => setOtpSent(false)} className="text-slate-550 hover:text-red-600 transition-colors">
                    ← Change Email
                  </button>
                  {cooldown > 0 ? (
                    <span>Resend in {cooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp(null)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-500 font-semibold transition-colors disabled:opacity-50"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-500/10 transition-all text-xs uppercase tracking-wider"
              >
                {loading ? 'Verifying...' : 'Verify & Log In'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto text-center z-10 text-xs text-slate-400 pb-2">
        &copy; {new Date().getFullYear()} Returno. All rights reserved.
      </footer>
    </main>
  );
}
