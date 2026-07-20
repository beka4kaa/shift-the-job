'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { DashboardShell } from '@/components/DashboardShell';
import { type DashboardBooking, formatBookingDate } from '@/lib/bookings';

export default function TeacherStudentsPage() {
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch('/api/bookings?role=teacher', { cache: 'no-store' }).then(async (res) => res.ok ? setBookings(await res.json()) : undefined).finally(() => setLoading(false)); }, []);
  const students = useMemo(() => { const map = new Map<number, { id: number; name: string; image: string | null; lessons: number; last: string; subject: string }>(); for (const booking of bookings) { const current = map.get(booking.student); map.set(booking.student, { id: booking.student, name: booking.student_name, image: booking.student_image, lessons: (current?.lessons ?? 0) + 1, last: !current || +new Date(booking.date) > +new Date(current.last) ? booking.date : current.last, subject: booking.subject }); } return [...map.values()]; }, [bookings]);
  return <DashboardShell role="teacher"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/40">People</p><h1 className="mb-8 text-3xl font-medium tracking-[-0.03em]">Students</h1><div className="grid gap-3 lg:grid-cols-2">{students.map((student) => <article key={student.id} className="border border-black/10 p-5"><div className="flex items-center gap-4"><img src={student.image || '/default-avatar.svg'} alt={student.name} className="h-14 w-14 rounded-full object-cover" /><div className="min-w-0 flex-1"><h2 className="font-semibold">{student.name}</h2><p className="mt-1 text-sm text-black/45">{student.subject} · {student.lessons} {student.lessons === 1 ? 'lesson' : 'lessons'}</p></div><Link href={`/dashboard/teacher/messages?with=${student.id}&name=${encodeURIComponent(student.name)}`} aria-label={`Message ${student.name}`} className="p-2 text-black/35 hover:text-black"><MessageCircle className="h-5 w-5" /></Link></div><div className="mt-5 flex items-center gap-2 border-t border-black/10 pt-4 text-xs text-black/45"><Calendar className="h-3.5 w-3.5" />Last lesson: {formatBookingDate(student.last).date}</div></article>)}{!loading && students.length === 0 && <div className="col-span-full border border-black/10 p-12 text-center text-black/45">Your students will appear after their first booking.</div>}</div></DashboardShell>;
}
