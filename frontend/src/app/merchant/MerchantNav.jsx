"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function MerchantNav() {
  const pathname = usePathname();
  const [currentHash, setCurrentHash] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.hash;
    }
    return "";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, [pathname]);

  const links = [
    {
      name: "Dashboard",
      path: "/merchant/dashboard",
      customActive: () => pathname === "/merchant/dashboard" && !currentHash,
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      )
    },
    {
      name: "Customers",
      path: "/merchant/customers",
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 025.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      name: "Rewards",
      path: "/merchant/rewards",
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      )
    },
    {
      name: "Settings",
      path: "/merchant/settings",
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  const getIsActive = (link) => {
    if (link.customActive) {
      return link.customActive();
    }
    if (link.extraCheck) {
      return link.extraCheck(pathname);
    }
    return pathname === link.path || (pathname && pathname.startsWith(link.path + "/"));
  };

  return (
    <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1 pb-2 md:pb-0 md:space-y-1 scrollbar-none">
      {links.map((link) => {
        const active = getIsActive(link);
        return (
          <Link
            key={link.name}
            href={link.path}
            onClick={() => {
              if (link.path.includes("#")) {
                const hash = link.path.split("#")[1];
                setCurrentHash("#" + hash);
              } else {
                setCurrentHash("");
              }
            }}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 text-xs md:text-sm font-semibold tracking-tight whitespace-nowrap ${
              active
                ? "bg-purple-50/80 text-purple-700 shadow-sm border border-purple-100/50 font-bold"
                : "text-slate-650 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span className={`transition-colors duration-200 ${active ? "text-purple-600" : "text-slate-400"}`}>
              {link.icon}
            </span>
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
