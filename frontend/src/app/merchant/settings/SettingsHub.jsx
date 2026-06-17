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
  const [name, setName] = useState(business.name || '');
  const [category, setCategory] = useState(business.category || 'Cafe');
  const [address, setAddress] = useState(business.address || '');
  const [city, setCity] = useState(business.city || '');
  const [state, setState] = useState(business.state || '');
  const [longitude, setLongitude] = useState(business.location?.coordinates?.[0] || 72.8777);
  const [latitude, setLatitude] = useState(business.location?.coordinates?.[1] || 19.0760);
  const [geofenceRadius, setGeofenceRadius] = useState(business.geofenceRadius || 100);

  // Billing states
  const [billingPlan, setBillingPlan] = useState('3-Day Trial');
  const [isSandboxUpgrade, setIsSandboxUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('growth');

  const handleDetectCoordinates = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLongitude(parseFloat(position.coords.longitude.toFixed(6)));
        setLatitude(parseFloat(position.coords.latitude.toFixed(6)));
        setSuccess('Current coordinates set from your browser location!');
        setTimeout(() => setSuccess(''), 3000);
      },
      (err) => {
        setError('Location access denied or failed: ' + err.message);
      }
    );
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (loading) return;
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
          city,
          state,
          longitude,
          latitude,
          geofenceRadius
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
        router.push('/merchant/dashboard');
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleUpgradePlan = (planCode) => {
    setLoading(true);
    setTimeout(() => {
      const planNames = {
        basic: 'Basic Plan (₹999/yr)',
        growth: 'Growth Plan (₹2,499/yr)',
        pro: 'Pro Plan (₹4,999/yr)'
      };
      setBillingPlan(planNames[planCode]);
      setIsSandboxUpgrade(true);
      setSuccess(`Upgrade to ${planCode.toUpperCase()} successful in Sandbox! Your physical QR Stand will be dispatched.`);
      setLoading(false);
      setTimeout(() => setSuccess(''), 4000);
    }, 1000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-800 animate-fade-in-up">
      {/* Settings Form */}
      <div className="lg:col-span-2 space-y-6">
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

        <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-black text-slate-900 text-lg">Shop profile</h3>
            <p className="text-xs text-slate-500 mt-1">Configure metadata shown to customers on QR scans.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Shop Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors"
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
            <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Physical Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div className="border-t border-slate-100 pt-6">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-black text-slate-900 text-md">Geofencing & Regional Location</h3>
                <p className="text-xs text-slate-500 mt-1">Stamps claims check location coordinates to prevent fraud.</p>
              </div>
              <button
                type="button"
                onClick={handleDetectCoordinates}
                className="text-xs font-bold text-red-600 hover:text-red-700 transition-all bg-red-50 border border-red-100/50 py-1.5 px-3 rounded-lg flex items-center gap-1.5"
              >
                <span>📍</span> Detect GPS coordinates
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">City</label>
              <input
                type="text"
                required
                placeholder="e.g. Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">State / Region</label>
              <input
                type="text"
                required
                placeholder="e.g. Maharashtra"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Geofence Radius</label>
              <select
                value={geofenceRadius}
                onChange={(e) => setGeofenceRadius(parseInt(e.target.value) || 100)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-slate-800 text-sm focus:outline-none focus:border-red-500 transition-colors"
              >
                <option value="50">50 Meters (Tight)</option>
                <option value="100">100 Meters (Standard)</option>
                <option value="200">200 Meters (Wide)</option>
                <option value="500">500 Meters (Max)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all text-xs uppercase tracking-wider shadow-lg shadow-red-500/10"
          >
            {loading ? 'Saving Settings...' : 'Save Settings Details'}
          </button>
        </form>
      </div>

      {/* Subscription Column */}
      <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-6 h-fit space-y-6 shadow-sm">
        <div>
          <h3 className="font-black text-slate-900 text-lg">Billing & Subscriptions</h3>
          <p className="text-xs text-slate-500 mt-1">Select plan, subscribe, and get your free QR Stand.</p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Current Plan</span>
            <span className="text-slate-900 font-extrabold">{billingPlan}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Cycle Status</span>
            <span className={`font-bold uppercase ${isSandboxUpgrade ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isSandboxUpgrade ? 'Paid Active' : 'Trial Period'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Free QR Stand</span>
            <span className={`font-bold ${isSandboxUpgrade ? 'text-emerald-600' : 'text-slate-400'}`}>
              {isSandboxUpgrade ? 'Dispatched 📦' : 'Upgrade to Claim'}
            </span>
          </div>
        </div>

        <div className="border-t border-slate-150 pt-4 space-y-3">
          <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider">Choose a Plan to Upgrade</label>
          <div className="space-y-2">
            {[
              { code: 'basic', label: 'Basic Plan', desc: '1 Location, Free QR Stand', price: '₹999/year' },
              { code: 'growth', label: 'Growth Plan', desc: '3 Locations, GPS branch detection', price: '₹2,499/year' },
              { code: 'pro', label: 'Pro Plan', desc: '6 Locations, GPS branch detection', price: '₹4,999/year' },
            ].map(p => (
              <label
                key={p.code}
                className={`flex justify-between items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedPlan === p.code
                  ? 'border-red-500 bg-red-50/30'
                  : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="planSelector"
                    checked={selectedPlan === p.code}
                    onChange={() => setSelectedPlan(p.code)}
                    className="mt-1 accent-red-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{p.label}</span>
                    <span className="text-[10px] text-slate-500 block">{p.desc}</span>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-950 whitespace-nowrap">{p.price}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={() => handleUpgradePlan(selectedPlan)}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-500/10 hover:-translate-y-0.5 transition-all"
        >
          {isSandboxUpgrade ? 'Upgrade Plan Sandbox' : 'Upgrade and Pay'}
        </button>
      </div>
    </div>
  );
}
