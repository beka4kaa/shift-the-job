'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Star, Trash2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminReview, shortAdminDate } from '@/lib/admin';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { void fetch('/api/admin/reviews', { cache: 'no-store' }).then(async (response) => { if (!response.ok) throw new Error(); setReviews(await response.json()); }).catch(() => setError('Could not load reviews.')).finally(() => setLoading(false)); }, []);
  const visible = useMemo(() => reviews.filter((review) => {
    const query = search.toLocaleLowerCase();
    return (!rating || review.rating === rating) && (!query || `${review.student_name} ${review.teacher_name} ${review.comment}`.toLocaleLowerCase().includes(query));
  }), [rating, reviews, search]);
  const remove = async (review: AdminReview) => {
    if (!window.confirm(`Delete this review by ${review.student_name}?`)) return;
    const response = await fetch(`/api/admin/reviews/${review.id}`, { method: 'DELETE' });
    if (response.ok) setReviews((items) => items.filter((item) => item.id !== review.id));
    else setError('Could not remove this review.');
  };

  return (
    <AdminShell>
      <div className="mb-8"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/35">Trust and safety</p><h1 className="text-4xl font-medium tracking-[-0.04em]">Reviews</h1><p className="mt-2 text-sm text-black/45">Inspect feedback and remove abusive or fraudulent content.</p></div>
      <div className="mb-5 flex flex-col gap-3 border border-black/10 bg-[#f5f2e9] p-3 md:flex-row"><label className="flex flex-1 items-center gap-3 border border-black/10 px-3"><Search className="h-4 w-4 text-black/30" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Student, teacher or comment…" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" /></label><select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="border border-black/10 bg-transparent px-4 py-3 text-xs font-semibold outline-none"><option value={0}>ALL RATINGS</option>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} STARS</option>)}</select></div>
      {error && <p className="mb-4 border border-red-700/20 p-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 lg:grid-cols-2">{visible.map((review) => <article key={review.id} className="flex min-h-52 flex-col justify-between border border-black/10 bg-[#f5f2e9] p-6"><div><div className="mb-5 flex items-start justify-between"><div><p className="text-xs text-black/35">{review.student_name} → {review.teacher_name}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-black/30">{shortAdminDate(review.created_at)}</p></div><div className="flex items-center gap-1 text-sm font-semibold"><Star className="h-4 w-4 fill-[#91a838] text-[#91a838]" />{review.rating}</div></div><blockquote className="text-lg leading-7 tracking-[-0.02em]">“{review.comment}”</blockquote></div><button onClick={() => remove(review)} className="mt-6 flex w-fit items-center gap-2 text-xs font-semibold text-red-700/70 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" />Delete review</button></article>)}{!loading && visible.length === 0 && <div className="col-span-full border border-black/10 bg-[#f5f2e9] p-12 text-center text-sm text-black/40">No reviews match this view.</div>}{loading && <div className="col-span-full border border-black/10 bg-[#f5f2e9] p-12 text-center text-sm text-black/40">Loading reviews…</div>}</div>
    </AdminShell>
  );
}
