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

  // Automatic polling removed: UI is now manual-refresh only

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
    } else if (mode === "bulk") {
      fetchActiveBulkSessions(camp._id);
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

  const fetchActiveBulkSessions = async (campaignId) => {
    if (!campaignId) return;
    setBulkLoading(true);
    setBulkQrCodes([]);
    setBulkGenerated(false);
    try {
      const res = await apiFetch(`/qr/bulk/${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.sessions && data.sessions.length > 0) {
          // Generate QR data URLs for each existing session token
          const qrPromises = data.sessions.map(async (t, i) => {
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
        }
      }
    } catch (err) {
      console.error("Error fetching active bulk sessions:", err);
    } finally {
      setBulkLoading(false);
    }
  };

  const clearUnusedBulkSessions = async () => {
    if (!selectedCampaign) return;
    setBulkLoading(true);
    try {
      const res = await apiFetch(`/qr/bulk/${selectedCampaign._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setBulkQrCodes([]);
        setBulkGenerated(false);
        setAlertModal({
          isOpen: true,
          title: "Database Cleared",
          message: `${data.deletedCount} unused QR codes deleted successfully to reclaim database space.`,
          type: "success",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: "Clear Failed",
        message: err.message || "Failed to clear unused QR codes",
        type: "error",
      });
    } finally {
      setBulkLoading(false);
    }
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

  const {
    totalStamps,
    uniqueCustomers,
    openRewardsCount,
    redeemedRewardsCount = 0,
    totalRevenue = 0,
    scanTrend = [],
    joinedCustomers = [],
    recentStamps,
  } = metrics;

  return (
    <div className="space-y-8 text-slate-900 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome back, {business.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here is a summary of your loyalty programs and stamp check-ins.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => {
              setShowForm(true);
              setError("");
              setSuccess("");
            }}
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm shadow-purple-500/10 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-sm font-black transition-transform duration-300 group-hover:rotate-90">
              +
            </span>
            Add New Campaign
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: "Total Customers",
            value: uniqueCustomers,
            color: "text-purple-600 font-extrabold",
            desc: "Unique enrollments",
            icon: (
              <svg
                className="w-4 h-4 text-purple-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ),
          },
          {
            label: "Active Campaigns",
            value: campaigns.length,
            color: "text-slate-800",
            desc: "Running now",
            icon: (
              <svg
                className="w-4 h-4 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            ),
          },
          {
            label: "Total QR Scans",
            value: totalStamps,
            color: "text-indigo-600",
            desc: "Check-ins logged",
            icon: (
              <svg
                className="w-4 h-4 text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            ),
          },
          {
            label: "Rewards Redeemed",
            value: redeemedRewardsCount,
            color: "text-emerald-600",
            desc: "Milestones completed",
            icon: (
              <svg
                className="w-4 h-4 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            ),
          },
          {
            label: "Estimated Revenue",
            value: `₹${totalRevenue.toLocaleString("en-IN")}`,
            color: "text-violet-700 font-extrabold",
            desc: "From loyalty visits",
            icon: (
              <svg
                className="w-4 h-4 text-violet-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ),
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                {stat.label}
              </span>
              {stat.icon}
            </div>
            <div>
              <div
                className={`text-2xl font-extrabold text-slate-900 tracking-tight ${stat.color}`}
              >
                {stat.value}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                {stat.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics & Scan Trend Section */}
      <div id="analytics" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scan Trend Chart */}
        <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm col-span-1 lg:col-span-2">
          <h4 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            7-Day Check-in & Stamp Scan Trend
          </h4>
          <div className="flex items-end justify-between h-44 pt-4 border-b border-slate-100 px-2">
            {scanTrend.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                No scans recorded in the last 7 days.
              </div>
            ) : (
              scanTrend.map((t, idx) => {
                const maxScans = Math.max(...scanTrend.map((s) => s.scans), 1);
                const heightPercent = Math.min(
                  100,
                  Math.max(8, (t.scans / maxScans) * 100),
                );
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center flex-1 group relative"
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none z-10">
                      {t.scans} scan{t.scans !== 1 ? "s" : ""} • ₹{t.revenue}
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-8 md:w-10 bg-purple-500/80 group-hover:bg-purple-600 rounded-t-md transition-all duration-300 shadow-sm"
                    ></div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2.5">
                      {t.day}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Campaign Metrics Overview */}
        <div className="bg-white border border-slate-150 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Campaign Performance
            </h4>
            <div className="space-y-4 max-h-[12rem] overflow-y-auto pr-1">
              {campaigns.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No active campaigns to show metrics for.
                </div>
              ) : (
                campaigns.slice(0, 3).map((camp) => {
                  const enrollCount = camp.enrollmentCount || 0;
                  const maxEnrolled = Math.max(
                    ...campaigns.map((c) => c.enrollmentCount || 0),
                    1,
                  );
                  const progressPct = Math.min(
                    100,
                    Math.max(5, (enrollCount / maxEnrolled) * 100),
                  );
                  return (
                    <div key={camp._id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span className="truncate pr-2">{camp.title}</span>
                        <span className="text-purple-600 font-bold">
                          {enrollCount} joined
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${progressPct}%` }}
                          className="bg-purple-600 h-full rounded-full"
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4 mt-4 flex justify-between items-center text-xs">
            <span className="text-slate-450 font-semibold">
              Total Campaigns Run
            </span>
            <span className="font-extrabold text-slate-900 bg-purple-550/10 text-purple-650 border border-purple-200/50 py-1 px-2.5 rounded-lg">
              {campaigns.length} Active
            </span>
          </div>
        </div>
      </div>
      {/* Campaigns Section */}
      <div id="campaigns" className="space-y-4">
        <h3 className="text-lg font-black text-slate-900">
          Active Loyalty Programs
        </h3>

        {campaigns.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-150 rounded-3xl text-slate-450 text-sm shadow-sm">
            No active loyalty campaigns. Click &quot;Add New Campaign&quot;
            above to create your first stamp card!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((camp) => (
              <div
                key={camp._id}
                className="bg-white border border-slate-150 rounded-3xl p-5 md:p-6 hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-3.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600">
                      {camp.isActive ? "Active" : "Draft"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
                        {camp.enrollmentCount || 0} enrolled
                      </span>
                      <button
                        onClick={() => handleDeleteCampaign(camp._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-650 hover:bg-red-50 transition-all duration-200"
                        title="Delete Campaign"
                      >
                        <svg
                          className="w-4.5 h-4.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
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
                  <p className="text-slate-500 text-xs leading-normal font-medium">
                    {camp.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center">
                      <div className="text-sm font-extrabold text-purple-650">
                        {camp.requiredStamps}
                      </div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        Stamps
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center">
                      <div className="text-sm font-extrabold text-slate-800">
                        {camp.pointsPerCheckin || 10}
                      </div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        Pts/Day
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center">
                      <div className="text-sm font-extrabold text-amber-700">
                        ✨
                      </div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        Reward
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50/50 border border-purple-100/50 p-3 rounded-xl">
                    <span className="text-[9px] text-purple-500 font-bold uppercase tracking-wider block mb-0.5">
                      Reward Unlocked Milestone
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      🎁 {camp.rewardTitle}
                    </span>
                  </div>
                </div>

                {/* QR Buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openQrModal(camp, "join")}
                    className="flex-1 text-center py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[10px] transition-colors border border-slate-200/50 uppercase tracking-wider"
                  >
                     Join QR
                  </button>
                  <button
                    onClick={() => openQrModal(camp, "checkin")}
                    className="flex-1 text-center py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 font-bold text-[10px] transition-colors border border-purple-100/50 uppercase tracking-wider"
                  >
                     Live QR
                  </button>
                  <button
                    onClick={() => openQrModal(camp, "bulk")}
                    className="flex-1 text-center py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-750 font-bold text-[10px] transition-colors border border-indigo-200/50 uppercase tracking-wider"
                  >
                     Bulk QRs
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Visits Logs */}
      <div className="bg-white border border-slate-150 p-5 md:p-6 rounded-3xl shadow-sm">
        <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Stamp Scan History
        </h3>

        {recentStamps.length === 0 ? (
          <div className="text-center py-8 text-slate-450 text-sm">
            No stamps awarded yet. Share your QR Code to start collecting!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Bill Number</th>
                  <th className="py-3.5 px-4">Bill Amount</th>
                  <th className="py-3.5 px-4">Scanned At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-705">
                {recentStamps.map((stamp) => (
                  <tr
                    key={stamp._id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {stamp.customerId?.name || "Anonymous"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {stamp.customerId?.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {stamp.billNumber || "—"}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {stamp.amount ? `₹${stamp.amount}` : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-medium">
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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
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
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  Campaign Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cafe Premium Stamp Card"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-950 text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  Reward Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Hot Beverage & Donut"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-955 text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    Required Stamps
                  </label>
                  <input
                    type="number"
                    required
                    min={2}
                    max={25}
                    value={requiredStamps}
                    onChange={(e) => setRequiredStamps(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-955 text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    Points / Check-in
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={pointsPerCheckin}
                    onChange={(e) => setPointsPerCheckin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-955 text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    Description
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daily check-in"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-955 text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
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
                  className="flex-1 bg-purple-600 hover:bg-purple-550 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-md shadow-purple-500/10 transition-all text-xs uppercase tracking-wider"
                >
                  {loading ? "Creating..." : "Launch Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCampaign && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-[fade-in_0.2s_ease-out]">
          {/* TOP BAR / HEADER */}
          <div className="w-full border-b border-slate-150 py-4 px-6 bg-white shrink-0">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-purple-50 text-purple-650 font-bold text-[9px] uppercase tracking-widest rounded-full border border-purple-100/50">
                  ⚡ Campaign Suite
                </span>
                <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                  {selectedCampaign.title}
                </h3>
              </div>
              <button
                onClick={closeQrModal}
                className="text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200/50 active:scale-95"
              >
                ✕ Close Workspace
              </button>
            </div>
          </div>

          {/* MAIN CONTAINER */}
          <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 min-h-0 overflow-hidden">
            {/* TABS SIDEBAR (Left on Desktop, Top on Mobile) */}
            <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">
                Navigation
              </div>

              <div className="flex md:flex-col bg-slate-100 md:bg-transparent rounded-2xl md:rounded-none p-1 md:p-0 gap-1">
                <button
                  onClick={() => setQrMode("join")}
                  className={`flex-1 md:flex-initial py-3 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center md:justify-start gap-2.5 ${
                    qrMode === "join"
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-[1.01]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <span className="text-sm">🔗</span> Join QR
                </button>
                <button
                  onClick={() => {
                    setQrMode("checkin");
                    if (!dynamicToken) generateDynamicQr(selectedCampaign._id);
                  }}
                  className={`flex-1 md:flex-initial py-3 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center md:justify-start gap-2.5 ${
                    qrMode === "checkin"
                      ? "bg-purple-650 text-white shadow-md shadow-purple-650/15 scale-[1.01]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <span className="text-sm">⚡</span> Live QR
                </button>
                <button
                  onClick={() => {
                    setQrMode("bulk");
                    fetchActiveBulkSessions(selectedCampaign._id);
                  }}
                  className={`flex-1 md:flex-initial py-3 px-4 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center md:justify-start gap-2.5 ${
                    qrMode === "bulk"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/15 scale-[1.01]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <span className="text-sm">📦</span> Bulk Codes
                </button>
              </div>

              {/* Informative Help Card (Only on Desktop) */}
              <div className="hidden md:block bg-slate-50 border border-slate-200/50 rounded-2xl p-4 mt-auto">
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1.5">
                  Workspace Guide
                </h4>
                <p className="text-[10.5px] text-slate-505 leading-relaxed font-medium">
                  {qrMode === "join" &&
                    "Share this permanent QR link to enroll customers into your campaign."}
                  {qrMode === "checkin" &&
                    "Place this live QR on a counter tablet. Refresh the code manually for each customer."}
                  {qrMode === "bulk" &&
                    "Generate, print, and save sheets of unique single-use stamp codes for offline customer cards."}
                </p>
              </div>
            </div>

            {/* CONTENT AREA (Right on Desktop, Bottom on Mobile) */}
            <div className="flex-1 bg-slate-50 border border-slate-200/50 rounded-3xl p-6 overflow-y-auto min-h-0 scrollable-content">
              {/* JOIN QR TAB */}
              {qrMode === "join" && (
                <div className="space-y-6 flex flex-col items-center py-2 animate-[fade-in_0.2s_ease-out]">
                  <div className="w-full max-w-sm bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-500"></div>

                    <div className="flex justify-between items-center mb-5 border-b border-dashed border-slate-200 pb-4">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          Permanent QR
                        </div>
                        <div className="text-xs font-black text-slate-800 mt-0.5">
                          Campaign Invitation Card
                        </div>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-pulse"></span>
                    </div>

                    <div className="bg-white border border-slate-100 p-5 rounded-2xl w-fit mx-auto shadow-sm ring-4 ring-slate-50 mb-5 relative group-hover:border-slate-300 transition-all duration-300">
                      {joinQrDataUrl ? (
                        <img
                          src={joinQrDataUrl}
                          alt="Join QR Code"
                          className="w-44 h-44 select-none pointer-events-none"
                        />
                      ) : (
                        <div className="w-44 h-44 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 text-xs animate-pulse">
                          Generating secure code...
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="block text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                        Invitation Link
                      </label>
                      <div className="flex gap-2 bg-white border border-slate-200/80 rounded-xl p-1.5 shadow-sm group-hover:border-slate-300 transition-all duration-300">
                        <span className="text-[10px] font-mono text-slate-500 break-all select-all flex-1 py-1 px-2.5 overflow-hidden text-ellipsis whitespace-nowrap self-center">
                          {`${appUrl}/join/${selectedCampaign._id}`}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${appUrl}/join/${selectedCampaign._id}`,
                            );
                            setAlertModal({
                              isOpen: true,
                              title: "Copied!",
                              message:
                                "Invitation link successfully copied to clipboard.",
                              type: "success",
                            });
                          }}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg transition-all active:scale-95 whitespace-nowrap"
                        >
                          Copy Link
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full max-w-sm pt-1">
                    <a
                      href={joinQrDataUrl}
                      download={`join-qr-${selectedCampaign._id}.png`}
                      className="flex-1 text-center py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-slate-900/10 hover:scale-[1.01] active:scale-[0.99] transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      💾 Save to PC
                    </a>
                    <button
                      onClick={() => window.print()}
                      className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      🖨️ Print Card
                    </button>
                                {/* DYNAMIC CHECK-IN TAB */}
              {qrMode === "checkin" && (
                <div className="space-y-6 flex flex-col items-center py-2 animate-[fade-in_0.2s_ease-out]">
                  <div className="w-full max-w-sm bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-5 border-b border-dashed border-purple-100 pb-4">
                      <div>
                        <div className="text-[10px] font-bold text-purple-550 uppercase tracking-widest font-mono">
                          Security Key
                        </div>
                        <div className="text-xs font-black text-slate-800 mt-0.5">
                          Live Session Token
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-100/50 px-2.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping"></span>
                        <span className="text-[9px] font-extrabold text-purple-700 uppercase tracking-wider">
                          Live
                        </span>
                      </div>
                    </div>

                    <div className="bg-white border border-purple-100 p-5 rounded-3xl w-fit mx-auto shadow-sm ring-8 ring-purple-50/50 transition-all hover:scale-[1.02] duration-300 mb-5 relative">
                      {dynamicQrDataUrl ? (
                        <img
                          src={dynamicQrDataUrl}
                          alt="Check-in QR Code"
                          className="w-44 h-44 select-none pointer-events-none"
                        />
                      ) : (
                        <div className="w-44 h-44 bg-purple-50/40 rounded-xl flex items-center justify-center">
                          <div className="text-center space-y-2">
                            <div className="w-7 h-7 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                            <p className="text-[9px] font-extrabold text-purple-600 uppercase tracking-wider">
                              Generating...
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 font-bold text-center leading-relaxed px-4">
                      Refresh this code manually after each use to prevent scan
                      fraud. Leave this screen open for customer stamp scanning.
                    </p>
                  </div>

                  <button
                    onClick={() => generateDynamicQr(selectedCampaign._id)}
                    className="w-full max-w-sm py-3.5 bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    🔄 Force Refresh Code
                  </button>
                </div>
              )}

              {qrMode === "bulk" && (
                <div className="space-y-5 py-2 animate-[fade-in_0.2s_ease-out]">
                  {!bulkGenerated ? (
                    <div className="w-full max-w-md mx-auto space-y-5 my-auto">
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm">
                        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-lg shadow-md shadow-amber-500/10">
                            📦
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-black text-slate-900">
                              Generate Stamp Sheets
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                              Print batch codes for physical cards or tables.
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-slate-500 text-[10px] font-extrabold uppercase tracking-widest text-left">
                            Batch Size (Quantity)
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {[10, 20, 50, 100].map((n) => (
                              <button
                                key={n}
                                onClick={() => setBulkCount(n)}
                                className={`py-3 rounded-xl text-xs font-black transition-all border ${
                                  bulkCount === n
                                    ? "bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-500/15"
                                    : "bg-slate-50 border-slate-150 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100/60 mt-3 justify-start">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Or enter custom count:
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
                              className="w-16 bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 text-xs text-center text-slate-800 font-extrabold focus:outline-none focus:border-amber-500 transition-colors"
                            />
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                              (Max 100)
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={generateBulkQr}
                        disabled={bulkLoading}
                        className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/15 hover:scale-[1.01] active:scale-[0.99] transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        {bulkLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Generating Codes...
                          </>
                        ) : (
                          <>⚡ Create {bulkCount} Stamp Codes</>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary toolbar */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3.5 justify-between items-center shadow-sm shrink-0">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black shadow-sm">
                            ✓
                          </span>
                          <div className="text-left">
                            <div className="text-xs font-black text-slate-900">
                              Active QR Sheets
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                              {bulkQrCodes.length} Unused Codes Ready
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 w-full sm:w-auto shrink-0">
                          <button
                            onClick={downloadAllQr}
                            className="flex-1 sm:flex-none py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-xl shadow-sm transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            💾 Save All
                          </button>
                          <button
                            onClick={printBulkQr}
                            className="flex-1 sm:flex-none py-2 px-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-[10px] rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            🖨️ Print
                          </button>
                          <button
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: "Clear Unused QRs?",
                                message:
                                  "This will permanently delete all unused bulk QR codes from the database and reclaim storage space. Proceed?",
                                onConfirm: () => {
                                  setConfirmModal({
                                    isOpen: false,
                                    title: "",
                                    message: "",
                                    onConfirm: null,
                                  });
                                  clearUnusedBulkSessions();
                                },
                              });
                            }}
                            className="py-2 px-3 bg-red-50 hover:bg-red-100 border border-red-100 text-red-655 font-bold text-[10px] rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-[0.98]"
                            title="Delete all unused from DB"
                          >
                            🔄 Reset
                          </button>
                        </div>
                      </div>

                      {/* Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {bulkQrCodes.map((qr) => (
                          <div
                            key={qr.index}
                            onClick={() => setSelectedZoomQr(qr)}
                            className="bg-white border border-slate-200 rounded-2xl p-4 text-center hover:shadow-md hover:scale-[1.02] hover:border-amber-300 transition-all duration-300 group cursor-pointer flex flex-col items-center relative overflow-hidden shadow-sm w-full"
                          >
                            {/* Top: QR */}
                            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl w-24 h-24 flex items-center justify-center group-hover:border-amber-200 group-hover:bg-amber-50/20 transition-all duration-300 shadow-inner z-10">
                              <img
                                src={qr.dataUrl}
                                alt={`QR #${qr.index}`}
                                className="w-full h-full object-contain rounded-lg"
                              />
                            </div>

                            {/* Physical notches & Divider line */}
                            <div className="w-full relative my-3 shrink-0">
                              <div className="absolute -left-[22px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-slate-50 border-r border-slate-200/80 z-10"></div>
                              <div className="absolute -right-[22px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-slate-50 border-l border-slate-200/80 z-10"></div>
                              <div className="w-full border-b border-dashed border-slate-200/60"></div>
                            </div>

                            {/* Bottom: Metadata */}
                            <div className="w-full z-10 space-y-1.5">
                              <div>
                                <div className="text-[10px] font-black text-slate-800">
                                  CODE #{qr.index}
                                </div>
                                <div className="text-[7.5px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">
                                  Single check-in
                                </div>
                              </div>

                              <span className="w-full py-1.5 text-[8.5px] bg-amber-55 text-amber-700 group-hover:bg-amber-100 font-bold rounded-lg transition-colors flex items-center justify-center gap-1 border border-amber-100/50">
                                🔍 Open Scan
                              </span>
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
