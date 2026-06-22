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
    <div className="space-y-6">
      {/* Global Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-150 text-error text-xs p-4 rounded-xl font-medium flex items-start gap-2.5 shadow-sm animate-fade-in-up">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="leading-normal">{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-150 text-secondary text-xs p-4 rounded-xl font-medium flex items-start gap-2.5 shadow-sm animate-fade-in-up">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="leading-normal">{success}</span>
        </div>
      )}

      {/* APPROVALS SECTION */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-outline-variant bg-surface-container-low">
          <h3 className="text-lg font-bold text-on-surface">
            Pending Customer Redemptions
          </h3>
          <p className="text-xs text-on-surface-variant mt-1 font-medium">
            Verify customer device screen is in &quot;pending&quot; status and confirm.
          </p>
        </div>

        {claims.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant text-sm bg-surface">
            No reward redemptions currently pending. Customer claim requests will appear here dynamically.
          </div>
        ) : (
          <div className="divide-y divide-outline-variant bg-surface">
            {claims.map((claim) => (
              <div key={claim._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-surface-container-low/50 transition-colors">
                <div className="space-y-1">
                  <div className="font-bold text-on-surface text-base flex items-center gap-2">
                    <span className="text-lg">🎁</span> {claim.rewardTitle}
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    Customer: <span className="text-on-surface font-semibold">{claim.customerId?.name || 'Anonymous Customer'}</span> ({claim.customerId?.email})
                  </div>
                  <div className="text-[10px] text-outline">
                    Requested on {new Date(claim.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </div>
                </div>

                <button
                  onClick={() => handleApproveClaim(claim._id)}
                  disabled={loadingApprovalId !== null}
                  className="px-5 py-3 rounded-lg bg-primary text-on-primary hover:bg-opacity-95 disabled:opacity-50 text-xs font-semibold shadow-sm hover:scale-[1.01] transition-all w-full sm:w-auto text-center"
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
