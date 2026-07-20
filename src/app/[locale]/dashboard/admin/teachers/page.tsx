'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowUpRight, BadgeCheck, Search, Star, Users } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminTeacher, adminMoney } from '@/lib/admin';

type TeacherFilter = 'all' | 'pending' | 'verified' | 'featured' | 'inactive';
const FILTERS: readonly TeacherFilter[] = ['all', 'pending', 'verified', 'featured', 'inactive'];

export default function AdminTeachersPage() {
  const initialFilter = useSearchParams().get('state');
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TeacherFilter>(
    FILTERS.includes(initialFilter as TeacherFilter) ? (initialFilter as TeacherFilter) : 'all',
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetch('/api/admin/teachers', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        setTeachers(await response.json());
      })
      .catch(() => setError('Could not load teachers.'))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => teachers.filter((teacher) => {
    const query = search.toLocaleLowerCase();
    const matches = !query || `${teacher.name} ${teacher.email} ${teacher.headline} ${teacher.subjects.join(' ')}`.toLocaleLowerCase().includes(query);
    const state = filter === 'all' || (filter === 'pending' && !teacher.verified && teacher.is_active) || (filter === 'verified' && teacher.verified) || (filter === 'featured' && teacher.featured) || (filter === 'inactive' && !teacher.is_active);
    return matches && state;
  }), [filter, search, teachers]);

  const toggle = async (teacher: AdminTeacher, field: 'verified' | 'featured' | 'is_active') => {
    const response = await fetch(`/api/admin/teachers/${teacher.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: !teacher[field] }),
    });
    if (response.ok) {
      const updated: AdminTeacher = await response.json();
      setTeachers((items) => items.map((item) => item.id === teacher.id ? updated : item));
    } else setError('Could not update this teacher.');
  };

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/35">Supply</p><h1 className="text-4xl font-medium tracking-[-0.04em]">Teachers</h1><p className="mt-2 text-sm text-black/45">Create, verify and monitor every teaching profile.</p></div><Link href="/dashboard/admin/teachers/new" className="inline-flex w-fit items-center gap-2 bg-[#171813] px-5 py-3 text-sm font-semibold text-white hover:bg-[#91a838] hover:text-black">Add teacher <ArrowUpRight className="h-4 w-4" /></Link></div>
      <div className="mb-5 flex flex-col gap-3 border border-black/10 bg-[#f5f2e9] p-3 md:flex-row md:items-center"><label className="flex flex-1 items-center gap-3 border border-black/10 px-3"><Search className="h-4 w-4 text-black/30" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, subject…" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" /></label><div className="flex gap-1 overflow-x-auto">{FILTERS.map((item) => { const count = item === 'pending' ? teachers.filter((t) => !t.verified && t.is_active).length : 0; return <button key={item} onClick={() => setFilter(item)} className={`shrink-0 px-4 py-3 text-xs font-semibold capitalize ${filter === item ? 'bg-[#171813] text-white' : 'text-black/45 hover:bg-black/5'}`}>{item}{item === 'pending' && count > 0 && <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${filter === item ? 'bg-white/20' : 'bg-[#dceaa8] text-[#4b5a1e]'}`}>{count}</span>}</button>; })}</div></div>
      {error && <p className="mb-4 border border-red-700/20 p-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-hidden border border-black/10 bg-[#f5f2e9]">
        <div className="hidden grid-cols-[2fr_1.2fr_.8fr_.8fr_1fr_auto] gap-4 border-b border-black/10 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/35 lg:grid"><span>Teacher</span><span>Subjects</span><span>Students</span><span>Rating</span><span>Earnings</span><span>Controls</span></div>
        {visible.map((teacher) => <div key={teacher.id} className="grid gap-4 border-b border-black/10 p-5 last:border-0 lg:grid-cols-[2fr_1.2fr_.8fr_.8fr_1fr_auto] lg:items-center"><div className="flex min-w-0 items-center gap-3"><Image src={teacher.image} alt="" width={48} height={48} unoptimized className="h-12 w-12 rounded-full object-cover" /><div className="min-w-0"><Link href={`/dashboard/admin/teachers/${teacher.id}`} className="flex items-center gap-1.5 truncate text-sm font-semibold hover:underline">{teacher.name}{teacher.verified && <BadgeCheck className="h-4 w-4 text-[#728523]" />}</Link><p className="truncate text-xs text-black/40">{teacher.email}</p><p className="mt-1 truncate text-xs text-black/55">{teacher.headline || 'Profile is incomplete'}</p></div></div><div className="flex flex-wrap gap-1">{teacher.subjects.slice(0, 3).map((subject) => <span key={subject} className="bg-black/5 px-2 py-1 text-[10px] text-black/55">{subject}</span>)}</div><div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-black/30" />{teacher.student_count}</div><div className="flex items-center gap-2 text-sm"><Star className="h-4 w-4 text-[#728523]" />{teacher.average_rating}</div><div><strong className="text-sm">{adminMoney(teacher.teacher_earnings, teacher.currency)}</strong><p className="text-[10px] text-black/35">{teacher.booking_count} paid lessons</p></div><div className="flex gap-2 lg:justify-end"><button onClick={() => toggle(teacher, 'verified')} className={`border px-3 py-2 text-[10px] font-semibold ${teacher.verified ? 'border-[#728523] bg-[#dceaa8]' : 'border-black/10 text-black/45'}`}>Verified</button><button onClick={() => toggle(teacher, 'featured')} className={`border px-3 py-2 text-[10px] font-semibold ${teacher.featured ? 'border-black bg-black text-white' : 'border-black/10 text-black/45'}`}>Featured</button><Link href={`/dashboard/admin/teachers/${teacher.id}`} className="border border-black/10 px-3 py-2 text-[10px] font-semibold">Edit</Link></div></div>)}
        {!loading && visible.length === 0 && <p className="p-12 text-center text-sm text-black/40">No teachers match this view.</p>}
        {loading && <p className="p-12 text-center text-sm text-black/40">Loading teachers…</p>}
      </div>
    </AdminShell>
  );
}
