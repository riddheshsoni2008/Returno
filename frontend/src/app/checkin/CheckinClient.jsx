"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function CheckinClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState({ type: "", text: "" });

  // Store JWT auth token directly if available
  const authTokenRef = useRef(null);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log(
          `[Check-in Flow] Checking current user session on mount. Token in URL: ${token}`,
        );
        const res = await apiFetch("/auth/me");
        console.log(
          `[Check-in Flow] /auth/me session response status: ${res.status}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            console.log(
              `[Check-in Flow] Session check succeeded. User: ${data.user.email} (ID: ${data.user._id})`,
            );
            setUser(data.user);
            return;
          }
        }

        console.log(`[Check-in Flow] Session check returned not logged in.`);
      } catch (err) {
        console.error("[Check-in Flow] Session check error:", err);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [token]);

  // Handle redirect if unauthenticated
  useEffect(() => {
    if (!loading && !user && token) {
      const fullPath = window.location.pathname + window.location.search;
      console.log(
        `[Check-in Flow] Redirect Event: Redirecting unauthenticated user to login.`,
      );
      console.log(`- Current Path: ${window.location.href}`);
      console.log(`- Destination: /auth?redirect=${fullPath}`);
      const redirectPath = encodeURIComponent(fullPath);
      router.push(`/auth?redirect=${redirectPath}`);
    }
  }, [loading, user, token, router]);

  // Auto-validate when user is available and token exists
  useEffect(() => {
    if (user && token && !result && !processing && !error) {
      handleValidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleValidate = async () => {
    if (!token) {
      console.error("[Check-in Flow] Aborted validation: No token in URL.");
      return;
    }
    if (!user) {
      console.error("[Check-in Flow] Aborted validation: User not loaded.");
      return;
    }
    setProcessing(true);
    setError("");

    console.log(`[Check-in Flow] Initiating validation of check-in token.`);
    console.log(`- QR Token: ${token}`);
    console.log(`- User ID: ${user._id}`);
    console.log(`- User Email: ${user.email}`);

    try {
      // Build request options with explicit auth header if we have a fresh token
      const fetchOptions = {
        method: "POST",
        body: JSON.stringify({ token }),
      };

      // If we just got a fresh JWT from OTP verify, pass it directly
      if (authTokenRef.current) {
        console.log(
          `- Passing fresh token in headers: Bearer ${authTokenRef.current.substring(0, 15)}...`,
        );
        fetchOptions.headers = {
          Authorization: `Bearer ${authTokenRef.current}`,
        };
      } else {
        console.log(
          `- No inline token ref. Falling back to cookies/localStorage.`,
        );
      }

      const res = await apiFetch("/checkin/validate", fetchOptions);
      console.log(`[Check-in Flow] Validate response status: ${res.status}`);
      const data = await res.json();

      if (!res.ok) {
        console.error(`[Check-in Flow] Validation failed:`, data.error);
        if (data.notEnrolled) {
          setError(`not_enrolled:${data.campaignId}`);
        } else {
          setError(data.error || "Check-in failed");
        }
      } else {
        console.log(`[Check-in Flow] Validation succeeded! Result:`, data);
        setResult(data);
      }
    } catch (err) {
      console.error("[Check-in Flow] Validation request error:", err);
      setError(err.message || "Network error");
    } finally {
      setProcessing(false);
    }
  };

  const handleRestartCampaign = async (campaignId) => {
    setProcessing(true);
    try {
      const fetchOptions = { method: "POST" };
      if (authTokenRef.current) {
        fetchOptions.headers = {
          Authorization: `Bearer ${authTokenRef.current}`,
        };
      }
      const res = await apiFetch(
        `/checkin/restart/${campaignId}`,
        fetchOptions,
      );
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({
          type: "success",
          text: "Campaign restarted! Processing your new stamp...",
        });
        setResult(null);
        handleValidate(); // Automatically re-validate the same QR token!
      } else {
        setError(data.error || "Failed to restart campaign.");
        setProcessing(false);
      }
    } catch (err) {
      setError("Network error restarting campaign.");
      setProcessing(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 text-center space-y-5 shadow-xl">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-xl font-black text-slate-900">
            Missing QR Token
          </h1>
          <p className="text-sm text-slate-500">
            No check-in token found. Please scan the QR code at the shop
            counter.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
          >
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
          <p className="text-xs text-slate-500 font-medium">
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div
        className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xl relative z-10 space-y-6"
        style={{ animation: "fade-in-up 0.5s ease-out" }}
      >
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-red-500/10 border border-slate-100 mb-3 text-white">
            📱
          </div>
          <h1 className="text-lg font-black text-slate-900">Daily Check-In</h1>
          <p className="text-xs text-slate-500 mt-1">
            Scan completed — processing your visit
          </p>
        </div>

        {feedbackMsg.text && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold ${
              feedbackMsg.type === "success"
                ? "bg-emerald-50 border border-emerald-100 text-emerald-600"
                : "bg-red-50 border border-red-100 text-red-600"
            }`}
          >
            {feedbackMsg.type === "success" ? "✓" : "⚠️"} {feedbackMsg.text}
          </div>
        )}

        {/* Not logged in / Redirecting */}
        {!user && (
          <div className="text-center space-y-4 py-6">
            <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-600 font-bold">
              Authenticating...
            </p>
            <p className="text-xs text-slate-400">
              Redirecting you to login to complete check-in.
            </p>
          </div>
        )}

        {/* Processing */}
        {user && processing && (
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-600 font-medium">
              Validating check-in...
            </p>
          </div>
        )}

        {/* Error state */}
        {user && !processing && error && (
          <div className="space-y-5 text-center">
            {error.startsWith("not_enrolled:") ? (
              <>
                <div className="text-4xl">🔒</div>
                <h3 className="text-lg font-black text-slate-900">
                  Not Enrolled
                </h3>
                <p className="text-xs text-slate-500">
                  You need to join this campaign first before checking in.
                </p>
                <Link
                  href={`/join/campaign/${error.split(":")[1]}`}
                  className="inline-block w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-colors uppercase tracking-wider"
                >
                  Join Campaign Now
                </Link>
              </>
            ) : (
              <>
                <div className="text-4xl">❌</div>
                <h3 className="text-lg font-black text-slate-900">
                  Check-in Failed
                </h3>
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
                  {error}
                </p>
                <Link
                  href="/wallet"
                  className="inline-block px-6 py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Go to Wallet
                </Link>
              </>
            )}
          </div>
        )}

        {/* Needs Restart */}
        {result && result.needsRestart && (
          <div
            className="space-y-6 text-center"
            style={{ animation: "fade-in-up 0.4s ease-out" }}
          >
            <div
              className="text-5xl"
              style={{ animation: "bounce 0.6s ease-out" }}
            >
              🏆
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              Campaign Completed!
            </h3>
            <p className="text-sm text-slate-600 bg-emerald-50 border border-emerald-100 rounded-xl p-4 font-bold">
              {result.message}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleRestartCampaign(result.campaignId)}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all uppercase tracking-wider"
              >
                🔄 Refresh Campaign
              </button>
              <Link
                href="/wallet"
                className="inline-block w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors uppercase tracking-wider"
              >
                Go to Wallet
              </Link>
            </div>
          </div>
        )}

        {/* Success — already claimed today */}
        {result && result.alreadyClaimed && (
          <div
            className="space-y-5 text-center"
            style={{ animation: "fade-in-up 0.4s ease-out" }}
          >
            <div className="text-4xl">✅</div>
            <h3 className="text-lg font-black text-slate-900">
              Already Checked In Today!
            </h3>
            <p className="text-xs text-slate-500">
              Come back tomorrow to keep your streak alive.
            </p>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-5 space-y-3">
              <div className="text-3xl">🔥</div>
              <div className="text-2xl font-black text-amber-700">
                {result.currentStreak}-day streak
              </div>
              <div className="flex gap-3 justify-center text-xs text-slate-600">
                <span>
                  Best:{" "}
                  <span className="font-bold text-amber-700">
                    {result.longestStreak}
                  </span>
                </span>
                <span>•</span>
                <span>
                  Points:{" "}
                  <span className="font-bold text-red-600">
                    {result.totalPoints}
                  </span>
                </span>
              </div>
            </div>
            <Link
              href="/wallet"
              className="inline-block w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-all uppercase tracking-wider"
            >
              💼 Go to Wallet
            </Link>
          </div>
        )}

        {/* Success — new check-in */}
        {result && !result.alreadyClaimed && !result.needsRestart && (
          <div
            className="space-y-6 text-center"
            style={{ animation: "fade-in-up 0.4s ease-out" }}
          >
            {result.rewardUnlocked ? (
              <div className="space-y-2">
                <div
                  className="text-5xl"
                  style={{ animation: "bounce 0.6s ease-out" }}
                >
                  🎉🏆
                </div>
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">
                  Reward Unlocked!
                </h3>
                <p className="text-xs text-slate-500">
                  You earned:{" "}
                  <span className="font-bold text-red-600">
                    {result.rewardTitle}
                  </span>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl">✨</div>
                <h3 className="text-xl font-black text-slate-900">
                  Check-in Complete!
                </h3>
              </div>
            )}

            {/* Streak Display */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl">🔥</span>
                <span className="text-3xl font-black text-amber-700">
                  {result.currentStreak}
                </span>
                <span className="text-sm font-bold text-amber-600">
                  day streak
                </span>
              </div>
              <div className="flex justify-center gap-1">
                {Array.from({ length: Math.min(result.currentStreak, 7) }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold shadow-sm"
                      style={{
                        animation: `scale-up 0.3s ease-out ${i * 0.08}s both`,
                      }}
                    >
                      {i + 1}
                    </div>
                  ),
                )}
                {result.currentStreak > 7 && (
                  <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 text-[8px] font-bold">
                    +{result.currentStreak - 7}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white rounded-xl p-2 border border-amber-100">
                  <div className="text-sm font-black text-red-600">
                    +{result.pointsAwarded}
                  </div>
                  <div className="text-[8px] text-slate-400 font-bold uppercase">
                    Points
                  </div>
                </div>
                <div className="bg-white rounded-xl p-2 border border-amber-100">
                  <div className="text-sm font-black text-slate-800">
                    {result.totalPoints}
                  </div>
                  <div className="text-[8px] text-slate-400 font-bold uppercase">
                    Total Pts
                  </div>
                </div>
                <div className="bg-white rounded-xl p-2 border border-amber-100">
                  <div className="text-sm font-black text-amber-700">
                    {result.longestStreak}
                  </div>
                  <div className="text-[8px] text-slate-400 font-bold uppercase">
                    Best
                  </div>
                </div>
              </div>
            </div>

            {/* Stamp Progress */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Stamp Progress
              </div>
              <div className="flex justify-center gap-1.5 flex-wrap">
                {Array.from({ length: result.requiredStamps }).map((_, idx) => {
                  const isStamped = idx < result.currentStamps;
                  return (
                    <div
                      key={idx}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs font-bold transition-all ${
                        isStamped
                          ? "border-amber-300 bg-amber-100 text-amber-700 shadow-sm"
                          : "border-slate-200 bg-white text-slate-300"
                      }`}
                    >
                      {isStamped ? "⭐" : idx + 1}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">
                {result.currentStamps}/{result.requiredStamps} stamps collected
              </p>
            </div>

            <Link
              href="/wallet"
              className="inline-block w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-all uppercase tracking-wider"
            >
              💼 Go to Wallet
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
