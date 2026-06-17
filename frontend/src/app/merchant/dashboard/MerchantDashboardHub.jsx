"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [pointsPerCheckin, setPointsPerCheckin] = useState(10);

  // QR Modal State
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [qrMode, setQrMode] = useState('join'); // 'join' or 'checkin'

  // Join QR state
  const [joinQrDataUrl, setJoinQrDataUrl] = useState('');

  // Dynamic QR state
  const [dynamicToken, setDynamicToken] = useState(null);
  const [dynamicExpiresAt, setDynamicExpiresAt] = useState(null);
  const [dynamicQrDataUrl, setDynamicQrDataUrl] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const timerRef = useRef(null);
  const rotateRef = useRef(null);

  // Generate Join QR when selectedCampaign changes
  useEffect(() => {
    if (selectedCampaign && qrMode === 'join') {
      const joinUrl = `${appUrl}/join/${selectedCampaign._id}`;
      QRCode.toDataURL(joinUrl, {
        width: 320, margin: 2,
        color: { dark: '#1e1b4b', light: '#ffffff' }
      }).then(url => setJoinQrDataUrl(url)).catch(console.error);
    }
  }, [selectedCampaign, qrMode, appUrl]);

  // Generate dynamic QR image when token changes
  useEffect(() => {
    if (dynamicToken) {
      const checkinUrl = `${appUrl}/checkin?token=${dynamicToken}`;
      QRCode.toDataURL(checkinUrl, {
        width: 320, margin: 2,
        color: { dark: '#991b1b', light: '#ffffff' }
      }).then(url => setDynamicQrDataUrl(url)).catch(console.error);
    }
  }, [dynamicToken, appUrl]);

  // Countdown timer
  useEffect(() => {
    if (dynamicExpiresAt) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((new Date(dynamicExpiresAt) - new Date()) / 1000));
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          setDynamicToken(null);
          setDynamicQrDataUrl('');
          // Auto-rotate if enabled
          if (autoRotate && selectedCampaign) {
            generateDynamicQr(selectedCampaign._id);
          }
        }
      }, 500);
      return () => clearInterval(timerRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicExpiresAt, autoRotate]);

  const generateDynamicQr = useCallback(async (campaignId) => {
    try {
      const res = await apiFetch('/qr/generate', {
        method: 'POST',
        body: JSON.stringify({ campaignId }),
      });
      const data = await res.json();
      if (data.success) {
        setDynamicToken(data.token);
        setDynamicExpiresAt(data.expiresAt);
      }
    } catch (err) {
      console.error('QR generate error:', err);
    }
  }, []);

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
          rewardTitle,
          pointsPerCheckin: parseInt(pointsPerCheckin)
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create campaign');
      }

      setSuccess('Loyalty campaign launched successfully!');
      setCampaigns([data.campaign, ...campaigns]);

      setTitle('');
      setDescription('');
      setRequiredStamps(10);
      setRewardTitle('');
      setPointsPerCheckin(10);

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

  const openQrModal = (camp, mode) => {
    setSelectedCampaign(camp);
    setQrMode(mode);
    setDynamicToken(null);
    setDynamicQrDataUrl('');
    setCountdown(0);
    if (mode === 'checkin') {
      generateDynamicQr(camp._id);
    }
  };

  const closeQrModal = () => {
    setSelectedCampaign(null);
    setDynamicToken(null);
    setDynamicQrDataUrl('');
    setCountdown(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const { totalStamps, uniqueCustomers, openRewardsCount, recentStamps } = metrics;

  return (
    <div className="space-y-8 text-slate-800 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Merchant Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time loyalty management for {business.name}</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(''); setSuccess(''); }}
          className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-red-500/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-sm font-black transition-transform duration-300 group-hover:rotate-90">+</span>
          Add New Campaign
        </button>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Stamps', value: totalStamps, color: 'text-red-600', desc: 'Check-ins logged' },
          { label: 'Active Customers', value: uniqueCustomers, color: 'text-slate-800', desc: 'Unique enrollments' },
          { label: 'Unlocked Rewards', value: openRewardsCount, color: 'text-amber-600', desc: 'Milestones completed' },
          { label: 'Active Campaigns', value: campaigns.length, color: 'text-emerald-600', desc: 'Running now' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.015] transition-all duration-300">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">{stat.label}</div>
            <div className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</div>
            <p className="text-[10px] text-slate-400 mt-2">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Campaigns Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-900">Active Loyalty Campaigns</h3>

        {campaigns.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200/80 rounded-2xl text-slate-400 text-sm shadow-sm">
            No active loyalty campaigns. Click &quot;Add New Campaign&quot; above to create your first stamp card!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((camp) => (
              <div key={camp._id} className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 hover:shadow-md hover:scale-[1.015] transition-all duration-300 flex flex-col justify-between space-y-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600">
                      {camp.isActive ? 'Active' : 'Draft'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                      {camp.enrollmentCount || 0} enrolled
                    </span>
                  </div>
                  <h4 className="text-md font-bold text-slate-900">{camp.title}</h4>
                  <p className="text-slate-600 text-xs leading-normal">{camp.description}</p>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-center">
                      <div className="text-xs font-black text-red-600">{camp.requiredStamps}</div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase">Stamps</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-center">
                      <div className="text-xs font-black text-slate-800">{camp.pointsPerCheckin || 10}</div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase">Pts/Day</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-center">
                      <div className="text-xs font-black text-amber-700">🎁</div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase">Reward</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Reward</span>
                    <span className="text-xs font-bold text-amber-700">🎁 {camp.rewardTitle}</span>
                  </div>
                </div>

                {/* QR Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openQrModal(camp, 'join')}
                    className="flex-1 text-center py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[10px] transition-colors border border-slate-200/50 uppercase tracking-wider"
                  >
                    📎 Join QR
                  </button>
                  <button
                    onClick={() => openQrModal(camp, 'checkin')}
                    className="flex-1 text-center py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] transition-colors border border-red-200/50 uppercase tracking-wider"
                  >
                    ⚡ Check-In QR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Visits Logs */}
      <div className="bg-white border border-slate-200/80 p-5 md:p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-black text-slate-900 mb-4">Recent Stamp Scan History</h3>

        {recentStamps.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No stamps awarded yet. Share your QR Code to start collecting!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Bill Number</th>
                  <th className="py-3 px-4">Bill Amount</th>
                  <th className="py-3 px-4">Scanned At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {recentStamps.map((stamp) => (
                  <tr key={stamp._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-xs text-slate-900">{stamp.customerId?.name || 'Anonymous'}</div>
                      <div className="text-[10px] text-slate-400">{stamp.customerId?.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{stamp.billNumber}</td>
                    <td className="py-3 px-4 text-xs font-semibold">₹{stamp.amount}</td>
                    <td className="py-3 px-4 text-[10px] text-slate-400">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-6 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-xl font-bold bg-slate-50 hover:bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            >×</button>

            <div>
              <h3 className="text-xl font-black text-slate-900">Configure New Campaign</h3>
              <p className="text-xs text-slate-500 mt-1">Set up a stamp loyalty card with streak tracking.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3.5 rounded-xl font-medium">⚠️ {error}</div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3.5 rounded-xl font-medium">✓ {success}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">Campaign Title</label>
                <input type="text" required placeholder="e.g. Cafe Premium Stamp Card" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors" />
              </div>

              <div className="space-y-2">
                <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">Reward Title</label>
                <input type="text" required placeholder="e.g. Free Hot Beverage & Donut" value={rewardTitle} onChange={(e) => setRewardTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">Required Stamps</label>
                  <input type="number" required min={2} max={25} value={requiredStamps} onChange={(e) => setRequiredStamps(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">Points / Check-in</label>
                  <input type="number" required min={1} max={100} value={pointsPerCheckin} onChange={(e) => setPointsPerCheckin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">Description</label>
                  <input type="text" required placeholder="e.g. Daily check-in" value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all uppercase tracking-wider">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-500/10 transition-all text-xs uppercase tracking-wider">
                  {loading ? 'Creating...' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR MODAL DIALOG */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-center space-y-5 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeQrModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-xl font-bold bg-slate-50 hover:bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            >×</button>

            {/* QR Mode Tabs */}
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setQrMode('join')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  qrMode === 'join' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >📎 Join QR</button>
              <button
                onClick={() => { setQrMode('checkin'); if (!dynamicToken) generateDynamicQr(selectedCampaign._id); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  qrMode === 'checkin' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >⚡ Check-In QR</button>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">{selectedCampaign.title}</h3>
              <p className="text-xs text-slate-500">
                {qrMode === 'join' ? 'Permanent QR — customers scan to join' : 'Dynamic QR — rotates every 60 seconds'}
              </p>
            </div>

            {/* JOIN QR MODE */}
            {qrMode === 'join' && (
              <>
                {joinQrDataUrl ? (
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl w-fit mx-auto shadow-sm">
                    <img src={joinQrDataUrl} alt="Join QR Code" className="w-52 h-52 select-none pointer-events-none" />
                  </div>
                ) : (
                  <div className="w-52 h-52 bg-slate-50 border border-slate-100 rounded-2xl mx-auto flex items-center justify-center text-slate-400 text-xs animate-pulse">
                    Generating...
                  </div>
                )}
                <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Join URL</span>
                  <span className="text-[10px] font-mono text-slate-600 break-all select-all">{`${appUrl}/join/${selectedCampaign._id}`}</span>
                </div>
                <div className="flex gap-3 pt-1">
                  <a href={joinQrDataUrl} download={`join-qr-${selectedCampaign._id}.png`}
                    className="flex-1 text-center py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-all uppercase tracking-wider">
                    💾 Download
                  </a>
                  <button onClick={() => window.print()}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all uppercase tracking-wider">
                    🖨️ Print
                  </button>
                </div>
              </>
            )}

            {/* CHECKIN QR MODE */}
            {qrMode === 'checkin' && (
              <>
                {dynamicQrDataUrl ? (
                  <div className="relative">
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200/60 p-4 rounded-2xl w-fit mx-auto shadow-sm">
                      <img src={dynamicQrDataUrl} alt="Check-in QR Code" className="w-52 h-52 select-none pointer-events-none" />
                    </div>
                    {/* Countdown ring */}
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <div className={`relative w-12 h-12 rounded-full border-4 flex items-center justify-center ${
                        countdown > 30 ? 'border-emerald-400' : countdown > 10 ? 'border-amber-400' : 'border-red-500'
                      }`}>
                        <span className={`text-sm font-black ${
                          countdown > 30 ? 'text-emerald-600' : countdown > 10 ? 'text-amber-600' : 'text-red-600'
                        }`}>{countdown}</span>
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-700">seconds remaining</div>
                        <div className="text-[10px] text-slate-400">
                          {autoRotate ? 'Auto-rotates on expiry' : 'Manual rotation'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-52 h-52 bg-red-50 border-2 border-red-200/60 rounded-2xl mx-auto flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto"></div>
                      <p className="text-[10px] text-slate-500">Generating secure QR...</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                  <span className="text-xs text-slate-600 font-medium">Auto-rotate on expiry</span>
                  <button
                    onClick={() => setAutoRotate(!autoRotate)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${autoRotate ? 'bg-red-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoRotate ? 'left-5' : 'left-0.5'}`}></span>
                  </button>
                </div>

                <button
                  onClick={() => generateDynamicQr(selectedCampaign._id)}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-all uppercase tracking-wider"
                >
                  🔄 Generate New QR Now
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
