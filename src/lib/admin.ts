export interface AdminMetrics {
  users: number;
  active_users: number;
  new_users_30d: number;
  teachers: number;
  verified_teachers: number;
  bookings: number;
  paid_bookings: number;
  pending_bookings: number;
  gross_revenue: number;
  platform_revenue: number;
  teacher_earnings: number;
}

export interface AdminTrendPoint {
  key: string;
  label: string;
  users: number;
  bookings: number;
  gross: number;
  platform: number;
}

export interface AdminBooking {
  id: number;
  student: number;
  student_name: string;
  student_image: string | null;
  teacher: number;
  teacher_name: string;
  teacher_image: string | null;
  subject: string;
  date: string;
  duration: number;
  price: number;
  platform_fee: number;
  currency: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  meeting_link: string | null;
  notes: string | null;
  created_at: string;
}

export interface AdminSummary {
  metrics: AdminMetrics;
  users_by_role: Record<string, number>;
  trend: AdminTrendPoint[];
  top_teachers: {
    id: number;
    name: string;
    image: string;
    gross: number;
    platform: number;
    earnings: number;
    lessons: number;
  }[];
  recent_bookings: AdminBooking[];
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  image: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  is_active: boolean;
  is_staff: boolean;
  student_bookings: number;
  taught_bookings: number;
  created_at: string;
}

export interface AdminTeacher {
  id: number;
  user_id: number;
  email: string;
  name: string;
  image: string;
  is_active: boolean;
  headline: string;
  bio: string;
  subjects: string[];
  languages: string[];
  availability: string[];
  hourly_rate: number;
  currency: string;
  experience: number;
  country: string;
  city: string;
  timezone: string;
  verified: boolean;
  featured: boolean;
  stripe_account_id: string | null;
  review_count: number;
  average_rating: number;
  booking_count: number;
  student_count: number;
  gross_revenue: number;
  platform_revenue: number;
  teacher_earnings: number;
  created_at: string;
}

export interface AdminReview {
  id: number;
  student: number;
  student_name: string;
  student_image: string | null;
  teacher: number;
  teacher_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface AdminRevenueRow {
  teacher_id: number;
  name: string;
  email: string;
  currency: string;
  lessons: number;
  gross: number;
  platform: number;
  earnings: number;
  payouts_ready: boolean;
}

export function adminMoney(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

export function shortAdminDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export async function readAdminError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return fallback;
  if (typeof body.detail === 'string') return body.detail;
  const first = Object.values(body)[0];
  if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
  if (typeof first === 'string') return first;
  return fallback;
}
