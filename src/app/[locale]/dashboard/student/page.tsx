'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, CheckCircle, Wallet, Clock } from 'lucide-react';
import Link from 'next/link';
import { DashboardShell } from '@/components/DashboardShell';
import {
  type DashboardBooking,
  isUpcoming,
  isPast,
  formatBookingDate,
  money,
} from '@/lib/bookings';

function BookingCard({ booking, kind }: { booking: DashboardBooking; kind: 'upcoming' | 'past' }) {
  const { date, time } = formatBookingDate(booking.date);
  return (
    <div className="bg-[#f4f1e9] border border-black/10 p-6 flex items-center gap-4">
      {booking.teacher_image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={booking.teacher_image} alt={booking.teacher_name} className="w-12 h-12 object-cover" />
      ) : (
        <div className="w-12 h-12 border border-black/10 flex items-center justify-center text-lg font-medium text-black/40">
          {booking.teacher_name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold">{booking.teacher_name}</span>
          <span className="border border-black/15 text-black/60 px-2 py-0.5 text-xs">{booking.subject}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-black/55">
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{date}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{time}</span>
          <span>{booking.duration} min</span>
          <span>{money(booking.price, booking.currency)}</span>
        </div>
      </div>
      {kind === 'upcoming' ? (
        <span className="border border-[#91a838]/40 text-[#5f6f26] px-3 py-1 text-xs capitalize">
          {booking.status.toLowerCase()}
        </span>
      ) : (
        <span className="border border-black/15 text-black/45 px-3 py-1 text-xs capitalize">
          {booking.status.toLowerCase()}
        </span>
      )}
    </div>
  );
}

export default function StudentDashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] ?? 'there';

  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/bookings', { cache: 'no-store' });
        if (res.ok) setBookings(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter(isPast);
  const completed = bookings.filter((b) => b.status === 'COMPLETED');
  const totalSpent = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + b.price, 0);

  return (
    <DashboardShell role="student">
        <h1 className="text-2xl font-medium tracking-[-0.02em] mb-6">Welcome back, {firstName}! 👋</h1>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 border-l border-t border-black/10 mb-8">
          <div className="border-r border-b border-black/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-black/45" />
              <span className="text-sm text-black/55">Upcoming Lessons</span>
            </div>
            <p className="text-3xl font-medium tracking-[-0.02em]">{loading ? '—' : upcoming.length}</p>
          </div>
          <div className="border-r border-b border-black/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-[#91a838]" />
              <span className="text-sm text-black/55">Completed Lessons</span>
            </div>
            <p className="text-3xl font-medium tracking-[-0.02em]">{loading ? '—' : completed.length}</p>
          </div>
          <div className="border-r border-b border-black/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-5 h-5 text-black/45" />
              <span className="text-sm text-black/55">Total Spent</span>
            </div>
            <p className="text-3xl font-medium tracking-[-0.02em]">{loading ? '—' : money(totalSpent, 'USD')}</p>
          </div>
        </div>

        {/* Upcoming Lessons */}
        <section className="mb-8">
          <h2 className="text-lg font-medium tracking-[-0.02em] mb-4">
            Upcoming Lessons <span className="text-sm text-black/45 font-normal">({upcoming.length})</span>
          </h2>
          <div className="flex flex-col gap-px bg-black/10">
            {upcoming.map((b) => <BookingCard key={b.id} booking={b} kind="upcoming" />)}
            {!loading && upcoming.length === 0 && (
              <p className="text-black/45 text-sm bg-[#f4f1e9] p-6">
                No upcoming lessons.{' '}
                <Link href="/teachers" className="underline decoration-1 underline-offset-4 text-black">
                  Find a tutor
                </Link>{' '}
                to book your first one.
              </p>
            )}
            {loading && <p className="text-black/45 text-sm bg-[#f4f1e9] p-6">Loading your lessons…</p>}
          </div>
        </section>

        {/* Past Lessons */}
        <section className="mb-8">
          <h2 className="text-lg font-medium tracking-[-0.02em] mb-4">
            Past Lessons <span className="text-sm text-black/45 font-normal">({past.length})</span>
          </h2>
          <div className="flex flex-col gap-px bg-black/10">
            {past.map((b) => <BookingCard key={b.id} booking={b} kind="past" />)}
            {!loading && past.length === 0 && (
              <p className="text-black/45 text-sm bg-[#f4f1e9] p-6">No past lessons yet.</p>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link
            href="/teachers"
            className="bg-[#171813] px-6 py-3 text-sm text-white font-medium hover:bg-[#91a838] hover:text-black transition-colors"
          >
            Find a Tutor
          </Link>
        </div>
    </DashboardShell>
  );
}
