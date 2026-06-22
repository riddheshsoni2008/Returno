"use client";

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function RewardsHub({ initialClaims, verificationCode }) {
  const [claims, setClaims] = useState(initialClaims);
  const [loadingApprovalId, setLoadingApprovalId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    <div className="space-y-6 text-slate-800">
      {/* Global Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-4 rounded-xl font-medium flex items-start gap-2.5">
          <span>⚠️</span>
          <span className="leading-normal">{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-4 rounded-xl font-medium flex items-start gap-2.5">
          <span>✓</span>
          <span className="leading-normal">{success}</span>
        </div>
      )}

      {/* APPROVALS SECTION */}
      <div className="bg-white border border-slate-200/80 p-5 md:p-6 rounded-2xl shadow-sm">
        <div className="border-b border-slate-100 pb-4 mb-4">
          <h3 className="text-lg font-black text-slate-900">
            Pending Customer Redemptions
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Verify customer device screen is in &quot;pending&quot; status and confirm.</p>
        </div>

        {claims.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No reward redemptions currently pending. Customer claim requests will appear here dynamically.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {claims.map((claim) => (
              <div key={claim._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    🎁 {claim.rewardTitle}
                  </div>
                  <div className="text-xs text-slate-650 mt-1">
                    Customer: <span className="text-slate-900 font-bold">{claim.customerId?.name || 'Anonymous Customer'}</span> ({claim.customerId?.email})
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Requested on {new Date(claim.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </div>
                </div>

                <button
                  onClick={() => handleApproveClaim(claim._id)}
                  disabled={loadingApprovalId !== null}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-red-500/10 hover:-translate-y-0.5 transition-all w-full sm:w-auto"
                >
                  {loadingApprovalId === claim._id ? 'Approving...' : 'Confirm Redemption'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
