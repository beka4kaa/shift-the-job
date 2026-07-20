'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock } from 'lucide-react';
import { DashboardShell } from '@/components/DashboardShell';
import { type DashboardBooking, formatBookingDate, isPast, isUpcoming, money } from '@/lib/bookings';

type Filter = 'all' | 'upcoming' | 'past' | 'cancelled';

export default function StudentBookingsPage() {
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    fetch('/api/bookings', { cache: 'no-store' })
      .then(async (res) => res.ok ? setBookings(await res.json()) : undefined)
      .finally(() => setLoading(false));
  }, []);

  const visible = bookings.filter((booking) => {
    if (filter === 'upcoming') return isUpcoming(booking);
    if (filter === 'past') return isPast(booking);
    if (filter === 'cancelled') return booking.status === 'CANCELLED' || booking.status === 'REFUNDED';
    return true;
  });

  return (
    <DashboardShell role="student">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/40">Learning</p><h1 className="text-3xl font-medium tracking-[-0.03em]">My bookings</h1></div>
        <Link href="/teachers" className="w-fit bg-[#171813] px-5 py-3 text-sm font-semibold text-white">Find a tutor</Link>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {(['all', 'upcoming', 'past', 'cancelled'] as Filter[]).map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={`border px-4 py-2 text-sm capitalize ${filter === item ? 'border-black bg-black text-white' : 'border-black/15 text-black/55'}`}>{item}</button>
        ))}
      </div>
      <div className="space-y-3">
        {visible.map((booking) => {
          const { date, time } = formatBookingDate(booking.date);
          return (
            <article key={booking.id} className="grid gap-5 border border-black/10 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={booking.teacher_image || '/default-avatar.svg'} alt={booking.teacher_name} className="h-14 w-14 rounded-full object-cover" />
              <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{booking.teacher_name}</h2><span className="border border-black/15 px-2 py-0.5 text-xs text-black/55">{booking.subject}</span></div><div className="mt-2 flex flex-wrap gap-4 text-sm text-black/50"><span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{date}</span><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{time}</span><span>{booking.duration} min</span></div></div>
              <div className="sm:text-right"><p className="font-semibold">{money(booking.price, booking.currency)}</p><p className="mt-1 text-xs capitalize text-black/45">{booking.status.toLowerCase()}</p></div>
            </article>
          );
        })}
        {!loading && visible.length === 0 && <div className="border border-black/10 p-12 text-center text-black/45">No bookings in this section yet.</div>}
        {loading && <div className="border border-black/10 p-12 text-center text-black/45">Loading bookings…</div>}
      </div>
    </DashboardShell>
  );
}
