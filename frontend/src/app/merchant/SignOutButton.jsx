"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function SignOutButton() {
 const router = useRouter();
 const [loading, setLoading] = useState(false);

 const handleSignOut = async () => {
 if (loading) return;
 setLoading(true);
 try {
 await apiFetch("/auth/me", {
 method: "POST",
 });
 } catch (err) {
 console.error(
 "Logout API call failed, signing out locally:",
 err.message,
 );
 } finally {
 // Always delete the cookie locally even if the backend request fails or is cross-origin
 if (typeof document !== "undefined") {
 document.cookie =
 "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
 try {
 localStorage.removeItem('token');
 } catch (err) {
 // Ignore
 }
 }
 router.push("/merchant/auth");
 router.refresh();
 setLoading(false);
 }
 };

 return (
 <button
 onClick={handleSignOut}
 disabled={loading}
 className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 text-slate-600 text-xs md:text-sm font-semibold transition-all border border-slate-200/50 disabled:opacity-80"
 >
 <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
 </svg>
 {loading ? "Signing Out..." : "Sign Out"}
 </button>
 );
}
