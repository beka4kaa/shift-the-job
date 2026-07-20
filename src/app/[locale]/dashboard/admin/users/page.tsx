'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Search, UserCheck, UserX } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminUser, shortAdminDate } from '@/lib/admin';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'ALL' | AdminUser['role']>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetch('/api/admin/users', { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) throw new Error();
      setUsers(await response.json());
    }).catch(() => setError('Could not load users.')).finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => users.filter((user) => {
    const query = search.toLocaleLowerCase();
    return (role === 'ALL' || user.role === role) && (!query || `${user.name} ${user.email}`.toLocaleLowerCase().includes(query));
  }), [role, search, users]);

  const toggleActive = async (user: AdminUser) => {
    setError('');
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !user.is_active }),
    });
    if (response.ok) {
      const updated: AdminUser = await response.json();
      setUsers((items) => items.map((item) => item.id === user.id ? updated : item));
    } else {
      const body = await response.json().catch(() => null) as { non_field_errors?: string[] } | null;
      setError(body?.non_field_errors?.[0] || 'Could not update this account.');
    }
  };

  return (
    <AdminShell>
      <div className="mb-8"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/35">Community</p><h1 className="text-4xl font-medium tracking-[-0.04em]">Users</h1><p className="mt-2 text-sm text-black/45">Search accounts and control access to the marketplace.</p></div>
      <div className="mb-5 flex flex-col gap-3 border border-black/10 bg-[#f5f2e9] p-3 md:flex-row"><label className="flex flex-1 items-center gap-3 border border-black/10 px-3"><Search className="h-4 w-4 text-black/30" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users…" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" /></label><div className="flex gap-1 overflow-x-auto">{(['ALL', 'STUDENT', 'TEACHER', 'ADMIN'] as const).map((item) => <button key={item} onClick={() => setRole(item)} className={`px-4 py-3 text-xs font-semibold ${role === item ? 'bg-black text-white' : 'text-black/45 hover:bg-black/5'}`}>{item}</button>)}</div></div>
      {error && <p className="mb-4 border border-red-700/20 p-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-hidden border border-black/10 bg-[#f5f2e9]"><div className="hidden grid-cols-[2fr_.7fr_.8fr_.8fr_.8fr_auto] gap-4 border-b border-black/10 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/35 lg:grid"><span>User</span><span>Role</span><span>Joined</span><span>Bookings</span><span>Status</span><span>Action</span></div>{visible.map((user) => <div key={user.id} className="grid gap-4 border-b border-black/10 p-5 last:border-0 lg:grid-cols-[2fr_.7fr_.8fr_.8fr_.8fr_auto] lg:items-center"><div className="flex min-w-0 items-center gap-3"><Image src={user.image} alt="" width={42} height={42} unoptimized className="h-10 w-10 rounded-full object-cover" /><div className="min-w-0"><p className="truncate text-sm font-semibold">{user.name}</p><p className="truncate text-xs text-black/40">{user.email}</p></div></div><span className="w-fit border border-black/10 px-2 py-1 text-[10px] font-semibold">{user.role}</span><span className="text-xs text-black/50">{shortAdminDate(user.created_at)}</span><span className="text-sm">{user.role === 'TEACHER' ? user.taught_bookings : user.student_bookings}</span><span className={`flex w-fit items-center gap-1.5 text-xs ${user.is_active ? 'text-[#607020]' : 'text-red-700'}`}>{user.is_active ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}{user.is_active ? 'Active' : 'Blocked'}</span><button onClick={() => toggleActive(user)} className={`border px-3 py-2 text-[10px] font-semibold ${user.is_active ? 'border-red-700/20 text-red-700' : 'border-[#607020]/30 text-[#607020]'}`}>{user.is_active ? 'Block' : 'Restore'}</button></div>)}{!loading && visible.length === 0 && <p className="p-12 text-center text-sm text-black/40">No users match this view.</p>}{loading && <p className="p-12 text-center text-sm text-black/40">Loading users…</p>}</div>
    </AdminShell>
  );
}
