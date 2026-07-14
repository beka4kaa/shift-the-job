import Link from 'next/link';
import { resolveTeacherProfile } from '@/lib/teacher-profile';
import { BookingForm } from './BookingForm';

export default async function BookingPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  const { teacherId } = await params;
  const teacher = await resolveTeacherProfile(teacherId);

  if (!teacher) {
    return (
      <div className="min-h-[80vh] bg-[#f4f1e9] text-[#171813] flex items-center justify-center px-5">
        <div className="text-center">
          <h1 className="text-2xl font-medium tracking-[-0.02em] mb-4">Teacher not found</h1>
          <Link
            href="/teachers"
            className="text-sm font-semibold underline decoration-1 underline-offset-4"
          >
            ← Back to teachers
          </Link>
        </div>
      </div>
    );
  }

  return <BookingForm teacher={teacher} />;
}
