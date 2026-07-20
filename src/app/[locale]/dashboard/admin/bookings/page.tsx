'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, Search, Video } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminBooking, adminMoney, shortAdminDate } from '@/lib/admin';

const STATUSES: AdminBooking['status'][] = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED'];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [meetingLinks, setMeetingLinks] = useState<Record<number, string>>({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | AdminBooking['status']>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetch('/api/admin/bookings', { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) throw new Error();
      const rows: AdminBooking[] = await response.json();
      setBookings(rows);
      setMeetingLinks(Object.fromEntries(rows.map((booking) => [booking.id, booking.meeting_link || ''])));
    }).catch(() => setError('Could not load bookings.')).finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => bookings.filter((booking) => {
    const query = search.toLocaleLowerCase();
    return (status === 'ALL' || booking.status === status) && (!query || `${booking.student_name} ${booking.teacher_name} ${booking.subject}`.toLocaleLowerCase().includes(query));
  }), [bookings, search, status]);

  const updateBooking = async (booking: AdminBooking, payload: Partial<Pick<AdminBooking, 'status' | 'meeting_link'>>) => {
    setError('');
    const response = await fetch(`/api/admin/bookings/${booking.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (response.ok) {
      const updated: AdminBooking = await response.json();
      setBookings((items) => items.map((item) => item.id === booking.id ? updated : item));
      setMeetingLinks((links) => ({ ...links, [booking.id]: updated.meeting_link || '' }));
    } else setError('Could not update this booking.');
  };

  return (
    <AdminShell>
      <div className="mb-8"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/35">Operations</p><h1 className="text-4xl font-medium tracking-[-0.04em]">Bookings</h1><p className="mt-2 text-sm text-black/45">Monitor payments, lesson status and meeting access.</p></div>
      <div className="mb-5 flex flex-col gap-3 border border-black/10 bg-[#f5f2e9] p-3 md:flex-row"><label className="flex flex-1 items-center gap-3 border border-black/10 px-3"><Search className="h-4 w-4 text-black/30" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Student, teacher or subject…" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" /></label><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="border border-black/10 bg-transparent px-4 py-3 text-xs font-semibold outline-none"><option value="ALL">ALL STATUSES</option>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select></div>
      {error && <p className="mb-4 border border-red-700/20 p-3 text-sm text-red-700">{error}</p>}
      <div className="space-y-3">{visible.map((booking) => <article key={booking.id} className="border border-black/10 bg-[#f5f2e9] p-5"><div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr_.6fr_1.3fr] xl:items-center"><div><p className="text-sm font-semibold">{booking.student_name} <span className="font-normal text-black/30">→</span> {booking.teacher_name}</p><p className="mt-1 text-xs text-black/45">{booking.subject} · {booking.duration} minutes</p><p className="mt-2 flex items-center gap-1.5 text-xs text-black/45"><Calendar className="h-3.5 w-3.5" />{shortAdminDate(booking.date)} · {new Date(booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div><div><strong className="text-lg">{adminMoney(booking.price, booking.currency)}</strong><p className="text-xs text-black/35">Fee {adminMoney(booking.platform_fee, booking.currency)}</p></div><select aria-label={`Status for booking ${booking.id}`} value={booking.status} onChange={(event) => updateBooking(booking, { status: event.target.value as AdminBooking['status'] })} className="border border-black/15 bg-transparent px-3 py-2 text-xs font-semibold outline-none">{STATUSES.map((item) => <option key={item}>{item}</option>)}</select><div className="flex gap-2"><label className="flex min-w-0 flex-1 items-center gap-2 border border-black/10 px-3"><Video className="h-4 w-4 shrink-0 text-black/30" /><input aria-label={`Meeting link for booking ${booking.id}`} value={meetingLinks[booking.id] ?? ''} onChange={(event) => setMeetingLinks((items) => ({ ...items, [booking.id]: event.target.value }))} placeholder="Meeting link" className="min-w-0 flex-1 bg-transparent py-2 text-xs outline-none" /></label><button onClick={() => updateBooking(booking, { meeting_link: meetingLinks[booking.id] || null })} className="bg-black px-3 text-xs font-semibold text-white">Save</button></div></div><div className="mt-4 flex items-center justify-between border-t border-black/10 pt-3 text-[10px] uppercase tracking-wider text-black/30"><span>Booking #{booking.id}</span><span>Created {shortAdminDate(booking.created_at)}</span></div></article>)}{!loading && visible.length === 0 && <div className="border border-black/10 bg-[#f5f2e9] p-12 text-center text-sm text-black/40">No bookings match this view.</div>}{loading && <div className="border border-black/10 bg-[#f5f2e9] p-12 text-center text-sm text-black/40">Loading bookings…</div>}</div>
    </AdminShell>
  );
}
