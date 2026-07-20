'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { DashboardShell } from '@/components/DashboardShell';
import { ReviewCard, type ReviewCardData } from '@/components/ReviewCard';

interface Profile { rating: number; review_count: number; reviews: { id: number; student_name: string; student_image: string | null; rating: number; comment: string; created_at: string }[] }

export default function TeacherReviewsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch('/api/profile/teacher', { cache: 'no-store' }).then(async (res) => res.ok ? setProfile(await res.json()) : undefined).finally(() => setLoading(false)); }, []);
  const reviews: ReviewCardData[] = (profile?.reviews ?? []).map((review) => ({ id: String(review.id), studentName: review.student_name, studentImage: review.student_image || '/default-avatar.svg', rating: review.rating, comment: review.comment, date: review.created_at, subject: 'Lesson' }));
  return <DashboardShell role="teacher"><div className="mb-8 flex items-end justify-between"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/40">Feedback</p><h1 className="text-3xl font-medium tracking-[-0.03em]">Reviews</h1></div><div className="flex items-center gap-2 text-xl font-semibold"><Star className="h-5 w-5 fill-[#91a838] text-[#91a838]" />{loading ? '—' : profile?.rating ?? 0}<span className="text-sm font-normal text-black/40">({profile?.review_count ?? 0})</span></div></div>{reviews.length > 0 ? <div className="grid grid-cols-1 border-l border-t border-black/10 lg:grid-cols-2 xl:grid-cols-3">{reviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div> : !loading ? <div className="border border-black/10 p-12 text-center text-black/45">Reviews will appear after completed lessons.</div> : <div className="border border-black/10 p-12 text-center text-black/45">Loading reviews…</div>}</DashboardShell>;
}
