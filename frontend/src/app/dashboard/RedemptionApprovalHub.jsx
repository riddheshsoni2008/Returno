"use client";

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function RedemptionApprovalHub({ initialClaims, verificationCode }) {
 const [claims, setClaims] = useState(initialClaims);
 const [loadingId, setLoadingId] = useState(null);
 const [feedback, setFeedback] = useState({ type: '', text: '' });

 const handleApprove = async (rewardId) => {
 setLoadingId(rewardId);
 setFeedback({ type: '', text: '' });

 try {
 const res = await apiFetch('/rewards/approve', {
 method: 'POST',
 body: JSON.stringify({ rewardId, verificationCode }),
 });
 const data = await res.json();

 if (!res.ok) {
 throw new Error(data.error || 'Failed to approve redemption');
 }

 setFeedback({ type: 'success', text: 'Reward redeemed successfully!' });
 // Remove approved item from list
 setClaims(claims.filter(claim => claim._id !== rewardId));
 } catch (err) {
 setFeedback({ type: 'error', text: err.message });
 } finally {
 setLoadingId(null);
 }
 };

 if (claims.length === 0) {
 return (
 <div className="text-center py-6 text-text-secondary text-sm">
 No pending rewards to approve. Active claims will appear here instantly.
 </div>
 );
 }

 return (
 <div className="space-y-4">
 {feedback.text && (
 <div className={`p-3.5 rounded-xl text-xs font-semibold ${
 feedback.type === 'success' 
 ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
 : 'bg-red-500/10 border border-red-500/20 text-red-400'
 }`}>
 {feedback.type === 'success' ? '✓' : '⚠️'} {feedback.text}
 </div>
 )}

 <div className="divide-y divide-white/5">
 {claims.map((claim) => (
 <div key={claim._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
 <div>
 <div className="font-bold text-slate-200 text-sm">
 🎁 {claim.rewardTitle}
 </div>
 <div className="text-xs text-text-muted mt-1">
 Claimed by <span className="text-slate-200 font-semibold">{claim.customerId.name}</span> (+{claim.customerId.phone})
 </div>
 <div className="text-[10px] text-text-secondary mt-1">
 Requested on {new Date(claim.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
 </div>
 </div>

 <button
 onClick={() => handleApprove(claim._id)}
 disabled={loadingId !== null}
 className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-80 text-white text-xs font-bold shadow-lg hover:-translate-y-0.5 transition-all w-full sm:w-auto"
 >
 {loadingId === claim._id ? 'Approving...' : 'Confirm Redemption'}
 </button>
 </div>
 ))}
 </div>
 </div>
 );
}
