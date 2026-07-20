'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, BookOpen, CircleDollarSign, ShieldCheck, Users, Wallet } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { GrowthBars, RevenueChart } from '@/components/admin/AdminCharts';
import { AdminSummary, adminMoney, shortAdminDate } from '@/lib/admin';

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetch('/api/admin/summary', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        setData(await response.json());
      })
      .catch(() => setError('Could not load administration analytics.'));
  }, []);

  const metrics = data?.metrics;
  const cards = [
    { label: 'Total users', value: metrics?.users ?? 0, detail: `${metrics?.new_users_30d ?? 0} joined in 30 days`, icon: Users },
    { label: 'Teachers', value: metrics?.teachers ?? 0, detail: `${metrics?.verified_teachers ?? 0} verified`, icon: ShieldCheck },
    { label: 'Paid lessons', value: metrics?.paid_bookings ?? 0, detail: `${metrics?.pending_bookings ?? 0} awaiting payment`, icon: BookOpen },
    { label: 'Gross volume', value: adminMoney(metrics?.gross_revenue ?? 0), detail: 'Confirmed and completed', icon: CircleDollarSign },
    { label: 'Platform revenue', value: adminMoney(metrics?.platform_revenue ?? 0), detail: '15% marketplace fee', icon: Wallet },
  ];

  return (
    <AdminShell>
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/35">Control center</p><h1 className="text-4xl font-medium tracking-[-0.04em]">Business overview</h1><p className="mt-3 text-sm text-black/45">Users, learning activity and marketplace revenue in one place.</p></div><Link href="/dashboard/admin/teachers/new" className="inline-flex w-fit items-center gap-2 bg-[#171813] px-5 py-3 text-sm font-semibold text-white hover:bg-[#91a838] hover:text-black">Add teacher <ArrowUpRight className="h-4 w-4" /></Link></div>
      {error && <div className="mb-6 border border-red-700/20 p-4 text-sm text-red-700">{error}</div>}
      <div className="mb-8 grid border-l border-t border-black/10 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, detail, icon: Icon }) => <div key={label} className="border-b border-r border-black/10 bg-[#f5f2e9] p-5"><Icon className="mb-7 h-5 w-5 text-[#728523]" /><p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/35">{label}</p><p className="mt-2 text-3xl font-medium tracking-[-0.04em]">{data ? value : '—'}</p><p className="mt-2 text-xs text-black/40">{detail}</p></div>)}
      </div>

      <div className="mb-8 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section className="border border-black/10 bg-[#f5f2e9] p-6 sm:p-8"><div className="mb-7 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/35">Financial trend</p><h2 className="mt-2 text-xl font-medium">Revenue performance</h2></div><Link href="/dashboard/admin/revenue" className="text-xs font-semibold underline underline-offset-4">Full report</Link></div>{data ? <RevenueChart data={data.trend} /> : <div className="h-72 animate-pulse bg-black/5" />}</section>
        <section className="border border-black/10 bg-[#f5f2e9] p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/35">Acquisition</p><h2 className="mt-2 text-xl font-medium">New users</h2>{data ? <GrowthBars data={data.trend} /> : <div className="mt-8 h-56 animate-pulse bg-black/5" />}<div className="mt-6 grid grid-cols-3 gap-3 border-t border-black/10 pt-5 text-center"><div><strong className="block text-xl">{data?.users_by_role.STUDENT ?? 0}</strong><span className="text-[10px] uppercase tracking-wider text-black/35">Students</span></div><div><strong className="block text-xl">{data?.users_by_role.TEACHER ?? 0}</strong><span className="text-[10px] uppercase tracking-wider text-black/35">Teachers</span></div><div><strong className="block text-xl">{data?.users_by_role.ADMIN ?? 0}</strong><span className="text-[10px] uppercase tracking-wider text-black/35">Admins</span></div></div></section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="border border-black/10 bg-[#f5f2e9]"><div className="flex items-center justify-between border-b border-black/10 p-5"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/35">Performance</p><h2 className="mt-1 text-lg font-medium">Top teachers</h2></div><Link href="/dashboard/admin/teachers" className="text-xs font-semibold underline underline-offset-4">Manage</Link></div><div>{data?.top_teachers.map((teacher, index) => <Link href={`/dashboard/admin/teachers/${teacher.id}`} key={teacher.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-black/10 p-4 last:border-0 hover:bg-black/[.025]"><span className="w-5 text-xs text-black/30">{String(index + 1).padStart(2, '0')}</span><div className="flex min-w-0 items-center gap-3"><Image src={teacher.image} alt="" width={40} height={40} unoptimized className="h-10 w-10 rounded-full object-cover" /><div className="min-w-0"><p className="truncate text-sm font-semibold">{teacher.name}</p><p className="text-xs text-black/40">{teacher.lessons} paid lessons</p></div></div><div className="text-right"><strong className="text-sm">{adminMoney(teacher.earnings)}</strong><p className="text-[10px] text-black/35">teacher earnings</p></div></Link>)}{data && data.top_teachers.length === 0 && <p className="p-8 text-center text-sm text-black/40">Revenue will appear after paid lessons.</p>}</div></section>
        <section className="border border-black/10 bg-[#f5f2e9]"><div className="flex items-center justify-between border-b border-black/10 p-5"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/35">Operations</p><h2 className="mt-1 text-lg font-medium">Recent bookings</h2></div><Link href="/dashboard/admin/bookings" className="text-xs font-semibold underline underline-offset-4">All bookings</Link></div><div>{data?.recent_bookings.map((booking) => <div key={booking.id} className="grid grid-cols-[1fr_auto] gap-4 border-b border-black/10 p-4 last:border-0"><div><p className="text-sm font-semibold">{booking.student_name} <span className="font-normal text-black/30">with</span> {booking.teacher_name}</p><p className="mt-1 text-xs text-black/40">{booking.subject} · {shortAdminDate(booking.date)}</p></div><div className="text-right"><strong className="text-sm">{adminMoney(booking.price, booking.currency)}</strong><p className="mt-1 text-[10px] uppercase tracking-wider text-black/35">{booking.status}</p></div></div>)}{data && data.recent_bookings.length === 0 && <p className="p-8 text-center text-sm text-black/40">No bookings yet.</p>}</div></section>
      </div>
    </AdminShell>
  );
}
