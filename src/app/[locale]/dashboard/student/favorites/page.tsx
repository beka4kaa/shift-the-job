'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { DashboardShell } from '@/components/DashboardShell';
import { TeacherCard } from '@/components/TeacherCard';
import { djangoTeacherToProfileView, type DjangoTeacherRow } from '@/lib/teacher-profile';

interface FavoriteRow { id: number; teacher: DjangoTeacherRow }

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => fetch('/api/favorites', { cache: 'no-store' })
    .then(async (res) => res.ok ? setFavorites(await res.json()) : undefined)
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const remove = async (id: number) => {
    const res = await fetch(`/api/favorites?id=${id}`, { method: 'DELETE' });
    if (res.ok) setFavorites((items) => items.filter((item) => item.id !== id));
  };

  return (
    <DashboardShell role="student">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/40">Saved</p>
      <h1 className="mb-8 text-3xl font-medium tracking-[-0.03em]">Favorite tutors</h1>
      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 gap-px bg-black/10 lg:grid-cols-2 xl:grid-cols-3">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="bg-[#171813] pb-4">
              <TeacherCard teacher={djangoTeacherToProfileView(favorite.teacher)} />
              <button onClick={() => remove(favorite.id)} className="mx-5 flex items-center gap-2 text-xs text-white/45 hover:text-white"><Heart className="h-3.5 w-3.5 fill-current" />Remove from favorites</button>
            </div>
          ))}
        </div>
      ) : !loading ? (
        <div className="border border-black/10 p-12 text-center"><Heart className="mx-auto mb-4 h-8 w-8 text-black/25" /><p className="text-black/50">You haven’t saved any tutors yet.</p><Link href="/teachers" className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">Browse tutors</Link></div>
      ) : <div className="border border-black/10 p-12 text-center text-black/45">Loading favorites…</div>}
    </DashboardShell>
  );
}
