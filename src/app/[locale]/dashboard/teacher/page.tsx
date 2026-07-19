'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ReviewCard, type ReviewCardData } from '@/components/ReviewCard';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Star,
  DollarSign,
  Settings,
  TrendingUp,
  MessageSquare,
  CreditCard,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import {
  type DashboardBooking,
  isUpcoming,
  formatBookingDate,
  money,
} from '@/lib/bookings';

const sidebarItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/teacher', active: true },
  { label: 'Schedule', icon: Calendar, href: '/dashboard/teacher/schedule', active: false },
  { label: 'Students', icon: Users, href: '/dashboard/teacher/students', active: false },
  { label: 'Reviews', icon: Star, href: '/dashboard/teacher/reviews', active: false },
  { label: 'Earnings', icon: DollarSign, href: '/dashboard/teacher/earnings', active: false },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings', active: false },
];

interface TeacherProfile {
  id: number;
  rating: number;
  review_count: number;
  total_students: number;
  reviews: {
    id: number;
    student_name: string;
    student_image: string | null;
    rating: number;
    comment: string;
    created_at: string;
  }[];
}

const DEFAULT_AVATAR = 'https://api.dicebear.com/9.x/avataaars/svg?seed=Student';

export default function TeacherDashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] ?? 'there';

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [payoutError, setPayoutError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [pRes, bRes] = await Promise.all([
          fetch('/api/profile/teacher', { cache: 'no-store' }),
          fetch('/api/bookings?role=teacher', { cache: 'no-store' }),
        ]);
        if (pRes.ok) setProfile(await pRes.json());
        if (bRes.ok) setBookings(await bRes.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const earned = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
  const take = (b: DashboardBooking) => b.price * 0.85; // teacher keeps 85% (15% platform fee)
  const totalEarnings = earned.reduce((s, b) => s + take(b), 0);
  const now = new Date();
  const thisMonth = earned
    .filter((b) => {
      const d = new Date(b.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, b) => s + take(b), 0);
  const pending = bookings.filter((b) => b.status === 'PENDING').reduce((s, b) => s + take(b), 0);

  const activeStudents = new Set(bookings.map((b) => b.student_name)).size;
  const upcoming = bookings.filter(isUpcoming);

  const reviews: ReviewCardData[] = (profile?.reviews ?? []).slice(0, 3).map((r) => ({
    id: String(r.id),
    studentName: r.student_name,
    studentImage: r.student_image ?? DEFAULT_AVATAR,
    rating: r.rating,
    comment: r.comment,
    date: r.created_at,
    subject: 'Lesson',
  }));

  const setUpPayouts = async () => {
    setConnecting(true);
    setPayoutError('');
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setPayoutError('Payouts are not available yet. Please try again later.');
      setConnecting(false);
    }
  };

  const stat = (v: number | string) => (loading ? '—' : v);

  return (
    <div className="flex min-h-screen pt-32 bg-[#f4f1e9] text-[#171813]">
      {/* Sidebar */}
      <aside className="w-64 min-h-screen p-6 border-r border-black/10 hidden md:block">
        <nav className="flex flex-col gap-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  item.active ? 'bg-[#171813] text-white' : 'text-black/55 hover:bg-black/5 hover:text-black'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-medium tracking-[-0.02em] mb-6">Welcome back, {firstName}! 👋</h1>

        {/* Earnings Overview */}
        <div className="border border-black/10 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#91a838]" />
            <h2 className="text-lg font-medium tracking-[-0.02em]">Earnings Overview</h2>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-black/55 mb-1">This Month</p>
              <p className="text-2xl font-medium tracking-[-0.02em]">{stat(money(thisMonth, 'USD'))}</p>
            </div>
            <div>
              <p className="text-sm text-black/55 mb-1">Total Earnings</p>
              <p className="text-2xl font-medium tracking-[-0.02em]">{stat(money(totalEarnings, 'USD'))}</p>
            </div>
            <div>
              <p className="text-sm text-black/55 mb-1">Pending</p>
              <p className="text-2xl font-medium tracking-[-0.02em]">{stat(money(pending, 'USD'))}</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-black/10 mb-8">
          <div className="border-r border-b border-black/10 p-6 text-center">
            <Users className="w-6 h-6 text-black/45 mx-auto mb-2" />
            <p className="text-2xl font-medium tracking-[-0.02em]">{stat(activeStudents)}</p>
            <p className="text-sm text-black/55">Active Students</p>
          </div>
          <div className="border-r border-b border-black/10 p-6 text-center">
            <Calendar className="w-6 h-6 text-black/45 mx-auto mb-2" />
            <p className="text-2xl font-medium tracking-[-0.02em]">{stat(bookings.length)}</p>
            <p className="text-sm text-black/55">Total Lessons</p>
          </div>
          <div className="border-r border-b border-black/10 p-6 text-center">
            <Star className="w-6 h-6 text-[#91a838] mx-auto mb-2" />
            <div className="flex items-center justify-center gap-1">
              <p className="text-2xl font-medium tracking-[-0.02em]">{stat(profile?.rating ?? 0)}</p>
              <Star className="w-4 h-4 text-[#91a838] fill-[#91a838]" />
            </div>
            <p className="text-sm text-black/55">Average Rating</p>
          </div>
          <div className="border-r border-b border-black/10 p-6 text-center">
            <MessageSquare className="w-6 h-6 text-black/45 mx-auto mb-2" />
            <p className="text-2xl font-medium tracking-[-0.02em]">{stat(profile?.review_count ?? 0)}</p>
            <p className="text-sm text-black/55">Reviews</p>
          </div>
        </div>

        {/* Upcoming Schedule */}
        <section className="mb-8">
          <h2 className="text-lg font-medium tracking-[-0.02em] mb-4">
            Upcoming Schedule <span className="text-sm text-black/45 font-normal">({upcoming.length})</span>
          </h2>
          <div className="flex flex-col gap-px bg-black/10">
            {upcoming.map((booking) => {
              const { date, time } = formatBookingDate(booking.date);
              return (
                <div key={booking.id} className="bg-[#f4f1e9] border border-black/10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {booking.student_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={booking.student_image} alt={booking.student_name} className="w-10 h-10 object-cover" />
                    ) : (
                      <div className="w-10 h-10 border border-black/10 flex items-center justify-center text-sm font-medium text-black/40">
                        {booking.student_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{booking.student_name}</p>
                      <span className="border border-black/15 text-black/60 px-2 py-0.5 text-xs">{booking.subject}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-black/70 flex items-center gap-1 justify-end"><Calendar className="w-3.5 h-3.5" />{date}</p>
                      <p className="text-black/55 flex items-center gap-1 justify-end"><Clock className="w-3.5 h-3.5" />{time} · {booking.duration} min</p>
                    </div>
                    <span className="border border-[#91a838]/40 text-[#5f6f26] px-3 py-1 text-xs capitalize">{booking.status.toLowerCase()}</span>
                  </div>
                </div>
              );
            })}
            {!loading && upcoming.length === 0 && (
              <p className="text-black/45 text-sm bg-[#f4f1e9] p-4">No upcoming lessons scheduled yet.</p>
            )}
            {loading && <p className="text-black/45 text-sm bg-[#f4f1e9] p-4">Loading your schedule…</p>}
          </div>
        </section>

        {/* Recent Reviews */}
        <section className="mb-8">
          <h2 className="text-lg font-medium tracking-[-0.02em] mb-4">Recent Reviews</h2>
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 border-l border-t border-black/10">
              {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
            </div>
          ) : (
            <p className="text-black/45 text-sm">No reviews yet — they’ll appear here after your first lessons.</p>
          )}
        </section>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-8">
          <Link
            href="/dashboard/settings"
            className="border border-black/15 px-6 py-3 text-sm text-black/70 font-medium hover:border-black/30 hover:text-black transition-colors"
          >
            Edit Profile
          </Link>
          {profile && (
            <Link
              href={`/teachers/${profile.id}`}
              className="border border-black/15 px-6 py-3 text-sm text-black/70 font-medium hover:border-black/30 hover:text-black transition-colors"
            >
              View Public Profile
            </Link>
          )}
        </div>

        {/* Payouts Setup */}
        <div className="border border-black/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-[#91a838]" />
                <h2 className="text-lg font-medium tracking-[-0.02em]">Payment Setup</h2>
              </div>
              <p className="text-sm text-black/55">
                Connect a payout account to receive earnings from your lessons.
              </p>
              {payoutError && <p className="text-sm text-red-700 mt-2">{payoutError}</p>}
            </div>
            <button
              onClick={setUpPayouts}
              disabled={connecting}
              className="bg-[#171813] px-4 py-2 text-sm text-white hover:bg-[#91a838] hover:text-black transition-colors disabled:opacity-50"
            >
              {connecting ? 'Redirecting…' : 'Set up payouts'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
