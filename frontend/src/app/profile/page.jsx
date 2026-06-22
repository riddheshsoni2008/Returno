import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function CustomerProfilePage() {
 const cookieStore = await cookies();
 const token = cookieStore.get('token')?.value;

 if (!token) {
 redirect('/auth');
 }

 const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';
 let user = null;
 let rewardsCount = 0;

 try {
 const res = await fetch(`${backendUrl}/wallet`, {
 headers: { 'Cookie': `token=${token}` },
 cache: 'no-store'
 });

 if (res.ok) {
 const data = await res.json();
 user = data.user;
 rewardsCount = data.rewards?.length || 0;
 }
 } catch (error) {
 console.error('Error fetching profile data:', error);
 }

 if (!user) {
 redirect('/auth?expired=true');
 }

 return (
 <main className="min-h-screen bg-dark-950 text-white py-12 px-6 flex flex-col justify-between relative overflow-hidden">
 {/* Background glow */}
 <div className="absolute top-[-10%] right-[-10%] w-[100%] h-[40%] bg-gradient-to-b from-brand-500/10 via-transparent to-transparent blur-[120px] pointer-events-none"></div>

 <div className="max-w-md w-full mx-auto space-y-8 my-auto z-10">
 {/* Navigation */}
 <div className="flex justify-between items-center">
 <Link href="/wallet" className="text-xs font-semibold text-text-muted hover:text-white transition-colors bg-white/5 border border-white/10 rounded-full px-4 py-2">
 ← Back to Wallet
 </Link>
 <span className="text-xs font-semibold text-brand-400">Customer Profile</span>
 </div>

 {/* Profile Card */}
 <div className="bg-dark-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
 <div className="flex items-center gap-4">
 <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-brand-600/30">
 {user.name ? user.name[0].toUpperCase() : 'C'}
 </div>
 <div>
 <h1 className="text-xl font-bold text-slate-100">{user.name}</h1>
 <p className="text-xs text-text-secondary capitalize">{user.role} Member</p>
 </div>
 </div>

 <div className="border-t border-white/5 pt-6 space-y-4">
 <div className="space-y-1">
 <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Email Address</span>
 <span className="text-sm font-semibold text-text-muted">{user.email}</span>
 </div>
 <div className="space-y-1">
 <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Joined Platform</span>
 <span className="text-sm font-semibold text-text-muted">
 {new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
 </span>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
 <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-center">
 <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-1">Rewards Won</span>
 <span className="text-2xl font-black text-brand-400">{rewardsCount}</span>
 </div>
 <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-center">
 <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-1">Tier Level</span>
 <span className="text-lg font-black text-yellow-400 flex items-center justify-center gap-1">
 <span>⭐</span> Silver
 </span>
 </div>
 </div>
 </div>
 </div>

 <footer className="w-full text-center text-[10px] text-slate-600 mt-8">
 Returno Security Session &bull; Verified via Passwordless OTP
 </footer>
 </main>
 );
}
