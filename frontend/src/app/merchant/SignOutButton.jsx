"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await apiFetch('/auth/me', {
        method: 'POST',
      });
    } catch (err) {
      console.error('Logout API call failed, signing out locally:', err.message);
    } finally {
      // Always delete the cookie locally even if the backend request fails or is cross-origin
      if (typeof document !== 'undefined') {
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
      }
      router.push('/merchant/auth');
      router.refresh();
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs md:text-sm font-semibold transition-all border border-red-200/50 disabled:opacity-50"
    >
      🚪 {loading ? 'Signing Out...' : 'Sign Out'}
    </button>
  );
}
