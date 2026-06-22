"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function CampaignsHub({ initialCampaigns }) {
 const router = useRouter();
 const [campaigns, setCampaigns] = useState(initialCampaigns);
 const [showForm, setShowForm] = useState(false);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [success, setSuccess] = useState('');

 // Form inputs
 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [requiredStamps, setRequiredStamps] = useState(10);
 const [rewardTitle, setRewardTitle] = useState('');

 const handleSubmit = async (e) => {
 e.preventDefault();
 setLoading(true);
 setError('');
 setSuccess('');

 try {
 const res = await apiFetch('/campaigns', {
 method: 'POST',
 body: JSON.stringify({ title, description, requiredStamps, rewardTitle }),
 });
 const data = await res.json();

 if (!res.ok) {
 throw new Error(data.error || 'Failed to create campaign');
 }

 setSuccess('Campaign created successfully!');
 // Append campaign locally
 setCampaigns([data.campaign, ...campaigns]);
 
 // Reset form
 setTitle('');
 setDescription('');
 setRequiredStamps(10);
 setRewardTitle('');
 
 // Close form and refresh page data
 setTimeout(() => {
 setShowForm(false);
 setSuccess('');
 router.refresh();
 }, 1000);

 } catch (err) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <h2 className="text-xl font-bold text-slate-200">Store Loyalty Campaigns</h2>
 <button
 onClick={() => setShowForm(!showForm)}
 className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg hover:-translate-y-0.5"
 >
 {showForm ? 'Cancel Creation' : '➕ Create New Campaign'}
 </button>
 </div>

 {error && (
 <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl font-medium">
 ⚠️ {error}
 </div>
 )}
 {success && (
 <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl font-medium">
 ✓ {success}
 </div>
 )}

 {showForm && (
 <form onSubmit={handleSubmit} className="bg-dark-900 border border-white/10 rounded-2xl p-6 space-y-4 animate-[fade-in_0.3s_ease-out]">
 <h3 className="font-bold text-slate-200 text-md">Configure Campaign Settings</h3>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">Campaign Title</label>
 <input 
 type="text"
 required
 placeholder="e.g. Cafe Premium Loyalty Stamp"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
 />
 </div>
 <div>
 <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">Reward Title</label>
 <input 
 type="text"
 required
 placeholder="e.g. 1 Free Espresso & Pastry"
 value={rewardTitle}
 onChange={(e) => setRewardTitle(e.target.value)}
 className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">Required Stamps</label>
 <input 
 type="number"
 required
 min={2}
 max={25}
 value={requiredStamps}
 onChange={(e) => setRequiredStamps(e.target.value)}
 className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
 />
 </div>
 <div>
 <label className="block text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">Short Description</label>
 <input 
 type="text"
 required
 placeholder="Collect stamps on every purchase of ₹150 or more"
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
 />
 </div>
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-80 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all text-xs uppercase tracking-wider font-semibold"
 >
 {loading ? 'Creating...' : 'Launch Loyalty Campaign'}
 </button>
 </form>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {campaigns.length === 0 ? (
 <div className="col-span-2 text-center py-12 bg-dark-900 border border-white/10 rounded-2xl text-text-secondary text-sm">
 No active campaigns found. Launch your first stamp card using the button above.
 </div>
 ) : (
 campaigns.map((camp) => (
 <div key={camp._id} className="bg-dark-900 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all flex flex-col justify-between">
 <div>
 <div className="flex justify-between items-start mb-4">
 <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full ${
 camp.isActive ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-slate-500/10 text-text-muted'
 }`}>
 {camp.isActive ? 'Active' : 'Draft'}
 </span>
 <span className="text-xs text-text-secondary">Stamps target: {camp.requiredStamps}</span>
 </div>
 <h3 className="text-xl font-bold text-slate-100 mb-2">{camp.title}</h3>
 <p className="text-text-muted text-sm mb-4 leading-relaxed">{camp.description}</p>
 <div className="bg-white/5 border border-white/5 p-4 rounded-xl mb-4">
 <div className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider mb-1">Unlocks Reward</div>
 <div className="text-sm font-bold text-yellow-400">🎁 {camp.rewardTitle}</div>
 </div>
 </div>
 
 <div className="flex gap-3">
 <a 
 href={`/dashboard/qrcodes?campaign=${camp._id}`}
 className="flex-1 text-center py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-colors border border-white/5"
 >
 🖨️ View QR Code
 </a>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 );
}
