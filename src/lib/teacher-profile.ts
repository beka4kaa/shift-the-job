import { prisma } from '@/lib/prisma';
import {
  mockTeachers,
  mockReviews,
  type MockTeacher,
  type MockReview,
} from '@/lib/mock-data';

/**
 * Normalized view of a teacher profile, shared by the DB and mock code paths so
 * the profile page renders identically regardless of source.
 *
 *   real teacher row ─┐
 *                     ├─► ProfileView ─► profile page (badge from `isVerified`)
 *   mock teacher ─────┘
 *
 * `isVerified` is the parent-facing trust signal. For real teachers it is
 * derived from certificate status; for mock teachers it falls back to the
 * hardcoded `verified` flag.
 */
export interface ProfileReview {
  id: string;
  studentName: string;
  studentImage: string;
  rating: number;
  comment: string;
  date: string;
  subject: string;
}

export interface ProfileView {
  id: string;
  name: string;
  image: string;
  headline: string;
  bio: string;
  subjects: string[];
  hourlyRate: number;
  currency: string;
  experience: number;
  languages: string[];
  country: string;
  city: string;
  rating: number;
  reviewCount: number;
  totalStudents: number;
  isVerified: boolean;
  availability: string[];
  reviews: ProfileReview[];
  source: 'db' | 'mock';
}

const DEFAULT_AVATAR = 'https://api.dicebear.com/9.x/avataaars/svg?seed=Student';

// dayOfWeek (0-6) → label, matching the day chips the profile page renders.
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/**
 * The verified badge shows when a teacher has AT LEAST ONE certificate in the
 * VERIFIED state. PENDING, REJECTED, revoked (reverted to PENDING), or an empty
 * certificate list all mean "not verified".
 */
export function certificatesAreVerified(
  certificates: { verificationStatus: string }[],
): boolean {
  return certificates.some((c) => c.verificationStatus === 'VERIFIED');
}

/** Shape of the Prisma query result consumed by `teacherRowToProfileView`. */
export interface TeacherRow {
  id: string;
  headline: string;
  bio: string;
  hourlyRate: number;
  currency: string;
  experience: number;
  country: string;
  city: string;
  rating: number;
  reviewCount: number;
  totalStudents: number;
  user: { name: string; image: string | null };
  certificates: { verificationStatus: string }[];
  subjects: { name: string }[];
  languages: { code: string }[];
  availabilities: { dayOfWeek: number }[];
  reviews: {
    id: string;
    rating: number;
    comment: string;
    createdAt: Date;
    student: { name: string; image: string | null };
  }[];
}

/** Pure mapping from a Prisma teacher row to the uniform view. Unit-testable. */
export function teacherRowToProfileView(row: TeacherRow): ProfileView {
  const subjects = row.subjects.map((s) => s.name);
  // Real reviews have no subject column; fall back to the teacher's primary
  // subject so the review card's subject chip still renders something sensible.
  const fallbackSubject = subjects[0] ?? 'General';

  return {
    id: row.id,
    name: row.user.name,
    image: row.user.image ?? DEFAULT_AVATAR,
    headline: row.headline,
    bio: row.bio,
    subjects,
    hourlyRate: row.hourlyRate,
    currency: row.currency,
    experience: row.experience,
    languages: row.languages.map((l) => l.code),
    country: row.country,
    city: row.city,
    rating: row.rating,
    reviewCount: row.reviewCount,
    totalStudents: row.totalStudents,
    isVerified: certificatesAreVerified(row.certificates),
    availability: row.availabilities
      .map((a) => DAY_LABELS[a.dayOfWeek])
      .filter((d): d is (typeof DAY_LABELS)[number] => Boolean(d)),
    reviews: row.reviews.map((r) => ({
      id: r.id,
      studentName: r.student.name,
      studentImage: r.student.image ?? DEFAULT_AVATAR,
      rating: r.rating,
      comment: r.comment,
      date: r.createdAt.toISOString(),
      subject: fallbackSubject,
    })),
    source: 'db',
  };
}

/** Pure mapping from a mock teacher (+ its mock reviews) to the uniform view. */
export function mockToProfileView(
  teacher: MockTeacher,
  reviews: MockReview[],
): ProfileView {
  return {
    id: teacher.id,
    name: teacher.name,
    image: teacher.image,
    headline: teacher.headline,
    bio: teacher.bio,
    subjects: teacher.subjects,
    hourlyRate: teacher.hourlyRate,
    currency: teacher.currency,
    experience: teacher.experience,
    languages: teacher.languages,
    country: teacher.country,
    city: teacher.city,
    rating: teacher.rating,
    reviewCount: teacher.reviewCount,
    totalStudents: teacher.totalStudents,
    isVerified: teacher.verified,
    availability: teacher.availability,
    reviews: reviews.map((r) => ({
      id: r.id,
      studentName: r.studentName,
      studentImage: r.studentImage,
      rating: r.rating,
      comment: r.comment,
      date: r.date,
      subject: r.subject,
    })),
    source: 'mock',
  };
}

/** Fetch a real teacher profile from the database, or null if none exists. */
export async function getTeacherProfile(id: string): Promise<ProfileView | null> {
  const row = await prisma.teacherProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, image: true } },
      certificates: { select: { verificationStatus: true } },
      subjects: { select: { name: true } },
      languages: { select: { code: true } },
      availabilities: { select: { dayOfWeek: true } },
      reviews: {
        include: { student: { select: { name: true, image: true } } },
      },
    },
  });

  return row ? teacherRowToProfileView(row) : null;
}

/**
 * Resolve a profile for the page: prefer a real DB teacher, fall back to mock
 * data so the existing prototype teacher ids ('1'..'12') keep working during
 * the transition. Returns null when neither source has the id.
 */
export async function resolveTeacherProfile(
  id: string,
): Promise<ProfileView | null> {
  const real = await getTeacherProfile(id);
  if (real) return real;

  const mock = mockTeachers.find((t) => t.id === id);
  if (!mock) return null;

  return mockToProfileView(
    mock,
    mockReviews.filter((r) => r.teacherId === id),
  );
}
