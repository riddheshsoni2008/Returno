"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md border-b border-slate-200 py-4 shadow-sm" : "bg-transparent py-6"
        }`}
    >
      <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
          <span className="text-brand-600">Returno</span>
        </Link>
        <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
          <Link href="#features" className="hover:text-brand-600 transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-brand-600 transition-colors">How it Works</Link>
          <Link href="#pricing" className="hover:text-brand-600 transition-colors">Pricing</Link>
          <Link href="#faq" className="hover:text-brand-600 transition-colors">FAQ</Link>
        </div>
        <div className="flex space-x-4 items-center">
          <Link href="/auth" className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors hidden sm:block">
            Customer Login
          </Link>
          <Link href="/merchant/auth" className="px-5 py-2.5 rounded-full bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-all shadow-sm">
            Merchant Portal
          </Link>
        </div>
      </div>
    </nav>
  );
}
