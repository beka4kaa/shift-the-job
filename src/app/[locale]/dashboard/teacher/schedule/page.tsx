'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, Video } from 'lucide-react';
import { DashboardShell } from '@/components/DashboardShell';
import { type DashboardBooking, formatBookingDate, isPast, isUpcoming } from '@/lib/bookings';

export default function TeacherSchedulePage() {
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch('/api/bookings?role=teacher', { cache: 'no-store' }).then(async (res) => res.ok ? setBookings(await res.json()) : undefined).finally(() => setLoading(false)); }, []);
  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter(isPast);

  const section = (title: string, items: DashboardBooking[]) => <section className="mb-10"><h2 className="mb-4 text-lg font-medium">{title} <span className="text-sm text-black/40">({items.length})</span></h2><div className="space-y-3">{items.map((booking) => { const { date, time } = formatBookingDate(booking.date); return <article key={booking.id} className="grid gap-5 border border-black/10 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center"><img src={booking.student_image || '/default-avatar.svg'} alt={booking.student_name} className="h-12 w-12 rounded-full object-cover" /><div><p className="font-semibold">{booking.student_name}</p><p className="mt-1 text-sm text-black/50">{booking.subject} · {booking.duration} min</p></div><div className="text-sm text-black/55 sm:text-right"><p className="flex items-center gap-1 sm:justify-end"><Calendar className="h-3.5 w-3.5" />{date}</p><p className="mt-1 flex items-center gap-1 sm:justify-end"><Clock className="h-3.5 w-3.5" />{time}</p>{booking.status === 'CONFIRMED' && <span className="mt-2 inline-flex items-center gap-1 text-xs text-[#5f6f26]"><Video className="h-3.5 w-3.5" />Ready</span>}</div></article>; })}{!loading && items.length === 0 && <div className="border border-black/10 p-8 text-sm text-black/45">Nothing scheduled here yet.</div>}</div></section>;

  return <DashboardShell role="teacher"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/40">Calendar</p><h1 className="mb-8 text-3xl font-medium tracking-[-0.03em]">Schedule</h1>{section('Upcoming lessons', upcoming)}{section('Past lessons', past)}</DashboardShell>;
}
