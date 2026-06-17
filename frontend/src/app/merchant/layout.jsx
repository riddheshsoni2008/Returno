import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from './SignOutButton';

export default async function MerchantLayout({ children }) {
  // Read pathname forwarded by middleware/proxy to prevent self-redirect loop on auth page
  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || '';

  if (pathname === '/merchant/auth') {
    return <>{children}</>;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/merchant/auth');
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  let data = null;
  let redirectPath = null;

  try {
    const res = await fetch(`${backendUrl}/auth/me`, {
      headers: {
        'Cookie': `token=${token}`
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      redirectPath = '/merchant/auth?expired=true';
    } else {
      data = await res.json();
      if (!data.success || !data.user || data.user.role !== 'business') {
        redirectPath = '/merchant/auth?expired=true';
      }
    }
  } catch (error) {
    redirectPath = '/merchant/auth?expired=true';
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  const business = data.user; // Under new architecture, data.user IS the Business document

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col md:flex-row font-sans">
      {/* Sidebar - Desktop / Top Navigation - Mobile */}
      <aside className="w-full md:w-64 bg-dark-900 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between p-5 md:p-6">
        <div>
          <div className="flex items-center justify-between md:justify-start gap-2 mb-6 md:mb-8">
            <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
              <span className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-sm text-white shadow-lg shadow-purple-600/30">🏢</span>
              Returno
            </Link>
            <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">Merchant</span>
          </div>

          {business && (
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl mb-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
                {business.businessName ? business.businessName[0].toUpperCase() : 'B'}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-xs truncate text-slate-200">{business.businessName}</div>
                <div className="text-[10px] text-slate-400 capitalize truncate">{business.loyaltyConfiguration?.category || 'Cafe'}</div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1 pb-2 md:pb-0 md:space-y-1.5 scrollbar-none">
            <Link 
              href="/merchant/dashboard" 
              className="flex items-center gap-2 md:gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-xs md:text-sm font-semibold text-slate-300 hover:text-white transition-all whitespace-nowrap"
            >
              📊 Dashboard
            </Link>
            <Link 
              href="/merchant/customers" 
              className="flex items-center gap-2 md:gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-xs md:text-sm font-semibold text-slate-300 hover:text-white transition-all whitespace-nowrap"
            >
              👥 Customers
            </Link>
            <Link 
              href="/merchant/rewards" 
              className="flex items-center gap-2 md:gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-xs md:text-sm font-semibold text-slate-300 hover:text-white transition-all whitespace-nowrap"
            >
              🎁 Rewards
            </Link>
            <Link 
              href="/merchant/settings" 
              className="flex items-center gap-2 md:gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 text-xs md:text-sm font-semibold text-slate-300 hover:text-white transition-all whitespace-nowrap"
            >
              ⚙️ Settings
            </Link>
          </nav>
        </div>

        <div className="hidden md:block mt-8 border-t border-white/5 pt-6">
          <SignOutButton />
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="block md:hidden mb-6 flex justify-end">
          <SignOutButton />
        </div>
        {children}
      </main>
    </div>
  );
}
