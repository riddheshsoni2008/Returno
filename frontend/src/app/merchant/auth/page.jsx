"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function MerchantAuthPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
          <div className="text-sm font-semibold tracking-wider text-slate-400 animate-pulse">
            Initializing Merchant Session...
          </div>
        </main>
      }
    >
      <MerchantAuthContent />
    </Suspense>
  );
}

function MerchantAuthContent() {
  const router = useRouter();

  // Mode: 'login' or 'signup'
  const [mode, setMode] = useState("login");

  // Form inputs
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Status states
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = { email: email.toLowerCase().trim() };
      if (mode === "signup") {
        payload.businessName = businessName.trim();
        payload.ownerName = ownerName.trim();
      }

      const res = await apiFetch("/auth/business/otp/send", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      setOtpSent(true);
      setCooldown(60);
      setSuccess(data.message || "OTP verification code sent to your email!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await apiFetch("/auth/business/otp/verify", {
        method: "POST",
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          code: otpCode.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      if (data.token) {
        document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        try {
          localStorage.setItem("token", data.token);
        } catch (err) {
          console.error("Error writing token to localStorage:", err);
        }
      }

      setSuccess("Merchant portal authorized! Redirecting...");
      setTimeout(() => {
        router.push("/merchant/dashboard");
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 font-sans relative overflow-hidden px-6 py-8">
      {/* Background elegant gradient mesh & glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.25] pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-rose-100/30 via-rose-50/5 to-transparent blur-[80px] pointer-events-none rounded-full"></div>

      {/* Header */}
      <header className="w-full max-w-md mx-auto flex justify-between items-center z-10 pt-4">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5 group"
        >
          <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center shadow-md shadow-rose-500/20 text-white transition-transform group-hover:scale-105">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </span>
          Returno
        </Link>
        <Link
          href="/auth"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-white border border-slate-200 hover:border-slate-300 rounded-full px-4.5 py-2 shadow-sm"
        >
          Customer Portal
        </Link>
      </header>

      {/* Main Form container */}
      <div className="w-full max-w-md mx-auto my-auto z-10 pt-8 pb-12">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/50 space-y-6 animate-[fade-in_0.2s_ease-out]">
          <div className="space-y-2">
            <span className="inline-block text-[10px] font-bold tracking-widest text-rose-600 uppercase bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
              Merchant Hub
            </span>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
              {otpSent
                ? "Verify Email"
                : mode === "login"
                ? "Sign In"
                : "Register Business"}
            </h2>
            <p className="text-sm text-slate-500">
              {otpSent
                ? `Enter the 6-digit code sent to ${email}`
                : "Enter your details to access your merchant workspace."}
            </p>
          </div>

          {/* Toggle login/signup - only show if OTP not sent */}
          {!otpSent && (
            <div className="grid grid-cols-2 p-1 bg-slate-50 rounded-xl border border-slate-200/50">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccess("");
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  mode === "login"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setSuccess("");
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  mode === "signup"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-4 rounded-xl font-medium flex items-start gap-2.5 shadow-inner">
              <span className="text-sm leading-none">⚠️</span>
              <span className="leading-normal">{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-4 rounded-xl font-medium flex items-start gap-2.5 shadow-inner">
              <span className="text-sm leading-none">✓</span>
              <span className="leading-normal">{success}</span>
            </div>
          )}

          {/* Forms */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      Business / Cafe Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Blue Tokai Cafe"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                      Owner Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  Business Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="owner@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                  />
                </div>
                <h4 className="text-[10px] text-slate-400 font-medium">
                  OTP code may arrive in your Inbox or Spam folder.
                </h4>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-80 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-rose-500/10 transition-all text-xs uppercase tracking-wider"
              >
                {loading ? "Sending Code..." : "Send Verification OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-3">
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider text-center">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-4 px-4 text-slate-900 text-center tracking-[0.75em] text-xl font-bold focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                />
                <div className="flex justify-between items-center text-xs text-slate-500 px-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    ← Change Email
                  </button>
                  {cooldown > 0 ? (
                    <span className="text-slate-400">Resend in {cooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp(null)}
                      disabled={loading}
                      className="text-rose-600 hover:text-rose-500 font-semibold transition-colors disabled:opacity-80"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-80 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-rose-500/10 transition-all text-xs uppercase tracking-wider"
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto text-center z-10 text-[11px] text-slate-400 pb-2 font-medium">
        &copy; {new Date().getFullYear()} Returno Merchant Solutions.
      </footer>
    </main>
  );
}
