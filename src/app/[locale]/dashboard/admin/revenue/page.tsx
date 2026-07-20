'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BadgeDollarSign, CircleCheck, Landmark, WalletCards } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminRevenueRow, adminMoney } from '@/lib/admin';

export default function AdminRevenuePage() {
  const [rows, setRows] = useState<AdminRevenueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { void fetch('/api/admin/revenue', { cache: 'no-store' }).then(async (response) => { if (!response.ok) throw new Error(); setRows(await response.json()); }).catch(() => setError('Could not load revenue data.')).finally(() => setLoading(false)); }, []);
  const totals = useMemo(() => {
    const values = new Map<string, { gross: number; platform: number; earnings: number }>();
    for (const row of rows) {
      const current = values.get(row.currency) ?? { gross: 0, platform: 0, earnings: 0 };
      current.gross += row.gross; current.platform += row.platform; current.earnings += row.earnings;
      values.set(row.currency, current);
    }
    return [...values.entries()];
  }, [rows]);
  const maxGross = Math.max(...rows.map((row) => row.gross), 1);

  return (
    <AdminShell>
      <div className="mb-8"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/35">Finance</p><h1 className="text-4xl font-medium tracking-[-0.04em]">Revenue</h1><p className="mt-2 text-sm text-black/45">Gross lesson volume, platform fee and teacher earnings by currency.</p></div>
      {error && <p className="mb-4 border border-red-700/20 p-3 text-sm text-red-700">{error}</p>}
      <div className="mb-7 grid gap-px bg-black/10 md:grid-cols-3"><div className="bg-[#f5f2e9] p-6"><BadgeDollarSign className="mb-6 h-5 w-5 text-[#728523]" /><p className="text-xs uppercase tracking-wider text-black/35">Gross volume</p>{totals.map(([currency, total]) => <p key={currency} className="mt-2 text-2xl font-medium">{adminMoney(total.gross, currency)}</p>)}</div><div className="bg-[#f5f2e9] p-6"><Landmark className="mb-6 h-5 w-5 text-[#728523]" /><p className="text-xs uppercase tracking-wider text-black/35">Platform revenue</p>{totals.map(([currency, total]) => <p key={currency} className="mt-2 text-2xl font-medium">{adminMoney(total.platform, currency)}</p>)}</div><div className="bg-[#f5f2e9] p-6"><WalletCards className="mb-6 h-5 w-5 text-[#728523]" /><p className="text-xs uppercase tracking-wider text-black/35">Teacher earnings</p>{totals.map(([currency, total]) => <p key={currency} className="mt-2 text-2xl font-medium">{adminMoney(total.earnings, currency)}</p>)}</div></div>
      <section className="border border-black/10 bg-[#f5f2e9]"><div className="border-b border-black/10 p-5"><h2 className="text-lg font-medium">Teacher profitability</h2><p className="mt-1 text-xs text-black/40">Paid lessons only. Width represents relative gross volume.</p></div><div>{rows.map((row) => <div key={row.teacher_id} className="grid gap-4 border-b border-black/10 p-5 last:border-0 lg:grid-cols-[1.5fr_1fr_.7fr_.8fr_.8fr] lg:items-center"><div><Link href={`/dashboard/admin/teachers/${row.teacher_id}`} className="text-sm font-semibold hover:underline">{row.name}</Link><p className="text-xs text-black/40">{row.email}</p><div className="mt-3 h-1.5 bg-black/5"><div className="h-full bg-[#91a838]" style={{ width: `${(row.gross / maxGross) * 100}%` }} /></div></div><div><p className="text-xs text-black/35">Gross</p><strong>{adminMoney(row.gross, row.currency)}</strong></div><div><p className="text-xs text-black/35">Lessons</p><strong>{row.lessons}</strong></div><div><p className="text-xs text-black/35">Platform</p><strong>{adminMoney(row.platform, row.currency)}</strong></div><div><p className="text-xs text-black/35">Payout setup</p><span className={`mt-1 inline-flex items-center gap-1 text-xs ${row.payouts_ready ? 'text-[#607020]' : 'text-amber-700'}`}><CircleCheck className="h-3.5 w-3.5" />{row.payouts_ready ? 'Ready' : 'Required'}</span></div></div>)}{!loading && rows.length === 0 && <p className="p-12 text-center text-sm text-black/40">Revenue will appear after paid bookings.</p>}{loading && <p className="p-12 text-center text-sm text-black/40">Loading revenue…</p>}</div></section>
    </AdminShell>
  );
}
