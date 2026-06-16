import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifyToken } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Business from '@/lib/models/Business';

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/auth');
  }

  const decoded = verifyToken(token);
  if (!decoded || (decoded.role !== 'business' && decoded.role !== 'admin')) {
    redirect('/auth');
  }

  await dbConnect();
  const user = await User.findById(decoded.id);
  if (!user) {
    redirect('/auth');
  }

  const business = await Business.findOne({ ownerId: user._id });

  return (
    <div className="min-h-screen bg-dark-950 text-white flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="w-full md:w-64 bg-dark-900 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <span className="text-2xl">✨</span>
            <Link href="/" className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-purple-500">
              Returno
            </Link>
          </div>

          {business && (
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-sm">
                {business.name[0]}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-xs truncate">{business.name}</div>
                <div className="text-[10px] text-slate-400 capitalize">{business.category}</div>
              </div>
            </div>
          )}

          <nav className="space-y-1.5">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 text-sm font-medium text-slate-300 hover:text-white transition-all"
            >
              📊 Overview
            </Link>
            <Link 
              href="/dashboard/campaigns" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 text-sm font-medium text-slate-300 hover:text-white transition-all"
            >
              ⚡ Campaigns
            </Link>
            <Link 
              href="/dashboard/qrcodes" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 text-sm font-medium text-slate-300 hover:text-white transition-all"
            >
              🖨️ QR Codes
            </Link>
            <Link 
              href="/dashboard/rewards" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 text-sm font-medium text-slate-300 hover:text-white transition-all"
            >
              🎁 Rewards
            </Link>
            <Link 
              href="/dashboard/settings" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 text-sm font-medium text-slate-300 hover:text-white transition-all"
            >
              ⚙️ Settings
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-white/5 pt-6">
          <form action="/api/auth/me" method="POST" className="w-full">
            <button 
              type="submit" 
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold transition-all border border-red-500/10"
            >
              🚪 Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
