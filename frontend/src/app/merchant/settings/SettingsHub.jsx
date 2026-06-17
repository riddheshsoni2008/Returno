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

  // Billing states
  const [billingPlan, setBillingPlan] = useState('Starter (Trial)');
  const [isSandboxUpgrade, setIsSandboxUpgrade] = useState(false);

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
          state
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
            <h3 className="font-black text-slate-900 text-md">Geofencing & Regional Location</h3>
            <p className="text-xs text-slate-500 mt-1">Stamps claims check regional location to prevent fraud.</p>
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
          <p className="text-xs text-slate-500 mt-1">Check active plans and payment statuses.</p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Current Plan</span>
            <span className="text-slate-900 font-bold">{billingPlan}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Cycle Status</span>
            <span className="text-emerald-650 font-bold uppercase">Sandbox Active</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Pricing Tier</span>
            <span className="text-slate-900 font-bold">₹0 (Sandbox)</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-normal">
          During sandbox execution, Returno runs in developer evaluation mode. Paid integrations are mocked.
        </p>

        {!isSandboxUpgrade ? (
          <button
            onClick={handleUpgradePlan}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-500/10 hover:-translate-y-0.5 transition-all"
          >
            Upgrade to Growth
          </button>
        ) : (
          <div className="text-center py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase">
            Upgraded Plan Active
          </div>
        )}
      </div>
    </div>
  );
}
