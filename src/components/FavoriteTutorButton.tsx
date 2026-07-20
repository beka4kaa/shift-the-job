'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface FavoriteRow { id: number; teacher: { id: number } }

export function FavoriteTutorButton({ teacherId }: { teacherId: string }) {
  const { data: session, status } = useSession();
  const [favoriteId, setFavoriteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session?.user?.role !== 'STUDENT') {
      return;
    }
    fetch('/api/favorites', { cache: 'no-store' })
      .then(async (res) => res.ok ? (await res.json() as FavoriteRow[]) : [])
      .then((rows) => setFavoriteId(rows.find((row) => String(row.teacher.id) === teacherId)?.id ?? null))
      .finally(() => setLoading(false));
  }, [session?.user?.role, status, teacherId]);

  if (status === 'unauthenticated') {
    return <Link href="/auth/login" className="mt-3 flex w-full items-center justify-center gap-2 border border-black/15 py-3 text-black/70 hover:border-black/30"><Heart className="h-4 w-4" />Sign in to save</Link>;
  }

  if (status === 'authenticated' && session?.user?.role !== 'STUDENT') return null;

  const toggle = async () => {
    setLoading(true);
    if (favoriteId) {
      const res = await fetch(`/api/favorites?id=${favoriteId}`, { method: 'DELETE' });
      if (res.ok) setFavoriteId(null);
    } else {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: Number(teacherId) }),
      });
      if (res.ok) setFavoriteId((await res.json() as FavoriteRow).id);
    }
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className="mt-3 flex w-full items-center justify-center gap-2 border border-black/15 py-3 text-black/70 transition-colors hover:border-black/30 hover:text-black disabled:opacity-50"
    >
      <Heart className={`h-4 w-4 ${favoriteId ? 'fill-[#91a838] text-[#91a838]' : ''}`} />
      {favoriteId ? 'Saved to favorites' : 'Save to favorites'}
    </button>
  );
}
