'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { http } from '@/shared/api/http';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await http('/auth/signout', {
        method: 'POST',
      });
    } finally {
      router.replace('/login');
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-black/70 transition hover:border-black/20 hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'Déconnexion...' : 'Déconnexion'}
    </button>
  );
}
