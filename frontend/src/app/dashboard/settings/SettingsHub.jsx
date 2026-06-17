"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function SettingsHub({ initialBusiness }) {
  const router = useRouter();
  const [business, setBusiness] = useState(initialBusiness);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fields state
  const [name, setName] = useState(business.name);
  const [category, setCategory] = useState(business.category);
  const [address, setAddress] = useState(business.address);
  const [verificationCode, setVerificationCode] = useState(business.verificationCode);
  const [geofenceRadius, setGeofenceRadius] = useState(business.geofenceRadius);
  const [longitude, setLongitude] = useState(business.location.coordinates[0]);
  const [latitude, setLatitude] = useState(business.location.coordinates[1]);

  // Billing states
  const [billingPlan, setBillingPlan] = useState('Starter (Trial)');
  const [isSandboxUpgrade, setIsSandboxUpgrade] = useState(false);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent double taps
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch('/business', {
        method: 'POST',
        body: JSON.stringify({
          name,
          category,
          address,
          verificationCode,
          geofenceRadius: parseInt(geofenceRadius),
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude)
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      setSuccess('Settings updated successfully! Redirecting...');
      setBusiness(data.business);
      setTimeout(() => {
        setSuccess('');
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err.message);
      setLoading(false); // Only reset loading on error so the button stays disabled during redirect
    }
  };

  const handleUpgradePlan = () => {
    setLoading(true);
    setTimeout(() => {
      setBillingPlan('Growth (Premium Mock Sandbox)');
      setIsSandboxUpgrade(true);
      setSuccess('Plan upgraded inside development sandbox!');
      setLoading(false);
      setTimeout(() => setSuccess(''), 2000);
    }, 1000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Settings Form */}
      <div className="lg:col-span-2 space-y-6">
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

        <form onSubmit={handleSaveSettings} className="bg-dark-900 border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-bold text-slate-200 text-lg">Shop profile</h3>
            <p className="text-xs text-slate-500 mt-1">Configure metadata shown to customers on QR scans.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Shop Name</label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="Cafe">☕ Cafe</option>
                <option value="Restaurant">🍔 Restaurant</option>
                <option value="Salon & Spa">💇‍♀️ Salon & Spa</option>
                <option value="Gym & Fitness">🏋️‍♂️ Gym & Fitness</option>
                <option value="Clinic">🩺 Clinic</option>
                <option value="Retail Store">🛍️ Retail Store</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Physical Address</label>
            <input 
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="border-t border-white/5 pt-6">
            <h3 className="font-bold text-slate-200 text-md">Geofencing & Anti-Fraud Coordinates</h3>
            <p className="text-xs text-slate-500 mt-1">Stamps claims check distance to these coordinates to prevent fraud.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Longitude</label>
              <input 
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Latitude</label>
              <input 
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Geofence Radius (meters)</label>
              <input 
                type="number"
                required
                value={geofenceRadius}
                onChange={(e) => setGeofenceRadius(e.target.value)}
                className="w-full bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="border-t border-white/5 pt-6">
            <h3 className="font-bold text-slate-200 text-md">Redemption Verification PIN</h3>
            <p className="text-xs text-slate-500 mt-1">4-digit PIN verified on claims to unlock rewards.</p>
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Staff Verification PIN</label>
            <input 
              type="text"
              required
              maxLength={4}
              pattern="\d{4}"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-24 bg-dark-950 border border-white/10 rounded-xl py-3 px-4 text-center text-lg font-bold tracking-[0.5em] text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all text-xs uppercase tracking-wider"
          >
            {loading ? 'Saving Settings...' : 'Save Settings Details'}
          </button>
        </form>
      </div>

      {/* Subscription Column */}
      <div className="lg:col-span-1 bg-dark-900 border border-white/10 rounded-2xl p-6 h-fit space-y-6">
        <div>
          <h3 className="font-bold text-slate-200 text-lg">Billing & Subscriptions</h3>
          <p className="text-xs text-slate-400 mt-1">Check active plans and payment statuses.</p>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Current Plan</span>
            <span className="text-white font-bold">{billingPlan}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Cycle Status</span>
            <span className="text-emerald-400 font-bold uppercase">Sandbox Active</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Pricing Tier</span>
            <span className="text-white font-bold">₹0 (Sandbox)</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-normal">
          During sandbox execution, Returno runs in developer evaluation mode. Paid integrations are mocked.
        </p>

        {!isSandboxUpgrade ? (
          <button
            onClick={handleUpgradePlan}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Upgrade to Growth
          </button>
        ) : (
          <div className="text-center py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase">
            Upgraded Plan Active
          </div>
        )}
      </div>
    </div>
  );
}
