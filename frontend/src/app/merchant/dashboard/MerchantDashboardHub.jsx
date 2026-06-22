"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import QRCode from "qrcode";

export default function MerchantDashboardHub({
 business,
 metrics,
 initialCampaigns = [],
 appUrl,
}) {
 const router = useRouter();

 // Scroll to hash on mount
 useEffect(() => {
 const handleHashScroll = () => {
 if (typeof window === "undefined") return;
 const hash = window.location.hash;
 if (hash) {
 const id = hash.replace("#", "");
 const element = document.getElementById(id);
 if (element) {
 const mainContainer = document.querySelector("main");
 if (mainContainer) {
 const containerRect = mainContainer.getBoundingClientRect();
 const elementRect = element.getBoundingClientRect();
 const relativeTop = elementRect.top - containerRect.top + mainContainer.scrollTop;
 mainContainer.scrollTo({
 top: relativeTop - 24,
 behavior: "smooth",
 });
 } else {
 element.scrollIntoView({ behavior: "smooth" });
 }
 }
 }
 };

 const timer = setTimeout(handleHashScroll, 150);
 window.addEventListener("hashchange", handleHashScroll);
 return () => {
 clearTimeout(timer);
 window.removeEventListener("hashchange", handleHashScroll);
 };
 }, []);

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

 // Modal states
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

 // QR Modal Workspace State
 const [selectedCampaign, setSelectedCampaign] = useState(null);
 const [qrMode, setQrMode] = useState("join"); // 'join', 'checkin', 'bulk'

 // Invite/Join QR URL
 const [joinQrDataUrl, setJoinQrDataUrl] = useState("");

 // Live QR session variables
 const [dynamicToken, setDynamicToken] = useState(null);
 const [dynamicExpiresAt, setDynamicExpiresAt] = useState(null);
 const [dynamicQrDataUrl, setDynamicQrDataUrl] = useState("");

 // Bulk QRs variables
 const [bulkCount, setBulkCount] = useState(10);
 const [bulkLoading, setBulkLoading] = useState(false);
 const [bulkQrCodes, setBulkQrCodes] = useState([]);
 const [bulkGenerated, setBulkGenerated] = useState(false);
 const [selectedZoomQr, setSelectedZoomQr] = useState(null);

 // Generate Invite QR code
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

 // Generate live/check-in QR code
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
 console.error("QR generation error:", err);
 }
 }, []);

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
 setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null });
 setAlertModal({
 isOpen: true,
 title: "Campaign Deleted",
 message: "The campaign has been successfully deleted.",
 type: "success",
 });
 } catch (err) {
 setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null });
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
 await new Promise((r) => setTimeout(r, 120));
 }
 };

 const printBulkQr = () => {
 const printWindow = window.open("", "_blank");
 if (!printWindow) return;
 const gridItems = bulkQrCodes
 .map(
 (qr) =>
 `<div style="text-align:center;page-break-inside:avoid;padding:12px;border:1px solid #c3c6d7;border-radius:8px;">
 <img src="${qr.dataUrl}" style="width:160px;height:160px;" />
 <div style="margin-top:6px;font-size:11px;font-weight:700;color:#141b2b;">${selectedCampaign.title}</div>
 <div style="font-size:9px;color:#737686;margin-top:2px;">QR #${qr.index} • Single Use</div>
 </div>`,
 )
 .join("");

 printWindow.document.write(`
 <html>
 <head>
 <title>Bulk QR Codes - ${selectedCampaign.title}</title>
 <style>
 @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
 body { font-family: 'Inter', sans-serif; margin: 20px; }
 h1 { text-align: center; font-size: 20px; color: #004ac6; margin-bottom: 4px; }
 h2 { text-align: center; font-size: 12px; color: #737686; font-weight: 600; margin-bottom: 20px; }
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
 totalStamps = 0,
 uniqueCustomers = 0,
 openRewardsCount = 0,
 redeemedRewardsCount = 0,
 totalRevenue = 0,
 scanTrend = [],
 recentStamps = [],
 } = metrics || {};

 return (
 <div className="space-y-8 pb-10">
 {/* Welcome / Header Section */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-standard pb-6">
 <div>
 <h2 className="text-2xl font-bold text-text-primary">Overview</h2>
 <p className="text-sm text-text-secondary mt-1 font-medium">
 Welcome back, <span className="font-semibold text-primary">{business?.name || "Merchant"}</span>. Track metrics and loyalty campaigns.
 </p>
 </div>
 <button
 onClick={() => {
 setShowForm(true);
 setError("");
 setSuccess("");
 }}
 className="px-5 py-2.5 rounded-lg bg-primary hover:bg-opacity-95 text-on-primary text-xs font-semibold shadow-sm transition-all hover:scale-[1.01] flex items-center gap-1.5"
 >
 <span className="text-base font-bold">+</span>
 Add New Campaign
 </button>
 </div>

 {/* Key Metrics Row */}
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
 {[
 {
 label: "Total Customers",
 value: uniqueCustomers,
 color: "text-primary",
 desc: "Unique enrollments",
 },
 {
 label: "Active Programs",
 value: campaigns.length,
 color: "text-text-primary",
 desc: "Active campaigns",
 },
 {
 label: "Total Stamps Issued",
 value: totalStamps,
 color: "text-secondary",
 desc: "Total stamp scans",
 },
 {
 label: "Rewards Redeemed",
 value: redeemedRewardsCount,
 color: "text-secondary",
 desc: "Milestones achieved",
 },
 {
 label: "Est. Revenue",
 value: `₹${totalRevenue.toLocaleString("en-IN")}`,
 color: "text-primary",
 desc: "From loyalty visits",
 },
 ].map((stat, i) => (
 <div
 key={i}
 className="bg-bg-card border border-border-standard p-4.5 rounded-xl shadow-sm hover:border-primary/30 transition-all duration-200"
 >
 <span className="text-text-muted text-[9px] font-bold uppercase tracking-wider block mb-2">
 {stat.label}
 </span>
 <div className={`text-2xl font-bold tracking-tight ${stat.color}`}>
 {stat.value}
 </div>
 <p className="text-[10px] text-text-secondary mt-1 font-medium">
 {stat.desc}
 </p>
 </div>
 ))}
 </div>

 {/* Analytics Charts & Graphs */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Scan Trend Chart */}
 <div className="bg-bg-card border border-border-standard p-6 rounded-xl shadow-sm lg:col-span-2">
 <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-5 flex items-center gap-2">
 <svg
 className="w-4 h-4 text-primary"
 fill="none"
 viewBox="0 0 24 24"
 stroke="currentColor"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2.5}
 d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
 />
 </svg>
 7-Day Check-in & Stamp Scan Trend
 </h4>
 <div className="flex items-end justify-between h-44 pt-4 border-b border-border-standard px-2">
 {scanTrend.length === 0 ? (
 <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs font-medium">
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
 <div key={idx} className="flex flex-col items-center flex-1 group relative">
 {/* Tooltip */}
 <div className="absolute bottom-full mb-2 bg-on-background text-surface text-[10px] font-semibold py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none z-10">
 {t.scans} scan{t.scans !== 1 ? "s" : ""} • ₹{t.revenue}
 </div>
 {/* Bar */}
 <div
 style={{ height: `${heightPercent}%` }}
 className="w-8 md:w-10 bg-primary/75 group-hover:bg-primary rounded-t transition-all duration-300 shadow-sm"
 ></div>
 <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-2.5">
 {t.day}
 </span>
 </div>
 );
 })
 )}
 </div>
 </div>

 {/* Campaign Metrics Overview */}
 <div className="bg-bg-card border border-border-standard p-6 rounded-xl shadow-sm flex flex-col justify-between">
 <div>
 <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
 <svg
 className="w-4 h-4 text-primary"
 fill="none"
 viewBox="0 0 24 24"
 stroke="currentColor"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2.5}
 d="M13 10V3L4 14h7v7l9-11h-7z"
 />
 </svg>
 Campaign Performance
 </h4>
 <div className="space-y-4 max-h-[12rem] overflow-y-auto pr-1">
 {campaigns.length === 0 ? (
 <div className="text-center py-6 text-xs text-text-secondary font-medium">
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
 <div className="flex justify-between text-xs font-semibold text-text-secondary">
 <span className="truncate pr-2">{camp.title}</span>
 <span className="text-primary font-bold">{enrollCount} joined</span>
 </div>
 <div className="w-full bg-bg-page h-2 rounded-full overflow-hidden border border-border-standard">
 <div
 style={{ width: `${progressPct}%` }}
 className="bg-primary h-full rounded-full"
 ></div>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>
 <div className="border-t border-border-standard pt-4 mt-4 flex justify-between items-center text-xs">
 <span className="text-text-secondary font-semibold">Total Campaigns</span>
 <span className="font-bold text-primary bg-primary/10 border border-primary/20 py-1 px-2.5 rounded-lg">
 {campaigns.length} Active
 </span>
 </div>
 </div>
 </div>

 {/* Campaigns Listing Section */}
 <div id="qrcodes" className="scroll-mt-6"></div>
 <div id="campaigns" className="space-y-4 scroll-mt-6">
 <h3 className="text-lg font-bold text-text-primary">Active Loyalty Programs</h3>

 {campaigns.length === 0 ? (
 <div className="text-center py-16 bg-bg-card border border-border-standard rounded-xl text-text-secondary text-sm shadow-sm font-medium">
 No active loyalty campaigns. Click "+ Add New Campaign" to launch your first loyalty program!
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {campaigns.map((camp) => (
 <div
 key={camp._id}
 className="bg-bg-card border border-border-standard rounded-xl p-5 md:p-6 hover:shadow-sm hover:border-primary/30 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-sm"
 >
 <div className="space-y-3.5">
 <div className="flex justify-between items-start">
 <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded bg-secondary/10 border border-secondary/20 text-secondary">
 {camp.isActive ? "Active" : "Draft"}
 </span>
 <div className="flex items-center gap-1.5">
 <span className="text-[10px] text-text-secondary font-bold bg-surface-container border border-border-standard px-2.5 py-1 rounded-lg">
 {camp.enrollmentCount || 0} enrolled
 </span>
 <button
 onClick={() => handleDeleteCampaign(camp._id)}
 className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-red-50 border border-transparent hover:border-red-100 transition-all duration-200"
 title="Delete Campaign"
 >
 <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
 </svg>
 </button>
 </div>
 </div>
 <h4 className="text-base font-bold text-text-primary">{camp.title}</h4>
 <p className="text-text-secondary text-xs leading-normal font-medium">{camp.description}</p>

 <div className="grid grid-cols-3 gap-2">
 <div className="bg-bg-card border border-border-standard p-2.5 rounded-lg text-center">
 <div className="text-sm font-bold text-primary">{camp.requiredStamps}</div>
 <div className="text-[8px] text-text-muted font-bold uppercase tracking-wider mt-0.5">Stamps</div>
 </div>
 <div className="bg-bg-card border border-border-standard p-2.5 rounded-lg text-center">
 <div className="text-sm font-bold text-text-primary">{camp.pointsPerCheckin || 10}</div>
 <div className="text-[8px] text-text-muted font-bold uppercase tracking-wider mt-0.5">Pts/Day</div>
 </div>
 <div className="bg-bg-card border border-border-standard p-2.5 rounded-lg text-center">
 <div className="text-sm font-bold text-secondary">✨</div>
 <div className="text-[8px] text-text-muted font-bold uppercase tracking-wider mt-0.5">Reward</div>
 </div>
 </div>

 <div className="bg-primary/5 border border-primary/10 p-3 rounded-lg">
 <span className="text-[9px] text-primary font-bold uppercase tracking-wider block mb-0.5">
 Reward Milestone
 </span>
 <span className="text-xs font-semibold text-text-primary">🎁 {camp.rewardTitle}</span>
 </div>
 </div>

 {/* QR Buttons */}
 <div className="flex gap-2 pt-3 border-t border-border-standard">
 <button
 onClick={() => openQrModal(camp, "join")}
 className="flex-1 text-center py-2.5 rounded-lg bg-bg-card border border-border-standard hover:border-outline text-text-primary font-bold text-[10px] transition-all uppercase tracking-wider"
 >
 Join QR
 </button>
 <button
 onClick={() => openQrModal(camp, "checkin")}
 className="flex-1 text-center py-2.5 rounded-lg bg-primary text-on-primary hover:bg-opacity-95 font-bold text-[10px] transition-all uppercase tracking-wider"
 >
 Live QR
 </button>
 <button
 onClick={() => openQrModal(camp, "bulk")}
 className="flex-1 text-center py-2.5 rounded-lg bg-secondary text-on-secondary hover:bg-opacity-95 font-bold text-[10px] transition-all uppercase tracking-wider"
 >
 Bulk QRs
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Recent Stamp Scan History Table */}
 <div className="bg-bg-card border border-border-standard rounded-xl overflow-hidden shadow-sm">
 <div className="px-6 py-4 border-b border-border-standard bg-bg-page flex items-center gap-2">
 <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Recent Stamp Scan History</h4>
 </div>

 {recentStamps.length === 0 ? (
 <div className="text-center py-16 text-text-secondary text-sm bg-bg-card">
 No stamps awarded yet. Check-ins will appear here in real-time.
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-bg-page border-b border-border-standard">
 <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Customer</th>
 <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Bill Number</th>
 <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Bill Amount</th>
 <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Scanned At</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-outline-variant bg-bg-card">
 {recentStamps.map((stamp) => (
 <tr key={stamp._id} className="hover:bg-surface-container-low transition-colors">
 <td className="px-6 py-4">
 <div className="font-semibold text-text-primary text-sm">
 {stamp.customerId?.name || "Anonymous"}
 </div>
 <div className="text-xs text-text-secondary mt-0.5">{stamp.customerId?.email}</div>
 </td>
 <td className="px-6 py-4 font-mono text-text-primary text-sm">{stamp.billNumber || "—"}</td>
 <td className="px-6 py-4 font-semibold text-text-primary text-sm">
 {stamp.amount ? `₹${stamp.amount}` : "—"}
 </td>
 <td className="px-6 py-4 text-text-secondary text-xs font-medium">
 {new Date(stamp.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {/* CREATE CAMPAIGN FORM MODAL */}
 {showForm && (
 <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
 <div className="bg-bg-card border border-border-standard rounded-xl max-w-lg w-full p-6 space-y-6 relative max-h-[90vh] overflow-y-auto shadow-2xl">
 <button
 onClick={() => setShowForm(false)}
 className="absolute top-4 right-4 text-text-muted hover:text-on-surface text-xl font-bold bg-bg-card border border-border-standard hover:border-outline w-8 h-8 rounded-full flex items-center justify-center transition-colors"
 >
 ×
 </button>

 <div>
 <h3 className="text-xl font-bold text-text-primary">Configure New Campaign</h3>
 <p className="text-xs text-text-secondary mt-1.5 font-medium">
 Set up a stamp loyalty card with streak tracking.
 </p>
 </div>

 {error && (
 <div className="bg-red-50 border border-red-150 text-error text-xs p-3.5 rounded-lg font-medium shadow-sm">
 ⚠️ {error}
 </div>
 )}
 {success && (
 <div className="bg-emerald-50 border border-emerald-150 text-secondary text-xs p-3.5 rounded-lg font-medium shadow-sm">
 ✓ {success}
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="space-y-2">
 <label className="block text-text-muted text-[10px] font-bold uppercase tracking-wider">
 Campaign Title
 </label>
 <input
 type="text"
 required
 placeholder="e.g. Cafe Premium Stamp Card"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 className="w-full bg-bg-card border border-border-standard rounded-lg py-3 px-4 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
 />
 </div>

 <div className="space-y-2">
 <label className="block text-text-muted text-[10px] font-bold uppercase tracking-wider">
 Reward Title
 </label>
 <input
 type="text"
 required
 placeholder="e.g. Free Hot Beverage & Donut"
 value={rewardTitle}
 onChange={(e) => setRewardTitle(e.target.value)}
 className="w-full bg-bg-card border border-border-standard rounded-lg py-3 px-4 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="space-y-2">
 <label className="block text-text-muted text-[10px] font-bold uppercase tracking-wider">
 Required Stamps
 </label>
 <input
 type="number"
 required
 min={2}
 max={25}
 value={requiredStamps}
 onChange={(e) => setRequiredStamps(e.target.value)}
 className="w-full bg-bg-card border border-border-standard rounded-lg py-3 px-4 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
 />
 </div>
 <div className="space-y-2">
 <label className="block text-text-muted text-[10px] font-bold uppercase tracking-wider">
 Points / Check-in
 </label>
 <input
 type="number"
 required
 min={1}
 max={100}
 value={pointsPerCheckin}
 onChange={(e) => setPointsPerCheckin(e.target.value)}
 className="w-full bg-bg-card border border-border-standard rounded-lg py-3 px-4 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
 />
 </div>
 <div className="space-y-2">
 <label className="block text-text-muted text-[10px] font-bold uppercase tracking-wider">
 Description
 </label>
 <input
 type="text"
 required
 placeholder="e.g. Daily check-in"
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 className="w-full bg-bg-card border border-border-standard rounded-lg py-3 px-4 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
 />
 </div>
 </div>

 <div className="flex gap-3 pt-2">
 <button
 type="button"
 onClick={() => setShowForm(false)}
 className="flex-1 py-3 bg-bg-card border border-border-standard hover:border-outline text-text-secondary text-xs font-semibold rounded-lg transition-all uppercase tracking-wider"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={loading}
 className="flex-1 bg-primary text-on-primary font-bold py-3.5 rounded-lg shadow-sm transition-all text-xs uppercase tracking-wider"
 >
 {loading ? "Creating..." : "Launch Campaign"}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* QR MODAL WORKSPACE */}
 {selectedCampaign && (
 <div className="fixed inset-0 bg-bg-card z-[100] flex flex-col animate-[fade-in_0.2s_ease-out]">
 {/* Top Header Row */}
 <div className="w-full border-b border-border-standard py-4 px-6 bg-bg-card shrink-0">
 <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
 <div className="flex items-center gap-3">
 <span className="px-2.5 py-1 bg-primary/10 text-primary font-bold text-[9px] uppercase tracking-widest rounded-md border border-primary/25">
 Campaign Workspace
 </span>
 <h3 className="text-lg md:text-xl font-bold text-text-primary tracking-tight">
 {selectedCampaign.title}
 </h3>
 </div>
 <button
 onClick={closeQrModal}
 className="text-text-secondary hover:text-on-surface bg-bg-card border border-border-standard px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 whitespace-nowrap"
 >
 ✕ Close Workspace
 </button>
 </div>
 </div>

 {/* Main workspace panels */}
 <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 min-h-0 overflow-hidden">
 {/* Tabs Sidebar */}
 <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
 <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider hidden md:block">
 Navigation
 </div>

 <div className="flex md:flex-col bg-surface-container rounded-xl md:rounded-none p-1 md:p-0 gap-1 border border-border-standard md:border-0">
 <button
 onClick={() => setQrMode("join")}
 className={`flex-1 md:flex-initial py-3 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center md:justify-start gap-2.5 ${
 qrMode === "join"
 ? "bg-primary text-on-primary shadow-sm font-bold"
 : "text-text-secondary hover:bg-surface-container-low hover:text-on-surface"
 }`}
 >
 <span className="text-sm">🔗</span> Join QR
 </button>
 <button
 onClick={() => {
 setQrMode("checkin");
 if (!dynamicToken) generateDynamicQr(selectedCampaign._id);
 }}
 className={`flex-1 md:flex-initial py-3 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center md:justify-start gap-2.5 ${
 qrMode === "checkin"
 ? "bg-primary text-on-primary shadow-sm font-bold"
 : "text-text-secondary hover:bg-surface-container-low hover:text-on-surface"
 }`}
 >
 <span className="text-sm">⚡</span> Live QR
 </button>
 <button
 onClick={() => {
 setQrMode("bulk");
 fetchActiveBulkSessions(selectedCampaign._id);
 }}
 className={`flex-1 md:flex-initial py-3 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center md:justify-start gap-2.5 ${
 qrMode === "bulk"
 ? "bg-primary text-on-primary shadow-sm font-bold"
 : "text-text-secondary hover:bg-surface-container-low hover:text-on-surface"
 }`}
 >
 <span className="text-sm">📦</span> Bulk Codes
 </button>
 </div>

 {/* Guide card */}
 <div className="hidden md:block bg-bg-card border border-border-standard rounded-lg p-4 mt-auto">
 <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
 Workspace Guide
 </h4>
 <p className="text-[10.5px] text-text-secondary leading-relaxed font-medium">
 {qrMode === "join" && "Share this permanent QR link to invite and onboard new customers."}
 {qrMode === "checkin" && "Display this live QR to award stamps. Code refreshes dynamically after scans."}
 {qrMode === "bulk" && "Generate sheets of unique single-use stamp check-in codes for print."}
 </p>
 </div>
 </div>

 {/* Display/Content area */}
 <div className="flex-grow bg-bg-card border border-border-standard rounded-xl p-6 overflow-y-auto min-h-0">
 {/* JOIN INVITE TAB */}
 {qrMode === "join" && (
 <div className="space-y-6 flex flex-col items-center py-2 animate-[fade-in_0.2s_ease-out]">
 <div className="w-full max-w-sm bg-bg-card border border-border-standard rounded-xl p-6 shadow-sm relative overflow-hidden group">
 <div className="flex justify-between items-center mb-5 border-b border-dashed border-border-standard pb-4">
 <div>
 <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">
 Permanent invitation
 </div>
 <div className="text-xs font-bold text-text-primary mt-0.5">
 Campaign Enrollment QR
 </div>
 </div>
 <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
 </div>

 <div className="bg-bg-card border border-border-standard p-5 rounded-lg w-fit mx-auto shadow-sm mb-5">
 {joinQrDataUrl ? (
 <img
 src={joinQrDataUrl}
 alt="Join QR Code"
 className="w-44 h-44 select-none pointer-events-none"
 />
 ) : (
 <div className="w-44 h-44 bg-bg-card rounded flex items-center justify-center text-text-muted text-xs animate-pulse">
 Generating secure code...
 </div>
 )}
 </div>

 <div className="space-y-1.5 text-left">
 <label className="block text-text-muted text-[9px] font-bold uppercase tracking-wider">
 Invitation Link
 </label>
 <div className="flex gap-2 bg-bg-card border border-border-standard rounded-lg p-1.5 shadow-sm">
 <span className="text-[10px] font-mono text-text-secondary break-all select-all flex-grow py-1 px-2.5 overflow-hidden text-ellipsis whitespace-nowrap self-center">
 {`${appUrl}/join/${selectedCampaign._id}`}
 </span>
 <button
 onClick={() => {
 navigator.clipboard.writeText(`${appUrl}/join/${selectedCampaign._id}`);
 setAlertModal({
 isOpen: true,
 title: "Copied!",
 message: "Invitation link successfully copied to clipboard.",
 type: "success",
 });
 }}
 className="px-3.5 py-1.5 bg-primary text-on-primary font-semibold text-[10px] rounded-lg transition-all active:scale-95 whitespace-nowrap shadow-sm"
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
 className="flex-grow text-center py-3.5 bg-primary text-on-primary font-bold text-xs rounded-lg shadow-sm hover:bg-opacity-95 transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
 >
 💾 Save to PC
 </a>
 <button
 onClick={() => window.print()}
 className="flex-grow py-3.5 bg-bg-card border border-border-standard hover:border-outline text-text-primary font-bold text-xs rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
 >
 🖨&nbsp; Print Card
 </button>
 </div>
 </div>
 )}

 {/* DYNAMIC CHECK-IN TAB */}
 {qrMode === "checkin" && (
 <div className="space-y-6 flex flex-col items-center py-2 animate-[fade-in_0.2s_ease-out]">
 <div className="w-full max-w-sm bg-bg-card border border-border-standard rounded-xl p-6 shadow-sm relative overflow-hidden group">
 <div className="flex justify-between items-center mb-5 border-b border-dashed border-border-standard pb-4">
 <div>
 <div className="text-[10px] font-bold text-primary uppercase tracking-wider font-mono">
 Check-in Token
 </div>
 <div className="text-xs font-bold text-text-primary mt-0.5">
 Live Scan Terminal
 </div>
 </div>
 <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-md">
 <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
 <span className="text-[9px] font-bold text-primary uppercase tracking-wider">
 Live
 </span>
 </div>
 </div>

 <div className="bg-bg-card border border-border-standard p-5 rounded-lg w-fit mx-auto shadow-sm mb-5">
 {dynamicQrDataUrl ? (
 <img
 src={dynamicQrDataUrl}
 alt="Check-in QR Code"
 className="w-44 h-44 select-none pointer-events-none"
 />
 ) : (
 <div className="w-44 h-44 bg-bg-card rounded flex items-center justify-center">
 <div className="text-center space-y-2">
 <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
 <p className="text-[9px] font-bold text-primary uppercase tracking-wider">
 Loading...
 </p>
 </div>
 </div>
 )}
 </div>

 <p className="text-[10px] text-text-secondary font-medium text-center leading-relaxed px-4">
 Aim target check-in screens to scan. The code changes automatically after scan validation to prevent misuse.
 </p>
 </div>

 <button
 onClick={() => generateDynamicQr(selectedCampaign._id)}
 className="w-full max-w-sm py-3.5 bg-primary text-on-primary font-bold text-xs rounded-lg shadow-sm hover:bg-opacity-95 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
 >
 🔄 Refresh Live QR Token
 </button>
 </div>
 )}

 {/* BULK QR CODE SHETTS */}
 {qrMode === "bulk" && (
 <div className="space-y-5 py-2 animate-[fade-in_0.2s_ease-out]">
 {!bulkGenerated ? (
 <div className="w-full max-w-md mx-auto space-y-5">
 <div className="bg-bg-card border border-border-standard rounded-xl p-6 space-y-5 shadow-sm">
 <div className="flex items-center gap-3.5 border-b border-border-standard pb-4">
 <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center text-lg font-bold shadow-sm">
 📦
 </div>
 <div>
 <div className="text-sm font-bold text-text-primary">Generate Batch Stamp Codes</div>
 <div className="text-[10px] text-text-secondary font-medium mt-0.5">
 Print batch sheets of single-use codes for tags.
 </div>
 </div>
 </div>

 <div className="space-y-3">
 <label className="block text-text-muted text-[10px] font-bold uppercase tracking-wider">
 Quantity Count
 </label>
 <div className="grid grid-cols-4 gap-2">
 {[10, 20, 50, 100].map((n) => (
 <button
 key={n}
 onClick={() => setBulkCount(n)}
 className={`py-2 rounded-lg text-xs font-bold transition-all border ${
 bulkCount === n
 ? "bg-primary border-primary text-on-primary shadow-sm"
 : "bg-bg-card border-border-standard text-text-secondary hover:bg-surface-container-low"
 }`}
 >
 {n}
 </button>
 ))}
 </div>

 <div className="flex items-center gap-2 pt-2 border-t border-border-standard mt-3">
 <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
 Custom Quantity:
 </span>
 <input
 type="number"
 min={1}
 max={100}
 value={bulkCount}
 onChange={(e) =>
 setBulkCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))
 }
 className="w-16 bg-bg-card border border-border-standard rounded-lg py-1 px-2.5 text-xs text-center text-text-primary font-bold focus:outline-none focus:border-primary transition-colors"
 />
 <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider">
 (Max 100)
 </span>
 </div>
 </div>
 </div>

 <button
 onClick={generateBulkQr}
 disabled={bulkLoading}
 className="w-full py-3.5 bg-primary text-on-primary font-bold text-xs rounded-lg shadow-sm hover:bg-opacity-95 disabled:opacity-80 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
 >
 {bulkLoading ? (
 <>
 <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>
 Generating...
 </>
 ) : (
 <>⚡ Create {bulkCount} Stamp Codes</>
 )}
 </button>
 </div>
 ) : (
 <div className="space-y-4">
 {/* Summary toolbar */}
 <div className="bg-bg-card border border-border-standard rounded-lg p-4 flex flex-col sm:flex-row gap-3.5 justify-between items-center shadow-sm">
 <div className="flex items-center gap-2.5">
 <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-[10px] font-bold shadow-sm">
 ✓
 </span>
 <div>
 <div className="text-xs font-bold text-text-primary">Active Batch Sheets</div>
 <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-0.5">
 {bulkQrCodes.length} Unused Codes Ready
 </div>
 </div>
 </div>

 {/* Actions */}
 <div className="flex gap-2 w-full sm:w-auto shrink-0">
 <button
 onClick={downloadAllQr}
 className="flex-grow sm:flex-none py-2 px-3.5 bg-primary text-on-primary font-semibold text-[10px] rounded-lg shadow-sm transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 hover:scale-[1.01]"
 >
 💾 Save All
 </button>
 <button
 onClick={printBulkQr}
 className="flex-grow sm:flex-none py-2 px-3.5 bg-bg-card border border-border-standard hover:border-outline text-text-primary font-semibold text-[10px] rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 hover:scale-[1.01]"
 >
 🖨 Print Sheet
 </button>
 <button
 onClick={() => {
 setConfirmModal({
 isOpen: true,
 title: "Clear Unused QRs?",
 message:
 "This will permanently delete all unused bulk QR codes from the database and reclaim storage space. Proceed?",
 onConfirm: () => {
 setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null });
 clearUnusedBulkSessions();
 },
 });
 }}
 className="py-2 px-3 bg-red-50 hover:bg-red-100 border border-red-100 text-error font-semibold text-[10px] rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1"
 title="Delete all unused from DB"
 >
 🔄 Reset
 </button>
 </div>
 </div>

 {/* Bulk QR Codes Grid */}
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
 {bulkQrCodes.map((qr) => (
 <div
 key={qr.index}
 onClick={() => setSelectedZoomQr(qr)}
 className="bg-bg-card border border-border-standard rounded-lg p-4 text-center hover:shadow-sm hover:border-primary/40 transition-all cursor-pointer flex flex-col items-center relative overflow-hidden shadow-sm"
 >
 {/* QR code image */}
 <div className="bg-bg-card border border-border-standard p-2 rounded-lg w-24 h-24 flex items-center justify-center transition-all shadow-inner mb-3">
 <img
 src={qr.dataUrl}
 alt={`QR #${qr.index}`}
 className="w-full h-full object-contain rounded"
 />
 </div>

 {/* Divider line */}
 <div className="w-full relative my-1.5">
 <div className="absolute -left-[22px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-bg-card border-r border-border-standard z-10"></div>
 <div className="absolute -right-[22px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-bg-card border-l border-border-standard z-10"></div>
 <div className="w-full border-b border-dashed border-border-standard"></div>
 </div>

 {/* Metadata details */}
 <div className="w-full space-y-1 mt-1">
 <div className="text-[10px] font-bold text-text-primary">
 CODE #{qr.index}
 </div>
 <div className="text-[8px] text-text-muted font-bold uppercase tracking-wider">
 Single stamp
 </div>
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

 {/* CONFIRMATION DIALOG MODAL */}
 {confirmModal.isOpen && (
 <div className="fixed inset-0 bg-slate-900/80 z-[110] flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
 <div className="bg-bg-card border border-border-standard rounded-xl max-w-sm w-full p-6 text-center space-y-5 relative shadow-2xl">
 <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-error text-xl font-bold">
 ⚠️
 </div>
 <div className="space-y-1">
 <h3 className="text-lg font-bold text-text-primary">{confirmModal.title}</h3>
 <p className="text-xs text-text-secondary leading-relaxed font-medium">
 {confirmModal.message}
 </p>
 </div>
 <div className="flex gap-3 pt-1">
 <button
 onClick={() => setConfirmModal({ isOpen: false, title: "", message: "", onConfirm: null })}
 className="flex-1 py-3 bg-bg-card border border-border-standard text-text-secondary font-semibold text-xs rounded-lg transition-all uppercase tracking-wider"
 >
 Cancel
 </button>
 <button
 onClick={confirmModal.onConfirm}
 className="flex-1 py-3 bg-error text-on-primary font-bold text-xs rounded-lg shadow-sm transition-all uppercase tracking-wider"
 >
 Delete
 </button>
 </div>
 </div>
 </div>
 )}

 {/* ALERT DIALOG MODAL */}
 {alertModal.isOpen && (
 <div className="fixed inset-0 bg-slate-900/80 z-[110] flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
 <div className="bg-bg-card border border-border-standard rounded-xl max-w-sm w-full p-6 text-center space-y-5 relative shadow-2xl">
 <div
 className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto text-xl font-bold border ${
 alertModal.type === "success"
 ? "bg-emerald-50 border-emerald-100 text-secondary"
 : "bg-red-50 border-red-100 text-error"
 }`}
 >
 {alertModal.type === "success" ? "✓" : "⚠️"}
 </div>
 <div className="space-y-1">
 <h3 className="text-lg font-bold text-text-primary">{alertModal.title}</h3>
 <p className="text-xs text-text-secondary leading-relaxed font-medium">
 {alertModal.message}
 </p>
 </div>
 <button
 onClick={() => setAlertModal({ isOpen: false, title: "", message: "", type: "info" })}
 className={`w-full py-3 font-bold text-xs rounded-lg transition-all uppercase tracking-wider ${
 alertModal.type === "success"
 ? "bg-secondary text-on-secondary"
 : "bg-error text-on-primary"
 }`}
 >
 Okay
 </button>
 </div>
 </div>
 )}

 {/* ZOOM SINGLE QR MODAL */}
 {selectedZoomQr && (
 <div
 className="fixed inset-0 bg-slate-900/80 z-[110] flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]"
 onClick={() => setSelectedZoomQr(null)}
 >
 <div
 className="bg-bg-card border border-border-standard rounded-xl max-w-sm w-full p-6 text-center space-y-4 relative shadow-2xl"
 onClick={(e) => e.stopPropagation()}
 >
 <button
 onClick={() => setSelectedZoomQr(null)}
 className="absolute top-4 right-4 text-text-muted hover:text-on-surface text-xl font-bold bg-bg-card border border-border-standard hover:border-outline w-8 h-8 rounded-full flex items-center justify-center transition-colors"
 >
 ✕
 </button>
 <div className="space-y-1">
 <h3 className="text-base font-bold text-text-primary">Scan QR #{selectedZoomQr.index}</h3>
 <p className="text-xs text-text-secondary font-medium">Single-use check-in code</p>
 </div>

 <div className="bg-bg-card border border-border-standard p-5 rounded-lg w-fit mx-auto shadow-sm mb-2">
 <img
 src={selectedZoomQr.dataUrl}
 alt={`QR #${selectedZoomQr.index}`}
 className="w-52 h-52 select-none pointer-events-none"
 />
 </div>

 <p className="text-[10px] text-text-secondary font-medium leading-relaxed">
 Scan directly from your screen with a customer device. Once check-in finishes, this code expires.
 </p>

 <div className="flex gap-2 pt-2">
 <a
 href={selectedZoomQr.dataUrl}
 download={`checkin-qr-${selectedCampaign?.title?.replace(/\s+/g, "-").toLowerCase() || "code"}-${selectedZoomQr.index}.png`}
 className="flex-grow text-center py-2.5 bg-primary text-on-primary font-bold text-[10px] rounded-lg shadow-sm transition-all uppercase tracking-wider"
 >
 Download PNG
 </a>
 <button
 onClick={() => setSelectedZoomQr(null)}
 className="flex-grow py-2.5 bg-bg-card border border-border-standard hover:border-outline text-text-secondary font-bold text-[10px] rounded-lg transition-all uppercase tracking-wider"
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
