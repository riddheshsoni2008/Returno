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

  const business = data.user;

  return (
    <div className="min-h-screen bg-surface-container-low text-on-background flex flex-col md:flex-row font-sans">
      {/* Sidebar - Desktop */}
      <aside className="w-full md:w-64 bg-surface border-b md:border-b-0 md:border-r border-outline-variant flex flex-col justify-between p-5 md:p-6 flex-shrink-0">
        <div>
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 px-2 mb-8 md:mb-10">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-on-primary font-bold shadow-sm transition-transform group-hover:scale-105">
                R
              </div>
              <div>
                <h1 className="text-base font-bold text-primary leading-none">Returno</h1>
                <p className="text-[9px] text-outline uppercase tracking-wider mt-0.5">Enterprise Retention</p>
              </div>
            </Link>
          </div>

          {/* Profile Card */}
          {business && (
            <div className="bg-surface-container-low border border-outline-variant p-3.5 rounded-xl mb-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                {business.businessName ? business.businessName[0].toUpperCase() : 'B'}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-xs truncate text-on-surface">{business.businessName}</div>
                <div className="text-[9px] text-outline font-bold uppercase tracking-wider truncate">
                  {business.loyaltyConfiguration?.category || 'Cafe'}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <MerchantNav />
        </div>

        <div className="hidden md:block mt-8 border-t border-outline-variant pt-6">
          <SignOutButton />
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-28 md:pb-12 overflow-y-auto">
        <div className="block md:hidden mb-6 flex justify-end">
          <SignOutButton />
        </div>
        <div className="animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  );
}
