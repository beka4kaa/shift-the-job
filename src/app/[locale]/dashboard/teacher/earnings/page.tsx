'use client';

import { useEffect, useState } from 'react';
import { CreditCard, TrendingUp, Wallet } from 'lucide-react';
import { DashboardShell } from '@/components/DashboardShell';
import { type DashboardBooking, formatBookingDate, money } from '@/lib/bookings';

export default function TeacherEarningsPage() {
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch('/api/bookings?role=teacher', { cache: 'no-store' }).then(async (res) => res.ok ? setBookings(await res.json()) : undefined).finally(() => setLoading(false)); }, []);
  const paid = bookings.filter((booking) => booking.status === 'CONFIRMED' || booking.status === 'COMPLETED');
  const take = (booking: DashboardBooking) => booking.price * 0.85;
  const total = paid.reduce((sum, booking) => sum + take(booking), 0);
  const pending = bookings.filter((booking) => booking.status === 'PENDING').reduce((sum, booking) => sum + take(booking), 0);
  const month = new Date();
  const thisMonth = paid.filter((booking) => { const date = new Date(booking.date); return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear(); }).reduce((sum, booking) => sum + take(booking), 0);
  return <DashboardShell role="teacher"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/40">Payments</p><h1 className="mb-8 text-3xl font-medium tracking-[-0.03em]">Earnings</h1><div className="mb-10 grid border-l border-t border-black/10 sm:grid-cols-3">{[[TrendingUp, 'This month', thisMonth], [Wallet, 'Total earnings', total], [CreditCard, 'Pending', pending]].map(([Icon, label, value]) => { const Component = Icon as typeof TrendingUp; return <div key={label as string} className="border-b border-r border-black/10 p-6"><Component className="mb-4 h-5 w-5 text-[#91a838]" /><p className="text-sm text-black/45">{label as string}</p><p className="mt-1 text-3xl font-medium">{loading ? '—' : money(value as number, 'USD')}</p></div>; })}</div><h2 className="mb-4 text-lg font-medium">Transactions</h2><div className="space-y-2">{paid.map((booking) => <div key={booking.id} className="grid gap-3 border border-black/10 p-4 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-semibold">{booking.student_name}</p><p className="text-black/45">{booking.subject} · {formatBookingDate(booking.date).date}</p></div><span className="text-black/45">Platform fee −15%</span><strong>{money(take(booking), booking.currency)}</strong></div>)}{!loading && paid.length === 0 && <div className="border border-black/10 p-10 text-center text-black/45">Completed and confirmed lesson payments will appear here.</div>}</div></DashboardShell>;
}
