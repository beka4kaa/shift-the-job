'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminTeacher, readAdminError } from '@/lib/admin';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const input = 'w-full border border-black/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-black/45';
const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-black/45';

interface TeacherFormState {
  email: string; name: string; password: string; is_active: boolean; headline: string; bio: string;
  hourly_rate: number; currency: string; experience: number; country: string; city: string; timezone: string;
  verified: boolean; featured: boolean; subjects: string; languages: string; availability: string[];
}

const empty: TeacherFormState = {
  email: '', name: '', password: '', is_active: true, headline: '', bio: '', hourly_rate: 0,
  currency: 'USD', experience: 0, country: '', city: '', timezone: 'UTC', verified: false,
  featured: false, subjects: '', languages: '', availability: [],
};

export function AdminTeacherForm({ teacherId }: { teacherId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<TeacherFormState>(empty);
  const [loading, setLoading] = useState(Boolean(teacherId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!teacherId) return;
    void fetch(`/api/admin/teachers/${teacherId}`, { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) throw new Error();
      const teacher: AdminTeacher = await response.json();
      setForm({
        email: teacher.email, name: teacher.name, password: '', is_active: teacher.is_active,
        headline: teacher.headline, bio: teacher.bio, hourly_rate: teacher.hourly_rate,
        currency: teacher.currency, experience: teacher.experience, country: teacher.country,
        city: teacher.city, timezone: teacher.timezone, verified: teacher.verified,
        featured: teacher.featured, subjects: teacher.subjects.join(', '),
        languages: teacher.languages.join(', '), availability: teacher.availability,
      });
    }).catch(() => setError('Could not load this teacher.')).finally(() => setLoading(false));
  }, [teacherId]);

  const update = <K extends keyof TeacherFormState>(key: K, value: TeacherFormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const toggleDay = (day: string) => setForm((current) => ({
    ...current,
    availability: current.availability.includes(day)
      ? current.availability.filter((item) => item !== day)
      : [...current.availability, day],
  }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      password: form.password || undefined,
      subjects: form.subjects.split(',').map((value) => value.trim()).filter(Boolean),
      languages: form.languages.split(',').map((value) => value.trim()).filter(Boolean),
    };
    const response = await fetch(`/api/admin/teachers${teacherId ? `/${teacherId}` : ''}`, {
      method: teacherId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setError(await readAdminError(response, 'Could not save this teacher.'));
      setSaving(false);
      return;
    }
    router.push('/dashboard/admin/teachers');
    router.refresh();
  };

  const deactivate = async () => {
    if (!teacherId || !window.confirm('Deactivate this teacher account? Existing records will be preserved.')) return;
    const response = await fetch(`/api/admin/teachers/${teacherId}`, { method: 'DELETE' });
    if (response.ok) router.push('/dashboard/admin/teachers');
    else setError('Could not deactivate this teacher.');
  };

  return (
    <AdminShell>
      <Link href="/dashboard/admin/teachers" className="mb-7 inline-flex items-center gap-2 text-xs font-semibold text-black/45 hover:text-black"><ArrowLeft className="h-4 w-4" />Back to teachers</Link>
      <div className="mb-8"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/35">Teacher management</p><h1 className="text-4xl font-medium tracking-[-0.04em]">{teacherId ? 'Edit teacher' : 'Add teacher'}</h1><p className="mt-2 text-sm text-black/45">Account access, public profile, pricing and marketplace visibility.</p></div>
      {error && <p className="mb-5 border border-red-700/20 p-4 text-sm text-red-700">{error}</p>}
      {loading ? <div className="h-96 animate-pulse bg-black/5" /> : <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-6">
          <section className="border border-black/10 bg-[#f5f2e9] p-6"><h2 className="mb-5 text-lg font-medium">Account</h2><div className="grid gap-4 sm:grid-cols-2"><div><label className={label}>Full name</label><input aria-label="Full name" className={input} value={form.name} onChange={(event) => update('name', event.target.value)} required /></div><div><label className={label}>Email</label><input aria-label="Email" type="email" className={input} value={form.email} onChange={(event) => update('email', event.target.value)} required /></div><div className="sm:col-span-2"><label className={label}>{teacherId ? 'New password (optional)' : 'Initial password (optional for Google login)'}</label><input aria-label="Initial password" type="password" minLength={8} className={input} value={form.password} onChange={(event) => update('password', event.target.value)} placeholder="At least 8 characters" /></div></div></section>
          <section className="border border-black/10 bg-[#f5f2e9] p-6"><h2 className="mb-5 text-lg font-medium">Public profile</h2><div className="space-y-4"><div><label className={label}>Headline</label><input aria-label="Headline" className={input} value={form.headline} onChange={(event) => update('headline', event.target.value)} /></div><div><label className={label}>About</label><textarea aria-label="About" className={`${input} min-h-32 resize-y`} value={form.bio} onChange={(event) => update('bio', event.target.value)} /></div><div className="grid gap-4 sm:grid-cols-2"><div><label className={label}>Subjects, comma-separated</label><input aria-label="Subjects" className={input} value={form.subjects} onChange={(event) => update('subjects', event.target.value)} placeholder="Mathematics, Algebra" /></div><div><label className={label}>Languages, comma-separated</label><input aria-label="Languages" className={input} value={form.languages} onChange={(event) => update('languages', event.target.value)} placeholder="English, Russian" /></div></div><div className="grid gap-4 sm:grid-cols-3"><div><label className={label}>Experience</label><input aria-label="Experience" type="number" min={0} className={input} value={form.experience} onChange={(event) => update('experience', Number(event.target.value))} /></div><div><label className={label}>Country</label><input aria-label="Country" className={input} value={form.country} onChange={(event) => update('country', event.target.value)} /></div><div><label className={label}>City</label><input aria-label="City" className={input} value={form.city} onChange={(event) => update('city', event.target.value)} /></div></div></div></section>
        </div>
        <div className="space-y-6">
          <section className="border border-black/10 bg-[#f5f2e9] p-6"><h2 className="mb-5 text-lg font-medium">Commercial settings</h2><div className="grid grid-cols-2 gap-4"><div><label className={label}>Hourly rate</label><input aria-label="Hourly rate" type="number" min={0} step="0.01" className={input} value={form.hourly_rate} onChange={(event) => update('hourly_rate', Number(event.target.value))} /></div><div><label className={label}>Currency</label><select aria-label="Currency" className={input} value={form.currency} onChange={(event) => update('currency', event.target.value)}>{['USD', 'EUR', 'GBP', 'KZT'].map((currency) => <option key={currency}>{currency}</option>)}</select></div></div><div className="mt-4"><label className={label}>Timezone</label><input aria-label="Timezone" className={input} value={form.timezone} onChange={(event) => update('timezone', event.target.value)} placeholder="UTC" /></div></section>
          <section className="border border-black/10 bg-[#f5f2e9] p-6"><h2 className="mb-5 text-lg font-medium">Availability</h2><div className="flex flex-wrap gap-2">{DAYS.map((day) => <button type="button" key={day} onClick={() => toggleDay(day)} className={`border px-3 py-2 text-xs font-semibold ${form.availability.includes(day) ? 'border-black bg-black text-white' : 'border-black/15 text-black/45'}`}>{day}</button>)}</div></section>
          <section className="border border-black/10 bg-[#f5f2e9] p-6"><h2 className="mb-5 text-lg font-medium">Marketplace controls</h2><div className="space-y-3">{([['is_active', 'Account active'], ['verified', 'Verified profile'], ['featured', 'Featured placement']] as const).map(([field, text]) => <label key={field} className="flex cursor-pointer items-center justify-between border border-black/10 p-4 text-sm"><span>{text}</span><input type="checkbox" checked={form[field]} onChange={(event) => update(field, event.target.checked)} className="h-4 w-4" /></label>)}</div></section>
          <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 bg-[#171813] px-5 py-4 text-sm font-semibold text-white hover:bg-[#91a838] hover:text-black disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Saving…' : teacherId ? 'Save changes' : 'Create teacher'}</button>
          {teacherId && <button type="button" onClick={deactivate} className="flex w-full items-center justify-center gap-2 border border-red-700/20 px-5 py-3 text-xs font-semibold text-red-700 hover:bg-red-700 hover:text-white"><Trash2 className="h-4 w-4" />Deactivate account</button>}
        </div>
      </form>}
    </AdminShell>
  );
}
