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
          ? "bg-white/90 backdrop-blur-md border-b border-slate-200 py-4 shadow-sm"
          : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
        <Link
          href="/"
          className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5"
        >
          <span className="text-brand-600">Returno</span>
        </Link>
        <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
          <Link
            href="#features"
            className="hover:text-brand-600 transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="hover:text-brand-600 transition-colors"
          >
            How it Works
          </Link>
          <Link
            href="#pricing"
            className="hover:text-brand-600 transition-colors"
          >
            Pricing
          </Link>
          <Link href="#faq" className="hover:text-brand-600 transition-colors">
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
                      className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-2"
                    >
                      <i className="fas fa-wallet text-lg"></i>
                      <span className="hidden sm:inline">My Wallet</span>
                    </Link>
                  ) : (
                    <Link
                      href="/merchant/dashboard"
                      className="text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-2"
                    >
                      <i className="fas fa-store text-lg"></i>
                      <span className="hidden sm:inline">
                        Merchant Dashboard
                      </span>
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-600 text-sm font-semibold hover:bg-red-500/25 hover:text-red-700 transition-all shadow-sm flex items-center gap-2"
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
                    className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors hidden sm:flex items-center gap-2"
                  >
                    <i className="fas fa-user text-sm"></i>
                    <span>Customer Login</span>
                  </Link>
                  <Link
                    href="/merchant/auth"
                    className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-all shadow-sm flex items-center gap-2"
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
