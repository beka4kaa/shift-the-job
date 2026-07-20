'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

const publicLinks = [
  { label: 'Find tutors', href: '/teachers' },
  { label: 'How it works', href: '/#how-it-works' },
];

export function Footer() {
  const { data: session, status } = useSession();
  const dashboard = session?.user?.role === 'ADMIN'
    ? '/dashboard/admin'
    : session?.user?.role === 'TEACHER'
      ? '/dashboard/teacher'
      : '/dashboard/student';

  return (
    <footer className="bg-[#171813] px-5 py-14 text-white sm:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 border-b border-white/15 pb-16 md:grid-cols-2">
          <div>
            <Link href="/" className="text-2xl font-semibold tracking-[-0.05em]">YouTeach<span className="text-[#cfe16f]">.</span></Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/45">Thoughtful tutoring for ambitious learners, wherever they are.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:justify-self-end md:gap-x-14">
            {publicLinks.map((link) => <Link key={link.href} href={link.href} className="flex items-center gap-2 text-sm text-white/55 hover:text-white">{link.label}<ArrowUpRight className="h-3 w-3" /></Link>)}
            {status === 'authenticated' ? (
              <>
                <Link href={dashboard} className="flex items-center gap-2 text-sm text-white/55 hover:text-white">Dashboard<ArrowUpRight className="h-3 w-3" /></Link>
                <button type="button" onClick={() => signOut({ callbackUrl: '/' })} className="flex items-center gap-2 text-left text-sm text-white/55 hover:text-white">Sign out<ArrowUpRight className="h-3 w-3" /></button>
              </>
            ) : (
              <>
                <Link href="/auth/register" className="flex items-center gap-2 text-sm text-white/55 hover:text-white">Become a tutor<ArrowUpRight className="h-3 w-3" /></Link>
                <Link href="/auth/login" className="flex items-center gap-2 text-sm text-white/55 hover:text-white">Sign in<ArrowUpRight className="h-3 w-3" /></Link>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-6 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 YouTeach</p><p>Made for better learning.</p>
        </div>
      </div>
    </footer>
  );
}
