"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import QRCode from "qrcode";

export default function MerchantDashboardHub({
  business,
  metrics,
  initialCampaigns,
  appUrl,
}) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form inputs
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredStamps, setRequiredStamps] = useState(10);
  const [rewardTitle, setRewardTitle] = useState("");
  const [pointsPerCheckin, setPointsPerCheckin] = useState(10);

  // Custom Confirm/Alert Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // QR Modal State
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [qrMode, setQrMode] = useState("join"); // 'join', 'checkin', or 'bulk'

  // Join QR state
  const [joinQrDataUrl, setJoinQrDataUrl] = useState("");

  // Dynamic QR state
  const [dynamicToken, setDynamicToken] = useState(null);
  const [dynamicExpiresAt, setDynamicExpiresAt] = useState(null);
  const [dynamicQrDataUrl, setDynamicQrDataUrl] = useState("");

  // Bulk QR state
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkQrCodes, setBulkQrCodes] = useState([]); // array of { token, dataUrl, index }
  const [bulkGenerated, setBulkGenerated] = useState(false);
  const [selectedZoomQr, setSelectedZoomQr] = useState(null);

  // Generate Join QR when selectedCampaign changes
  useEffect(() => {
    if (selectedCampaign && qrMode === "join") {
      const joinUrl = `${appUrl}/join/campaign/${selectedCampaign._id}`;
      QRCode.toDataURL(joinUrl, {
        width: 320,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      })
        .then((url) => setJoinQrDataUrl(url))
        .catch(console.error);
    }
  }, [selectedCampaign, qrMode, appUrl]);

  // Generate dynamic QR image when token changes
  useEffect(() => {
    if (dynamicToken) {
      const checkinUrl = `${appUrl}/checkin?token=${dynamicToken}`;
      QRCode.toDataURL(checkinUrl, {
        width: 320,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      })
        .then((url) => setDynamicQrDataUrl(url))
        .catch(console.error);
    }
  }, [dynamicToken, appUrl]);

  const generateDynamicQr = useCallback(async (campaignId) => {
    try {
      const res = await apiFetch("/qr/generate", {
        method: "POST",
        body: JSON.stringify({ campaignId }),
      });
      const data = await res.json();
      if (data.success) {
        setDynamicToken(data.token);
        setDynamicExpiresAt(data.expiresAt);
      }
    } catch (err) {
      console.error("QR generate error:", err);
    }
  }, []);

  // Poll to automatically refresh QR code once scanned or expired
  useEffect(() => {
    let intervalId = null;
    if (selectedCampaign && qrMode === "checkin" && dynamicToken) {
      intervalId = setInterval(async () => {
        try {
          const res = await apiFetch(`/qr/active/${selectedCampaign._id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              // If current token is expired (session === null), or different, or already checked in
              if (
                !data.session ||
                data.session.token !== dynamicToken ||
                data.session.checkinCount > 0
              ) {
                generateDynamicQr(selectedCampaign._id);
              }
            }
          }
        } catch (err) {
          console.error("Polling active session error:", err);
        }
      }, 2000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedCampaign, qrMode, dynamicToken, generateDynamicQr]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await apiFetch("/campaigns", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          requiredStamps: parseInt(requiredStamps),
          rewardTitle,
          pointsPerCheckin: parseInt(pointsPerCheckin),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create campaign");
      }

      setSuccess("Loyalty campaign launched successfully!");
      setCampaigns([data.campaign, ...campaigns]);

      setTitle("");
      setDescription("");
      setRequiredStamps(10);
      setRewardTitle("");
      setPointsPerCheckin(10);

      setTimeout(() => {
        setShowForm(false);
        setSuccess("");
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = (campaignId) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Loyalty Campaign",
      message:
        "Are you sure you want to delete this loyalty campaign? All active customer progress for this campaign will be archived. This action cannot be undone.",
      onConfirm: async () => {
        try {
          const res = await apiFetch(`/campaigns/${campaignId}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Failed to delete campaign");
          }
          setCampaigns(campaigns.filter((c) => c._id !== campaignId));
          setConfirmModal({
            isOpen: false,
            title: "",
            message: "",
            onConfirm: null,
          });
          setAlertModal({
            isOpen: true,
            title: "Campaign Deleted",
            message: "The campaign has been successfully deleted.",
            type: "success",
          });
        } catch (err) {
          setConfirmModal({
            isOpen: false,
            title: "",
            message: "",
            onConfirm: null,
          });
          setAlertModal({
            isOpen: true,
            title: "Delete Failed",
            message: err.message,
            type: "error",
          });
        }
      },
    });
  };

  const openQrModal = (camp, mode) => {
    setSelectedCampaign(camp);
    setQrMode(mode);
    setDynamicToken(null);
    setDynamicQrDataUrl("");
    setBulkQrCodes([]);
    setBulkGenerated(false);
    if (mode === "checkin") {
      generateDynamicQr(camp._id);
    }
  };

  const closeQrModal = () => {
    setSelectedCampaign(null);
    setDynamicToken(null);
    setDynamicQrDataUrl("");
    setBulkQrCodes([]);
    setBulkGenerated(false);
    setSelectedZoomQr(null);
  };

  const generateBulkQr = async () => {
    if (!selectedCampaign) return;
    setBulkLoading(true);
    setBulkQrCodes([]);
    setBulkGenerated(false);
    try {
      const res = await apiFetch("/qr/generate-bulk", {
        method: "POST",
        body: JSON.stringify({
          campaignId: selectedCampaign._id,
          count: bulkCount,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Generate QR data URLs for each token
      const qrPromises = data.tokens.map(async (t, i) => {
        const url = `${appUrl}/checkin?token=${t.token}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 280,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });
        return { token: t.token, dataUrl, index: i + 1 };
      });

      const results = await Promise.all(qrPromises);
      setBulkQrCodes(results);
      setBulkGenerated(true);
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: "Bulk QR Failed",
        message: err.message || "Failed to generate bulk QR codes",
        type: "error",
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadAllQr = async () => {
    for (const qr of bulkQrCodes) {
      const link = document.createElement("a");
      link.href = qr.dataUrl;
      link.download = `checkin-qr-${selectedCampaign.title.replace(/\s+/g, "-").toLowerCase()}-${qr.index}.png`;
      link.click();
      // Small delay to prevent browser throttling
      await new Promise((r) => setTimeout(r, 100));
    }
  };

  const printBulkQr = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const gridItems = bulkQrCodes
      .map(
        (qr) =>
          `<div style="text-align:center;page-break-inside:avoid;padding:12px;border:1px solid #e2e8f0;border-radius:12px;">
        <img src="${qr.dataUrl}" style="width:160px;height:160px;" />
        <div style="margin-top:6px;font-size:11px;font-weight:700;color:#334155;">${selectedCampaign.title}</div>
        <div style="font-size:9px;color:#94a3b8;margin-top:2px;">QR #${qr.index} • Single Use</div>
      </div>`,
      )
      .join("");

    printWindow.document.write(`
      <html>
      <head>
        <title>Bulk QR Codes - ${selectedCampaign.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; margin: 20px; }
          h1 { text-align: center; font-size: 20px; color: #0f172a; margin-bottom: 4px; }
          h2 { text-align: center; font-size: 12px; color: #94a3b8; font-weight: 600; margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
          @media print {
            body { margin: 10px; }
            .grid { gap: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${selectedCampaign.title}</h1>
        <h2>${bulkQrCodes.length} Check-in QR Codes • Each code is single-use</h2>
        <div class="grid">${gridItems}</div>
        <script>setTimeout(() => { window.print(); }, 500);</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const { totalStamps, uniqueCustomers, openRewardsCount, recentStamps } =
    metrics;

  return (
    <div className="space-y-8 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            Merchant Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time loyalty management for {business.name}
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setError("");
            setSuccess("");
          }}
          className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-red-500/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-sm font-black transition-transform duration-300 group-hover:rotate-90">
            +
          </span>
          Add New Campaign
        </button>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: "Total Stamps",
            value: totalStamps,
            color: "text-red-600",
            desc: "Check-ins logged",
          },
          {
            label: "Active Customers",
            value: uniqueCustomers,
            color: "text-slate-800",
            desc: "Unique enrollments",
          },
          {
            label: "Unlocked Rewards",
            value: openRewardsCount,
            color: "text-amber-600",
            desc: "Milestones completed",
          },
          {
            label: "Active Campaigns",
            value: campaigns.length,
            color: "text-emerald-600",
            desc: "Running now",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.015] transition-all duration-300"
          >
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              {stat.label}
            </div>
            <div className={`text-3xl font-extrabold ${stat.color}`}>
              {stat.value}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Campaigns Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-900">
          Active Loyalty Campaigns
        </h3>

        {campaigns.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200/80 rounded-2xl text-slate-400 text-sm shadow-sm">
            No active loyalty campaigns. Click &quot;Add New Campaign&quot;
            above to create your first stamp card!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((camp) => (
              <div
                key={camp._id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 hover:shadow-md hover:scale-[1.015] transition-all duration-300 flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600">
                      {camp.isActive ? "Active" : "Draft"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                        {camp.enrollmentCount || 0} enrolled
                      </span>
                      <button
                        onClick={() => handleDeleteCampaign(camp._id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                        title="Delete Campaign"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h4 className="text-md font-bold text-slate-900">
                    {camp.title}
                  </h4>
                  <p className="text-slate-600 text-xs leading-normal">
                    {camp.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-center">
                      <div className="text-xs font-black text-red-600">
                        {camp.requiredStamps}
                      </div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase">
                        Stamps
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-center">
                      <div className="text-xs font-black text-slate-800">
                        {camp.pointsPerCheckin || 10}
                      </div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase">
                        Pts/Day
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-center">
                      <div className="text-xs font-black text-amber-700">
                        🎁
                      </div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase">
                        Reward
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
                      Reward
                    </span>
                    <span className="text-xs font-bold text-amber-700">
                      🎁 {camp.rewardTitle}
                    </span>
                  </div>
                </div>

                {/* QR Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openQrModal(camp, "join")}
                    className="flex-1 text-center py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[10px] transition-colors border border-slate-200/50 uppercase tracking-wider"
                  >
                    📎 Join QR
                  </button>
                  <button
                    onClick={() => openQrModal(camp, "checkin")}
                    className="flex-1 text-center py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] transition-colors border border-red-200/50 uppercase tracking-wider"
                  >
                    ⚡ Check-In QR
                  </button>
                  <button
                    onClick={() => openQrModal(camp, "bulk")}
                    className="flex-1 text-center py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[10px] transition-colors border border-amber-200/50 uppercase tracking-wider"
                  >
                    📦 Bulk QR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Visits Logs */}
      <div className="bg-white border border-slate-200/80 p-5 md:p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-black text-slate-900 mb-4">
          Recent Stamp Scan History
        </h3>

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
                  <tr
                    key={stamp._id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-xs text-slate-900">
                        {stamp.customerId?.name || "Anonymous"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {stamp.customerId?.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {stamp.billNumber}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold">
                      ₹{stamp.amount}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {stamp.billNumber}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold">
                      ₹{stamp.amount}
                    </td>
                    <td className="py-3 px-4 text-[10px] text-slate-400">
                      {new Date(stamp.createdAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
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
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-6 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 text-xl font-bold bg-slate-50 hover:bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            >
              ×
            </button>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                Configure New Campaign
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Set up a stamp loyalty card with streak tracking.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3.5 rounded-xl font-medium">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-3.5 rounded-xl font-medium">
                ✓ {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  Campaign Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cafe Premium Stamp Card"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  Reward Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Hot Beverage & Donut"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    Required Stamps
                  </label>
                  <input
                    type="number"
                    required
                    min={2}
                    max={25}
                    value={requiredStamps}
                    onChange={(e) => setRequiredStamps(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    Points / Check-in
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={pointsPerCheckin}
                    onChange={(e) => setPointsPerCheckin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    Description
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daily check-in"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-500/10 transition-all text-xs uppercase tracking-wider"
                >
                  {loading ? "Creating..." : "Launch Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR MODAL DIALOG */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white border border-slate-200/80 rounded-3xl max-w-lg w-full p-6 md:p-8 flex flex-col relative shadow-2xl max-h-[85vh] overflow-hidden animate-[scale-up_0.2s_ease-out]">
            <button
              onClick={closeQrModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-20"
              aria-label="Close modal"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Header Content (Non-scrollable) */}
            <div className="space-y-4 pb-4 border-b border-slate-100 text-center">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 pr-8">
                  {selectedCampaign.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Loyalty Campaign QR Suite</p>
              </div>
              
              {/* QR Mode Tabs */}
              <div className="flex bg-slate-100 rounded-xl p-1 shadow-inner border border-slate-200/40">
                <button
                  onClick={() => setQrMode("join")}
                  className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1 ${
                    qrMode === "join"
                      ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span>🔗</span> Join QR
                </button>
                <button
                  onClick={() => {
                    setQrMode("checkin");
                    if (!dynamicToken) generateDynamicQr(selectedCampaign._id);
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1 ${
                    qrMode === "checkin"
                      ? "bg-white text-red-600 shadow-sm ring-1 ring-black/5"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span>⚡</span> Live Check-In
                </button>
                <button
                  onClick={() => setQrMode("bulk")}
                  className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1 ${
                    qrMode === "bulk"
                      ? "bg-white text-amber-700 shadow-sm ring-1 ring-black/5"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span>📦</span> Bulk Codes
                </button>
              </div>

              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 py-1.5 rounded-lg border border-slate-200/40">
                {qrMode === "join"
                  ? "Permanent QR — Customer scans to join campaign"
                  : qrMode === "bulk"
                    ? "Batch single-use QRs — Scan off screen, print or download"
                    : "Live QR — Single-use rotating scan code"}
              </p>
            </div>

            {/* Scrollable Content Container (No Nested Scrollbar conflict) */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 py-4 scrollable-content">
              {/* JOIN QR MODE */}
              {qrMode === "join" && (
                <div className="space-y-5 flex flex-col items-center py-2 animate-[fade-in_0.2s_ease-out]">
                  {joinQrDataUrl ? (
                    <div className="bg-white border border-slate-100 p-5 rounded-3xl w-fit shadow-md ring-8 ring-slate-50 transition-all hover:scale-[1.02] duration-300">
                      <img
                        src={joinQrDataUrl}
                        alt="Join QR Code"
                        className="w-52 h-52 select-none pointer-events-none"
                      />
                    </div>
                  ) : (
                    <div className="w-52 h-52 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-xs animate-pulse">
                      Generating...
                    </div>
                  )}
                  <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl w-full text-left">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
                      Join URL
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 break-all select-all">{`${appUrl}/join/${selectedCampaign._id}`}</span>
                  </div>
                  <div className="flex gap-3 pt-1 w-full">
                    <a
                      href={joinQrDataUrl}
                      download={`join-qr-${selectedCampaign._id}.png`}
                      className="flex-1 text-center py-3 bg-red-655 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-all uppercase tracking-wider"
                    >
                      💾 Download QR
                    </a>
                    <button
                      onClick={() => window.print()}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all uppercase tracking-wider"
                    >
                      🖨️ Print
                    </button>
                  </div>
                </div>
              )}

              {/* CHECKIN QR MODE */}
              {qrMode === "checkin" && (
                <div className="space-y-5 flex flex-col items-center py-2 animate-[fade-in_0.2s_ease-out]">
                  {dynamicQrDataUrl ? (
                    <div className="relative space-y-4 flex flex-col items-center">
                      <div className="bg-white border-2 border-red-50/80 p-5 rounded-3xl w-fit shadow-md ring-8 ring-red-50/50 transition-all hover:scale-[1.02] duration-300">
                        <img
                          src={dynamicQrDataUrl}
                          alt="Check-in QR Code"
                          className="w-52 h-52 select-none pointer-events-none"
                        />
                      </div>
                      {/* Refresh status */}
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-slate-500">
                          Secure Single-use QR. Reloads automatically.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-52 h-52 bg-red-50 border-2 border-red-200/60 rounded-2xl flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto"></div>
                        <p className="text-[10px] text-slate-500">
                          Generating secure QR...
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => generateDynamicQr(selectedCampaign._id)}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-all uppercase tracking-wider"
                  >
                    🔄 Generate New QR Now
                  </button>
                </div>
              )}

              {/* BULK QR MODE */}
              {qrMode === "bulk" && (
                <div className="space-y-4 text-left py-2 animate-[fade-in_0.2s_ease-out]">
                  {!bulkGenerated ? (
                    <div className="space-y-5">
                      <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-lg shadow-md">
                            📦
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              Bulk QR Generator
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Generate multiple single-use check-in codes at once
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                            How many QR codes?
                          </label>
                          <div className="flex gap-2">
                            {[10, 20, 50, 100].map((n) => (
                              <button
                                key={n}
                                onClick={() => setBulkCount(n)}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                  bulkCount === n
                                    ? "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-700"
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-slate-500 font-bold">
                              Custom:
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={bulkCount}
                              onChange={(e) =>
                                setBulkCount(
                                  Math.min(
                                    100,
                                    Math.max(1, parseInt(e.target.value) || 1),
                                  ),
                                )
                              }
                              className="w-20 bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm text-center text-slate-800 font-bold focus:outline-none focus:border-amber-500"
                            />
                            <span className="text-[10px] text-slate-400">
                              (max 100)
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={generateBulkQr}
                        disabled={bulkLoading}
                        className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/15 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        {bulkLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Generating {bulkCount} QR Codes...
                          </>
                        ) : (
                          <>⚡ Generate {bulkCount} QR Codes</>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Success banner */}
                      <div className="bg-emerald-50 border border-emerald-250/60 rounded-xl p-3 flex items-center gap-2">
                        <span className="text-emerald-600 text-sm font-bold">✓</span>
                        <span className="text-[11px] font-bold text-emerald-700">
                          {bulkQrCodes.length} QR codes generated successfully!
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={downloadAllQr}
                          className="flex-1 py-3 bg-red-650 hover:bg-red-600 text-white font-bold text-[10px] rounded-xl shadow-lg shadow-red-500/10 transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                        >
                          💾 Download All
                        </button>
                        <button
                          onClick={printBulkQr}
                          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-[10px] rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                        >
                          🖨️ Print All
                        </button>
                        <button
                          onClick={() => {
                            setBulkGenerated(false);
                            setBulkQrCodes([]);
                          }}
                          className="py-3 px-4 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 text-amber-700 font-bold text-[10px] rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-1"
                          title="Reset Generator"
                        >
                          🔄 Reset
                        </button>
                      </div>

                      {/* QR Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                        {bulkQrCodes.map((qr) => (
                          <div
                            key={qr.index}
                            onClick={() => setSelectedZoomQr(qr)}
                            className="bg-white border border-slate-200/80 rounded-2xl p-3 text-center hover:shadow-md hover:scale-[1.02] hover:border-amber-350/80 transition-all duration-200 group cursor-pointer flex flex-col justify-between items-center min-h-[175px] shadow-sm"
                          >
                            <div className="w-24 h-24 flex items-center justify-center overflow-hidden bg-slate-50 rounded-xl p-1 border border-slate-100">
                              <img
                                src={qr.dataUrl}
                                alt={`QR #${qr.index}`}
                                className="w-full h-full object-contain rounded-lg"
                              />
                            </div>
                            <div className="w-full mt-2">
                              <div className="text-[10px] font-extrabold text-slate-800">
                                QR #{qr.index}
                              </div>
                              <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                                Single Use
                              </div>
                              <span className="text-[9px] bg-amber-50 text-amber-700 font-bold py-1 px-2.5 rounded-full inline-block group-hover:bg-amber-100 transition-colors">
                                🔍 Click to Scan
                              </span>
                              <a
                                href={qr.dataUrl}
                                download={`checkin-qr-${qr.index}.png`}
                                onClick={(e) => e.stopPropagation()}
                                className="mt-2 block text-[9px] font-bold text-red-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ↓ Download PNG
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 relative shadow-2xl animate-[scale-up_0.2s_ease-out]">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-red-600 text-xl font-bold">
              ⚠️
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                {confirmModal.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() =>
                  setConfirmModal({
                    isOpen: false,
                    title: "",
                    message: "",
                    onConfirm: null,
                  })
                }
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/10 transition-all uppercase tracking-wider"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM ALERT MODAL */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 relative shadow-2xl animate-[scale-up_0.2s_ease-out]">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto text-xl font-bold border ${
                alertModal.type === "success"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                  : "bg-red-50 border-red-100 text-red-600"
              }`}
            >
              {alertModal.type === "success" ? "✓" : "⚠️"}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                {alertModal.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {alertModal.message}
              </p>
            </div>
            <button
              onClick={() =>
                setAlertModal({
                  isOpen: false,
                  title: "",
                  message: "",
                  type: "info",
                })
              }
              className={`w-full py-3 font-bold text-xs rounded-xl transition-all uppercase tracking-wider ${
                alertModal.type === "success"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                  : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/10"
              }`}
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* ZOOM QR MODAL FOR DIRECT SCREEN SCANS */}
      {selectedZoomQr && (
        <div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]"
          onClick={() => setSelectedZoomQr(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 relative shadow-2xl animate-[scale-up_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedZoomQr(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Scan QR #{selectedZoomQr.index}
              </h3>
              <p className="text-xs text-slate-500">Single-use check-in code</p>
            </div>

            <div className="bg-white border border-slate-100 p-5 rounded-3xl w-fit mx-auto shadow-md ring-8 ring-slate-50">
              <img
                src={selectedZoomQr.dataUrl}
                alt={`QR #${selectedZoomQr.index}`}
                className="w-56 h-56 select-none pointer-events-none"
              />
            </div>

            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
              Aim your phone camera at this code to scan it instantly without
              downloading.
            </p>

            <div className="flex gap-2 pt-2">
              <a
                href={selectedZoomQr.dataUrl}
                download={`checkin-qr-${selectedCampaign?.title?.replace(/\s+/g, "-").toLowerCase() || "code"}-${selectedZoomQr.index}.png`}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] rounded-xl shadow-lg shadow-red-500/10 transition-all uppercase tracking-wider text-center"
              >
                Download PNG
              </a>
              <button
                onClick={() => setSelectedZoomQr(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-[10px] rounded-xl transition-all uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
