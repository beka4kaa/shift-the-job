import { DJANGO_API_URL } from '@/lib/django-api';

/**
 * Normalized view of a teacher profile produced from the Django API.
 *
 *   Django API row ──► ProfileView ──► profile page (badge from `isVerified`)
 *
 * `isVerified` is the parent-facing trust signal, computed by the Django API
 * (TeacherProfileSerializer.get_is_verified).
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
  source: 'db';
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
    // Django backend unreachable — no data to show.
    return null;
  }

  if (!res.ok) return null;

  const row: DjangoTeacherRow = await res.json();
  return djangoTeacherToProfileView(row);
}

/**
 * List all teachers for the /teachers directory and homepage from the Django
 * API. Returns an empty array on error/empty so callers render a real
 * "no tutors yet" state rather than fabricated data.
 */
export async function getTeacherList(): Promise<ProfileView[]> {
  try {
    const res = await fetch(`${DJANGO_API_URL}/api/teachers/`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const rows: DjangoTeacherRow[] = await res.json();
    return rows.map(djangoTeacherToProfileView);
  } catch {
    return [];
  }
}

/** Resolve a teacher profile by id from Django, or null if it doesn't exist. */
export async function resolveTeacherProfile(
  id: string,
): Promise<ProfileView | null> {
  return getTeacherProfile(id);
}
