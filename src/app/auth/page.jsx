"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-dark-950 text-white">
        <div className="text-sm font-semibold tracking-wider text-slate-500 animate-pulse">Initializing Security Session...</div>
      </main>
    }>
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tabs: 'customer' or 'merchant'
  const [activeTab, setActiveTab] = useState('customer');
  // Merchant submode: 'login' or 'register'
  const [merchantMode, setMerchantMode] = useState('login');

  // Loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Customer Form
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Merchant Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Read optional query parameters to pre-set tabs
    const tabParam = searchParams.get('tab');
    const timer = setTimeout(() => {
      if (tabParam === 'register') {
        setActiveTab('merchant');
        setMerchantMode('register');
      } else if (tabParam === 'login') {
        setActiveTab('customer');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [searchParams]);

  // Cooldown effect for Resend OTP button
  useEffect(() => {
    let timer;
    if (otpSent && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, cooldown]);

  // Handle Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpSent(true);
      setCooldown(60); // Start 60-second cooldown timer
      setSuccess('OTP verification code sent successfully to your phone!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setSuccess('Logged in successfully! Redirecting...');

      // Force page reload to trigger middleware and update layout state
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

  // Handle Merchant Authentication
  const handleMerchantAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = merchantMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = merchantMode === 'register'
        ? { name, email, password, role: 'business' }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setSuccess(merchantMode === 'register' ? 'Registration successful! Redirecting...' : 'Logged in successfully! Redirecting...');

      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-dark-950 py-16 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-dark-900/60 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative z-10">

        {/* Brand Link */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-purple-500 tracking-tight">
            ✨ Returno
          </Link>
          <p className="text-slate-400 text-sm mt-2">QR-Based Customer Loyalty Platform</p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1.5 bg-dark-950/80 rounded-full border border-white/5 mb-8">
          <button
            type="button"
            onClick={() => { setActiveTab('customer'); setError(''); setSuccess(''); }}
            className={`py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'customer'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            Customer Login
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('merchant'); setError(''); setSuccess(''); }}
            className={`py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'merchant'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            Merchant Portal
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl mb-6 font-medium">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl mb-6 font-medium">
            ✓ {success}
          </div>
        )}

        {/* CUSTOMER OTP LOGIN FORM */}
        {activeTab === 'customer' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-500 text-sm font-medium">+91</span>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">New customers will be registered automatically.</p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-[0_5px_15px_rgba(37,99,235,0.3)] hover:shadow-[0_5px_25px_rgba(37,99,235,0.5)] transition-all text-sm"
                >
                  {loading ? 'Sending Code...' : 'Send Verification OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Enter OTP Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-center tracking-[1em] text-lg font-bold focus:outline-none focus:border-brand-500 transition-colors"
                  />
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <span className="text-slate-500">Sent to +{phone}</span>
                    <button type="button" onClick={() => setOtpSent(false)} className="text-brand-400 hover:underline">Change Number</button>
                  </div>
                  <div className="flex justify-end items-center mt-3 text-xs">
                    {cooldown > 0 ? (
                      <span className="text-slate-500 font-medium">Resend OTP in {cooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp(null)}
                        disabled={loading}
                        className="text-brand-400 hover:text-brand-300 font-semibold hover:underline transition-colors disabled:opacity-50"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-[0_5px_15px_rgba(37,99,235,0.3)] transition-all text-sm"
                >
                  {loading ? 'Verifying...' : 'Verify & Log In'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* MERCHANT LOGIN/REGISTER FORM */}
        {activeTab === 'merchant' && (
          <form onSubmit={handleMerchantAuth} className="space-y-5">
            {merchantMode === 'register' && (
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Business Owner Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                required
                placeholder="owner@mycafe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-[0_5px_15px_rgba(147,51,234,0.3)] hover:shadow-[0_5px_25px_rgba(147,51,234,0.5)] transition-all text-sm"
            >
              {loading
                ? 'Processing...'
                : merchantMode === 'register' ? 'Create Merchant Account' : 'Merchant Sign In'}
            </button>

            <div className="text-center text-xs mt-4">
              {merchantMode === 'login' ? (
                <p className="text-slate-400">
                  New to Returno?{' '}
                  <button type="button" onClick={() => setMerchantMode('register')} className="text-purple-400 font-semibold hover:underline">
                    Create an account
                  </button>
                </p>
              ) : (
                <p className="text-slate-400">
                  Already have a merchant account?{' '}
                  <button type="button" onClick={() => setMerchantMode('login')} className="text-purple-400 font-semibold hover:underline">
                    Sign in here
                  </button>
                </p>
              )}
            </div>
          </form>
        )}

      </div>
    </main>
  );
}
