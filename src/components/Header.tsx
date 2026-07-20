'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, LogOut, Menu, X } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

const DEFAULT_AVATAR = '/default-avatar.svg';

const NAV_LINKS = [
  { label: 'Tutors', href: '/teachers' },
  { label: 'Subjects', href: '/#subjects' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'For educators', href: '/#for-teachers' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated' && Boolean(session?.user);
  const dashboardHref = session?.user?.role === 'ADMIN'
    ? '/dashboard/admin'
    : session?.user?.role === 'TEACHER'
      ? '/dashboard/teacher'
      : '/dashboard/student';
  const displayName = session?.user?.name?.split(' ')[0] || 'Account';

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-[#f4f1e9]/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="text-xl font-semibold tracking-[-0.05em] text-[#171813]">
          YouTeach<span className="text-[#91a838]">.</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-black/55 transition-colors hover:text-black">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden min-w-56 items-center justify-end gap-4 md:flex">
          {status === 'loading' ? (
            <div className="h-9 w-28 animate-pulse bg-black/5" aria-label="Loading account" />
          ) : isAuthenticated ? (
            <>
              <Link href={dashboardHref} className="flex items-center gap-2.5 text-sm font-semibold text-black/70 hover:text-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={session.user.image || DEFAULT_AVATAR}
                  alt=""
                  className="h-8 w-8 rounded-full border border-black/10 object-cover"
                  onError={(event) => {
                    if (!event.currentTarget.src.endsWith(DEFAULT_AVATAR)) {
                      event.currentTarget.src = DEFAULT_AVATAR;
                    }
                  }}
                />
                {displayName}
              </Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="inline-flex items-center gap-1.5 text-xs text-black/45 hover:text-black">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-black/60 hover:text-black">Sign in</Link>
              <Link href="/auth/register" className="inline-flex items-center gap-2 border border-black/20 px-4 py-2 text-sm font-semibold hover:bg-black hover:text-white">
                Join YouTeach <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>

        <button className="p-2 md:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle menu" aria-expanded={mobileOpen}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-black/10 bg-[#f4f1e9] px-5 py-6 md:hidden">
          <nav className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="border-b border-black/10 py-4 text-lg">
                {link.label}
              </Link>
            ))}
          </nav>
          {isAuthenticated ? (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link href={dashboardHref} onClick={() => setMobileOpen(false)} className="bg-black px-4 py-3 text-center text-sm text-white">Open dashboard</Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="border border-black/20 px-4 py-3 text-center text-sm">Sign out</button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="border border-black/20 px-4 py-3 text-center text-sm">Sign in</Link>
              <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="bg-black px-4 py-3 text-center text-sm text-white">Join YouTeach</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
