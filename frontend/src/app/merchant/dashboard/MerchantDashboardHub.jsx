"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import QRCode from 'qrcode';

export default function MerchantDashboardHub({ business, metrics, initialCampaigns, appUrl }) {
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

  // QR Modal State
  const [selectedCampaignForQr, setSelectedCampaignForQr] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch('/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          requiredStamps: parseInt(requiredStamps),
          rewardTitle
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create campaign');
      }

      setSuccess('Loyalty campaign launched successfully!');
      setCampaigns([data.campaign, ...campaigns]);

      // Reset form fields
      setTitle('');
      setDescription('');
      setRequiredStamps(10);
      setRewardTitle('');

      // Close form/modal after success
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

  const { totalStamps, uniqueCustomers, openRewardsCount, recentStamps } = metrics;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Merchant Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time loyalty management and metrics for {business.name}</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setError('');
            setSuccess('');
          }}
          className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-purple-500/25 border border-purple-400/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/30"
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/15 text-base font-bold transition-transform duration-300 group-hover:rotate-90">
            +
          </span>
          Add New Campaign
        </button>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-dark-900 border border-white/10 p-5 md:p-6 rounded-2xl">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Stamps Awarded</div>
          <div className="text-3xl md:text-4xl font-extrabold text-purple-400">{totalStamps}</div>
          <p className="text-[10px] text-slate-500 mt-2">Visits logged via QR code scans</p>
        </div>
        <div className="bg-dark-900 border border-white/10 p-5 md:p-6 rounded-2xl">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Active Customers</div>
          <div className="text-3xl md:text-4xl font-extrabold text-blue-400">{uniqueCustomers}</div>
          <p className="text-[10px] text-slate-500 mt-2">Unique loyalty customers registered</p>
        </div>
        <div className="bg-dark-900 border border-white/10 p-5 md:p-6 rounded-2xl">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Unlocked Rewards</div>
          <div className="text-3xl md:text-4xl font-extrabold text-yellow-400">{openRewardsCount}</div>
          <p className="text-[10px] text-slate-500 mt-2">Milestone cards completed</p>
        </div>
        <div className="bg-dark-900 border border-white/10 p-5 md:p-6 rounded-2xl">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Verification PIN</div>
          <div className="text-2xl md:text-3xl font-extrabold tracking-wider text-slate-200 bg-white/5 border border-white/5 px-3 py-1 rounded inline-block">
            {business.verificationCode}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Share with staff to confirm redemptions</p>
        </div>
      </div>

      {/* Campaigns Section */}
      <div className="space-y-4">
        <h3 className="text-lg md:text-xl font-bold">⚡ Active Loyalty Campaigns</h3>

        {campaigns.length === 0 ? (
          <div className="text-center py-12 bg-dark-900 border border-white/10 rounded-2xl text-slate-500 text-sm">
            No active loyalty campaigns. Click &quot;Add New Campaign&quot; above to create your first stamp card!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((camp) => (
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
            ))}
          </div>
        )}
      </div>

      {/* Recent Visits Logs */}
      <div className="bg-dark-900 border border-white/10 p-5 md:p-6 rounded-2xl">
        <h3 className="text-lg md:text-xl font-bold mb-4">🕒 Recent Stamp Scan History</h3>

        {recentStamps.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No stamps awarded yet. Share your QR Code to start collecting!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Bill Number</th>
                  <th className="py-3 px-4">Bill Amount</th>
                  <th className="py-3 px-4">Scanned At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                {recentStamps.map((stamp) => (
                  <tr key={stamp._id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-xs md:text-sm">{stamp.customerId?.name || 'Anonymous Customer'}</div>
                      <div className="text-[10px] md:text-xs text-slate-500">{stamp.customerId?.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs md:text-sm">{stamp.billNumber}</td>
                    <td className="py-3 px-4 text-xs md:text-sm">₹{stamp.amount}</td>
                    <td className="py-3 px-4 text-[10px] md:text-xs text-slate-500">
                      {new Date(stamp.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-dark-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold bg-white/5 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            >
              ×
            </button>

            <div>
              <h3 className="text-xl font-bold text-slate-200">Configure New Campaign</h3>
              <p className="text-xs text-slate-400 mt-1">Set up a stamp loyalty card for your customers.</p>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cafe Premium Stamp Card"
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
                  placeholder="e.g. Free Hot Beverage & Donut"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
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
                    placeholder="e.g. Get 1 stamp per ₹150 bill"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl transition-all uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all text-xs uppercase tracking-wider"
                >
                  {loading ? 'Creating...' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
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
