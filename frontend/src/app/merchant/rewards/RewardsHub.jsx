"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import QRCode from 'qrcode';

export default function RewardsHub({ initialCampaigns, initialClaims, verificationCode, appUrl }) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [claims, setClaims] = useState(initialClaims);
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' or 'approvals'

  // Campaign Form inputs
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requiredStamps, setRequiredStamps] = useState(10);
  const [rewardTitle, setRewardTitle] = useState('');

  // QR Modal / Drawer state
  const [selectedCampaignForQr, setSelectedCampaignForQr] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [loadingApprovalId, setLoadingApprovalId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Generate QR when selectedCampaignForQr changes
  useEffect(() => {
    if (selectedCampaignForQr) {
      const scanUrl = `${appUrl}/scan/${selectedCampaignForQr._id}`;
      QRCode.toDataURL(scanUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff'
        }
      }).then(url => {
        setQrDataUrl(url);
      }).catch(err => {
        console.error('Error generating QR code:', err);
      });
    } else {
      setQrDataUrl('');
    }
  }, [selectedCampaignForQr, appUrl]);

  // Handle Campaign Submit
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch('/campaigns', {
        method: 'POST',
        body: JSON.stringify({ title, description, requiredStamps: parseInt(requiredStamps), rewardTitle }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create campaign');
      }

      setSuccess('Loyalty campaign launched successfully!');
      setCampaigns([data.campaign, ...campaigns]);
      
      // Reset form
      setTitle('');
      setDescription('');
      setRequiredStamps(10);
      setRewardTitle('');
      
      setTimeout(() => {
        setShowForm(false);
        setSuccess('');
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Approve Claim
  const handleApproveClaim = async (rewardId) => {
    setLoadingApprovalId(rewardId);
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch('/rewards/approve', {
        method: 'POST',
        body: JSON.stringify({ rewardId, verificationCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve redemption');
      }

      setSuccess('Reward redemption approved!');
      setClaims(claims.filter(c => c._id !== rewardId));
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingApprovalId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Selectors */}
      <div className="flex border-b border-white/10 gap-6">
        <button
          onClick={() => { setActiveTab('campaigns'); setError(''); setSuccess(''); }}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'campaigns' ? 'text-purple-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚡ Loyalty Campaigns
          {activeTab === 'campaigns' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded"></div>}
        </button>
        <button
          onClick={() => { setActiveTab('approvals'); setError(''); setSuccess(''); }}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'approvals' ? 'text-purple-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🎁 Pending Approvals
          {claims.length > 0 && (
            <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
              {claims.length}
            </span>
          )}
          {activeTab === 'approvals' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded"></div>}
        </button>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-xl font-medium flex items-start gap-2.5">
          <span>⚠️</span>
          <span className="leading-normal">{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-4 rounded-xl font-medium flex items-start gap-2.5">
          <span>✓</span>
          <span className="leading-normal">{success}</span>
        </div>
      )}

      {/* CAMPAIGNS TAB */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-200">Active Stamp Cards</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage and track your active loyalty tiers.</p>
            </div>
            <button
              onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/20"
            >
              {showForm ? 'Cancel Creation' : '➕ New Campaign'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleCreateCampaign} className="bg-dark-900 border border-white/10 rounded-2xl p-5 md:p-6 space-y-4 animate-[fade-in_0.25s_ease-out]">
              <h4 className="font-bold text-slate-200 text-sm">Configure Campaign Details</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">Campaign Title</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Cafe Stamp Card"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">Reward Title</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Free Latte & Cookie"
                    value={rewardTitle}
                    onChange={(e) => setRewardTitle(e.target.value)}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">Required Stamps</label>
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
                <div className="space-y-2">
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">Short Description</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Claim stamps on every visit above ₹150"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all text-xs uppercase tracking-wider font-semibold"
              >
                {loading ? 'Creating...' : 'Launch Loyalty Campaign'}
              </button>
            </form>
          )}

          {/* Cards List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {campaigns.length === 0 ? (
              <div className="col-span-2 text-center py-16 bg-dark-900 border border-white/10 rounded-2xl text-slate-500 text-sm">
                No active loyalty campaigns launched. Create one using the button above.
              </div>
            ) : (
              campaigns.map((camp) => (
                <div key={camp._id} className="bg-dark-900 border border-white/10 rounded-2xl p-5 md:p-6 hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        {camp.isActive ? 'Active' : 'Draft'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">Stamps target: {camp.requiredStamps}</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-100">{camp.title}</h4>
                    <p className="text-slate-400 text-xs md:text-sm leading-normal">{camp.description}</p>
                    <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Reward Unlocked</span>
                      <span className="text-xs font-bold text-yellow-400">🎁 {camp.rewardTitle}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedCampaignForQr(camp)}
                    className="w-full text-center py-2.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 font-bold text-xs transition-colors border border-purple-500/20"
                  >
                    🖨️ Display QR Code
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* APPROVALS TAB */}
      {activeTab === 'approvals' && (
        <div className="bg-dark-900 border border-white/10 p-5 md:p-6 rounded-2xl">
          <div className="border-b border-white/5 pb-4 mb-4">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <span>🎁</span> Pending Customer Redemptions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Verify customer device screen is in "pending" status and confirm.</p>
          </div>

          {claims.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No reward redemptions currently pending. Customer claim requests will appear here dynamically.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {claims.map((claim) => (
                <div key={claim._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div>
                    <div className="font-bold text-slate-200 text-sm">
                      🎁 {claim.rewardTitle}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Customer: <span className="text-slate-200 font-semibold">{claim.customerId?.name || 'Anonymous Customer'}</span> ({claim.customerId?.email})
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Requested on {new Date(claim.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </div>
                  </div>

                  <button
                    onClick={() => handleApproveClaim(claim._id)}
                    disabled={loadingApprovalId !== null}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg hover:-translate-y-0.5 transition-all w-full sm:w-auto"
                  >
                    {loadingApprovalId === claim._id ? 'Approving...' : 'Confirm Redemption'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QR MODAL DIALOG */}
      {selectedCampaignForQr && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-dark-900 border border-white/10 rounded-3xl max-w-md w-full p-6 text-center space-y-6 relative">
            <button 
              onClick={() => setSelectedCampaignForQr(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold bg-white/5 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            >
              ×
            </button>

            <div className="space-y-2">
              <span className="inline-block text-[10px] font-extrabold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20 uppercase tracking-wider">
                Store Print Asset
              </span>
              <h3 className="text-xl font-extrabold text-slate-100">{selectedCampaignForQr.title}</h3>
              <p className="text-xs text-slate-400">Place this code on checkout counters or menus for scanning.</p>
            </div>

            {qrDataUrl ? (
              <div className="bg-white p-4 rounded-2xl w-fit mx-auto shadow-2xl">
                <img src={qrDataUrl} alt="QR Code" className="w-52 h-52 select-none pointer-events-none" />
              </div>
            ) : (
              <div className="w-52 h-52 bg-white/5 border border-white/5 rounded-2xl mx-auto flex items-center justify-center text-slate-500 text-xs animate-pulse">
                Generating Code...
              </div>
            )}

            <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Scan Url</span>
              <span className="text-[10px] font-mono text-slate-300 break-all select-all">{`${appUrl}/scan/${selectedCampaignForQr._id}`}</span>
            </div>

            <div className="flex gap-3 pt-2">
              <a
                href={qrDataUrl}
                download={`returno-qr-${selectedCampaignForQr._id}.png`}
                className="flex-1 text-center py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                💾 Download PNG
              </a>
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-xl transition-all"
              >
                🖨️ Print Poster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
