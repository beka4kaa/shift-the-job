'use client';

import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { FavoriteTutorButton } from '@/components/FavoriteTutorButton';

interface TutorActionsProps {
  teacherId: string;
  teacherUserId: number;
  teacherName: string;
}

export function TutorActions({ teacherId, teacherUserId, teacherName }: TutorActionsProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div className="h-28 animate-pulse bg-black/5" />;

  if (status !== 'authenticated') {
    return (
      <Link href="/auth/login" className="flex w-full items-center justify-center gap-2 bg-[#171813] px-6 py-3 text-sm font-semibold text-white hover:bg-[#91a838] hover:text-black">
        Sign in to book <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  if (session.user.role !== 'STUDENT') {
    const isOwnProfile = Number(session.user.id) === teacherUserId;
    return isOwnProfile ? (
      <Link href="/dashboard/settings" className="flex w-full items-center justify-center border border-black/15 px-6 py-3 text-sm font-semibold hover:border-black/30">Manage your profile</Link>
    ) : (
      <p className="border border-black/10 p-4 text-center text-sm text-black/45">Student accounts can book lessons.</p>
    );
  }

  return (
    <>
      <Link href={`/booking/${teacherId}`} className="group flex w-full items-center justify-center gap-2 bg-[#171813] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#91a838] hover:text-black">
        Book a Lesson <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
      <Link href={`/dashboard/student/messages?with=${teacherUserId}&name=${encodeURIComponent(teacherName)}`} className="mt-3 flex w-full items-center justify-center gap-2 border border-black/15 py-3 text-black/70 transition-colors hover:border-black/30 hover:text-black">
        <MessageCircle className="h-4 w-4" />Message
      </Link>
      <FavoriteTutorButton teacherId={teacherId} />
    </>
  );
}
