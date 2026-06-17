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
      router.push('/merchant/auth');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err.message);
      // Fallback
      router.push('/merchant/auth');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs md:text-sm font-semibold transition-all border border-red-500/10 disabled:opacity-50"
    >
      🚪 {loading ? 'Signing Out...' : 'Sign Out'}
    </button>
  );
}
