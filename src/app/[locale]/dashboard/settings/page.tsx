'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { DashboardShell } from '@/components/DashboardShell';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DEFAULT_AVATAR = '/default-avatar.svg';

interface Account {
  email: string;
  name: string;
  image: string | null;
  role: string;
}

interface TeacherProfile {
  headline: string;
  bio: string;
  hourly_rate: number;
  currency: string;
  experience: number;
  country: string;
  city: string;
  subjects: string[];
  languages: string[];
  availability: string[];
}

const inputClass =
  'w-full bg-transparent border border-black/15 px-4 py-3 placeholder:text-black/35 focus:outline-none focus:border-black/40';
const labelClass = 'block text-sm font-medium text-black/60 mb-1';

export default function SettingsPage() {
  const { update: updateSession } = useSession();
  const [account, setAccount] = useState<Account | null>(null);
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [accountMsg, setAccountMsg] = useState('');
  const [teacherMsg, setTeacherMsg] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const accRes = await fetch('/api/profile/account', { cache: 'no-store' });
        if (accRes.ok) {
          const acc: Account = await accRes.json();
          setAccount(acc);
          if (acc.role === 'TEACHER') {
            const tRes = await fetch('/api/profile/teacher', { cache: 'no-store' });
            if (tRes.ok) setTeacher(await tRes.json());
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const chooseAvatar = async (file?: File) => {
    setAccountMsg('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAccountMsg('Use a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAccountMsg('Image must be 5 MB or smaller.');
      return;
    }
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setAvatarUploading(true);

    const formData = new FormData();
    formData.set('avatar', file);
    try {
      const response = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { avatar?: string[] } | null;
        setAccountMsg(error?.avatar?.[0] || 'Could not upload this image.');
        setAvatarPreview(null);
        return;
      }
      const updatedAccount: Account = await response.json();
      setAccount(updatedAccount);
      await updateSession({ user: { name: updatedAccount.name, image: updatedAccount.image } });
      setAvatarPreview(null);
      setAccountMsg('Photo updated');
    } catch {
      setAvatarPreview(null);
      setAccountMsg('Could not upload this image. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    setSavingAccount(true);
    setAccountMsg('');
    const res = await fetch('/api/profile/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: account.name }),
    });
    if (!res.ok) {
      setAccountMsg('Could not save — check your input.');
      setSavingAccount(false);
      return;
    }

    const updatedAccount: Account = await res.json();
    setAccount(updatedAccount);
    await updateSession({ user: { name: updatedAccount.name, image: updatedAccount.image } });
    setAccountMsg('Saved');
    setSavingAccount(false);
  };

  const saveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;
    setSavingTeacher(true);
    setTeacherMsg('');
    const res = await fetch('/api/profile/teacher', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        headline: teacher.headline,
        bio: teacher.bio,
        hourly_rate: Number(teacher.hourly_rate) || 0,
        currency: teacher.currency || 'USD',
        experience: Number(teacher.experience) || 0,
        country: teacher.country,
        city: teacher.city,
        subjects: teacher.subjects.map((s) => s.trim()).filter(Boolean),
        languages: teacher.languages.map((s) => s.trim()).filter(Boolean),
        availability: teacher.availability,
      }),
    });
    setTeacherMsg(res.ok ? 'Saved' : 'Could not save — check your input.');
    setSavingTeacher(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f1e9] text-[#171813] flex items-center justify-center">
        <p className="text-black/50">Loading your settings…</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-[#f4f1e9] text-[#171813] flex items-center justify-center px-5">
        <div className="text-center">
          <h1 className="text-2xl font-medium tracking-[-0.02em] mb-4">Please sign in</h1>
          <Link href="/auth/login" className="text-sm font-semibold underline decoration-1 underline-offset-4">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl pb-16">
        <h1 className="text-3xl font-medium tracking-[-0.03em] mb-2">Settings</h1>
        <p className="text-black/55 mb-10">Manage your account and public profile.</p>

        {/* Account */}
        <form onSubmit={saveAccount} className="border border-black/10 p-8 mb-8">
          <h2 className="text-xl font-medium tracking-[-0.02em] mb-6">Account</h2>

          <div className="flex items-center gap-4 mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarPreview || account.image || DEFAULT_AVATAR}
              alt={account.name}
              className="w-20 h-20 object-cover border border-black/10"
              onError={(event) => {
                if (!event.currentTarget.src.endsWith(DEFAULT_AVATAR)) {
                  event.currentTarget.src = DEFAULT_AVATAR;
                }
              }}
            />
            <div className="text-sm text-black/55 flex-1">
              <p className="font-medium text-black/70">{account.email}</p>
              <p className="uppercase tracking-[0.14em] text-xs mt-1">{account.role}</p>
              <label className={`mt-3 inline-flex items-center gap-2 border border-black/15 px-3 py-2 text-xs font-semibold transition-colors ${avatarUploading ? 'cursor-wait opacity-50' : 'cursor-pointer text-black hover:bg-black hover:text-white'}`}>
                <Camera className="h-3.5 w-3.5" />
                {avatarUploading ? 'Uploading…' : 'Choose photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={avatarUploading}
                  onChange={(event) => {
                    void chooseAvatar(event.target.files?.[0]);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
              <p className="mt-2 text-xs text-black/35">JPG, PNG or WebP · up to 5 MB</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Full name</label>
              <input
                className={inputClass}
                value={account.name}
                onChange={(e) => setAccount({ ...account, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <button
              type="submit"
              disabled={savingAccount}
              className="py-3 px-6 bg-[#171813] text-white font-semibold hover:bg-[#91a838] hover:text-black transition-colors disabled:opacity-50"
            >
              {savingAccount ? 'Saving…' : 'Save account'}
            </button>
            {accountMsg && <span className="text-sm text-black/55">{accountMsg}</span>}
          </div>
        </form>

        {/* Teacher profile */}
        {account.role === 'TEACHER' && teacher && (
          <form onSubmit={saveTeacher} className="border border-black/10 p-8">
            <h2 className="text-xl font-medium tracking-[-0.02em] mb-2">Teaching profile</h2>
            <p className="text-sm text-black/55 mb-6">This is what students see on your public profile.</p>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Headline</label>
                <input
                  className={inputClass}
                  placeholder="e.g. IELTS Coach | 8 Years | Band 8.5"
                  value={teacher.headline}
                  onChange={(e) => setTeacher({ ...teacher, headline: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>About you</label>
                <textarea
                  className={`${inputClass} min-h-32 resize-y`}
                  placeholder="Tell students how you teach and who you help."
                  value={teacher.bio}
                  onChange={(e) => setTeacher({ ...teacher, bio: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Hourly rate</label>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    value={teacher.hourly_rate}
                    onChange={(e) => setTeacher({ ...teacher, hourly_rate: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Currency</label>
                  <select
                    className={inputClass}
                    value={teacher.currency}
                    onChange={(e) => setTeacher({ ...teacher, currency: e.target.value })}
                  >
                    {['USD', 'EUR', 'GBP', 'KZT'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Years of experience</label>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    value={teacher.experience}
                    onChange={(e) => setTeacher({ ...teacher, experience: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input
                    className={inputClass}
                    value={teacher.country}
                    onChange={(e) => setTeacher({ ...teacher, country: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>City</label>
                <input
                  className={inputClass}
                  value={teacher.city}
                  onChange={(e) => setTeacher({ ...teacher, city: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Subjects <span className="text-black/35">(comma-separated)</span></label>
                <input
                  className={inputClass}
                  placeholder="IELTS, English, TOEFL"
                  value={teacher.subjects.join(', ')}
                  onChange={(e) => setTeacher({ ...teacher, subjects: e.target.value.split(',') })}
                />
              </div>

              <div>
                <label className={labelClass}>Languages <span className="text-black/35">(comma-separated)</span></label>
                <input
                  className={inputClass}
                  placeholder="English, Russian, Kazakh"
                  value={teacher.languages.join(', ')}
                  onChange={(e) => setTeacher({ ...teacher, languages: e.target.value.split(',') })}
                />
              </div>

              <div>
                <label className={labelClass}>Available days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => {
                    const on = teacher.availability.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          setTeacher({
                            ...teacher,
                            availability: on
                              ? teacher.availability.filter((d) => d !== day)
                              : [...teacher.availability, day],
                          })
                        }
                        className={`px-4 py-2 text-sm font-medium border transition-colors ${
                          on
                            ? 'bg-[#171813] text-white border-[#171813]'
                            : 'bg-transparent text-black/50 border-black/15 hover:border-black/30'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <button
                type="submit"
                disabled={savingTeacher}
                className="py-3 px-6 bg-[#171813] text-white font-semibold hover:bg-[#91a838] hover:text-black transition-colors disabled:opacity-50"
              >
                {savingTeacher ? 'Saving…' : 'Save profile'}
              </button>
              {teacherMsg && <span className="text-sm text-black/55">{teacherMsg}</span>}
            </div>
          </form>
        )}
      </div>
    </DashboardShell>
  );
}
