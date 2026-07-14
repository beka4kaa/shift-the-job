import { DJANGO_API_URL } from '@/lib/django-api';
import {
  mockTeachers,
  mockReviews,
  type MockTeacher,
  type MockReview,
} from '@/lib/mock-data';

/**
 * Normalized view of a teacher profile, shared by the Django and mock code
 * paths so the profile page renders identically regardless of source.
 *
 *   Django API row ─┐
 *                   ├─► ProfileView ─► profile page (badge from `isVerified`)
 *   mock teacher ───┘
 *
 * `isVerified` is the parent-facing trust signal. For real teachers it is
 * computed by the Django API (TeacherProfileSerializer.get_is_verified); for
 * mock teachers it falls back to the hardcoded `verified` flag.
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

/** Shape of the JSON returned by Django's TeacherProfileSerializer. */
export interface DjangoTeacherRow {
  id: number;
  name: string;
  image: string | null;
  headline: string;
  bio: string;
  subjects: string[];
  languages: string[];
  hourly_rate: number;
  currency: string;
  experience: number;
  country: string;
  city: string;
  rating: number;
  review_count: number;
  total_students: number;
  is_verified: boolean;
  availability: string[];
  reviews: {
    id: number;
    student_name: string;
    student_image: string | null;
    rating: number;
    comment: string;
    created_at: string;
  }[];
}

/** Pure mapping from a Django API row to the uniform view. Unit-testable. */
export function djangoTeacherToProfileView(row: DjangoTeacherRow): ProfileView {
  const fallbackSubject = row.subjects[0] ?? 'General';

  return {
    id: String(row.id),
    name: row.name,
    image: row.image ?? DEFAULT_AVATAR,
    headline: row.headline,
    bio: row.bio,
    subjects: row.subjects,
    hourlyRate: row.hourly_rate,
    currency: row.currency,
    experience: row.experience,
    languages: row.languages,
    country: row.country,
    city: row.city,
    rating: row.rating,
    reviewCount: row.review_count,
    totalStudents: row.total_students,
    isVerified: row.is_verified,
    availability: row.availability,
    reviews: row.reviews.map((r) => ({
      id: String(r.id),
      studentName: r.student_name,
      studentImage: r.student_image ?? DEFAULT_AVATAR,
      rating: r.rating,
      comment: r.comment,
      date: r.created_at,
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

/** Fetch a real teacher profile from the Django API, or null if none exists. */
export async function getTeacherProfile(id: string): Promise<ProfileView | null> {
  let res: Response;
  try {
    res = await fetch(`${DJANGO_API_URL}/api/teachers/${id}/`, {
      // Teacher data changes infrequently enough that a short cache is fine,
      // and avoids hammering the API on every profile-page request.
      next: { revalidate: 60 },
    });
  } catch {
    // Django backend unreachable — fall back to mock data rather than 500ing the page.
    return null;
  }

  if (!res.ok) return null;

  const row: DjangoTeacherRow = await res.json();
  return djangoTeacherToProfileView(row);
}

/**
 * Resolve a profile for the page: prefer a real Django teacher, fall back to
 * mock data so the existing prototype teacher ids ('1'..'12') keep working
 * (note: Django's ids are small sequential integers too, so a seeded teacher
 * can shadow a mock one with the same id — real data always wins, same as
 * before this cutover). Returns null when neither source has the id.
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
