"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MerchantNav() {
  const pathname = usePathname();

  const linkClass = (path) =>
    `flex items-center gap-2 md:gap-3 px-3.5 py-2.5 rounded-xl transition-all whitespace-nowrap text-xs md:text-sm font-bold ${
      pathname === path || (pathname && pathname.startsWith(path + "/"))
        ? "bg-red-50 text-red-600 shadow-sm border border-red-100/50"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1 pb-2 md:pb-0 md:space-y-1.5 scrollbar-none">
      <Link
        href="/merchant/dashboard"
        className={linkClass("/merchant/dashboard")}
      >
        Dashboard
      </Link>
      <Link
        href="/merchant/customers"
        className={linkClass("/merchant/customers")}
      >
        Customers
      </Link>

      <Link
        href="/merchant/settings"
        className={linkClass("/merchant/settings")}
      >
        Settings
      </Link>
    </nav>
  );
}
