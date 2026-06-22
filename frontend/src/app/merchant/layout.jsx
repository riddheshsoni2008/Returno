import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from './SignOutButton';
import MerchantNav from './MerchantNav';

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

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      {/* Sidebar - Desktop / Top Navigation - Mobile */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-150 flex flex-col justify-between p-5 md:p-6 flex-shrink-0">
        <div>
          <div className="flex items-center justify-between md:justify-start gap-2.5 mb-6 md:mb-8">
            <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900 hover:scale-[1.01] transition-transform">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-sm text-white shadow-md shadow-purple-550/20">✨</span>
              Returno
            </Link>
            <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-555/10 border border-purple-200/50 text-purple-650">Merchant</span>
          </div>

          {business && (
            <div className="bg-slate-50/70 border border-slate-150 p-3 rounded-xl mb-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-extrabold text-sm text-white flex-shrink-0 shadow-sm">
                {business.businessName ? business.businessName[0].toUpperCase() : 'B'}
              </div>
              <div className="overflow-hidden">
                <div className="font-extrabold text-xs truncate text-slate-900">{business.businessName}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">{business.loyaltyConfiguration?.category || 'Cafe'}</div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <MerchantNav />
        </div>

        <div className="hidden md:block mt-8 border-t border-slate-100 pt-6">
          <SignOutButton />
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full">
        <div className="block md:hidden mb-6 flex justify-end">
          <SignOutButton />
        </div>
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
