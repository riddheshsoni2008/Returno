"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiFetch("/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Error fetching session:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await apiFetch("/auth/me", { method: "POST" });
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      if (typeof document !== 'undefined') {
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
        try {
          localStorage.removeItem('token');
        } catch (err) {
          // Ignore
        }
      }
      setUser(null);
      window.location.reload();
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 shadow-sm"
          : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
        <Link
          href="/"
          className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2 hover:scale-[1.01] transition-transform"
        >
          <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center text-sm shadow-md shadow-blue-500/25 text-white font-extrabold">
            ✨
          </span>
          <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 bg-clip-text text-transparent">
            Returno
          </span>
        </Link>
        <div className="hidden md:flex space-x-8 text-sm font-semibold text-slate-600">
          <Link
            href="#features"
            className="hover:text-blue-600 transition-colors relative py-1 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-300"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="hover:text-blue-600 transition-colors relative py-1 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-300"
          >
            How it Works
          </Link>
          <Link
            href="#pricing"
            className="hover:text-blue-600 transition-colors relative py-1 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-300"
          >
            Pricing
          </Link>
          <Link 
            href="#faq" 
            className="hover:text-blue-600 transition-colors relative py-1 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-blue-600 hover:after:w-full after:transition-all after:duration-300"
          >
            FAQ
          </Link>
        </div>
        <div className="flex space-x-4 items-center min-h-[40px]">
          {!loading && (
            <>
              {user ? (
                <>
                  {user.role === "customer" ? (
                    <Link
                      href="/wallet"
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2"
                    >
                      <i className="fas fa-wallet text-lg"></i>
                      <span className="hidden sm:inline">My Wallet</span>
                    </Link>
                  ) : (
                    <Link
                      href="/merchant/dashboard"
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <i className="fas fa-store text-lg"></i>
                      <span className="hidden sm:inline">
                        Merchant Dashboard
                      </span>
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-bold tracking-wide uppercase hover:bg-slate-100 hover:text-slate-700 transition-all flex items-center gap-2"
                    title="Sign Out"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth"
                    className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors hidden sm:flex items-center gap-2"
                  >
                    <i className="fas fa-user text-sm"></i>
                    <span>Customer Login</span>
                  </Link>
                  <Link
                    href="/merchant/auth"
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold tracking-wide uppercase hover:from-blue-500 hover:to-indigo-550 transition-all shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 flex items-center gap-2"
                    title="Merchant Portal"
                  >
                    <i className="fas fa-building text-sm"></i>
                    <span className="hidden sm:inline">Merchant Portal</span>
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
