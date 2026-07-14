'use client';

import { mockBookings, mockReviews } from '@/lib/mock-data';
import { ReviewCard } from '@/components/ReviewCard';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Star,
  DollarSign,
  Settings,
  TrendingUp,
  Eye,
  CreditCard,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

const sidebarItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/teacher', active: true },
  { label: 'Schedule', icon: Calendar, href: '/dashboard/teacher/schedule', active: false },
  { label: 'Students', icon: Users, href: '/dashboard/teacher/students', active: false },
  { label: 'Reviews', icon: Star, href: '/dashboard/teacher/reviews', active: false },
  { label: 'Earnings', icon: DollarSign, href: '/dashboard/teacher/earnings', active: false },
  { label: 'Settings', icon: Settings, href: '/dashboard/teacher/settings', active: false },
];

export default function TeacherDashboardPage() {
  const upcomingBookings = mockBookings.filter((b) => b.status === 'upcoming');
  const teacherReviews = mockReviews.filter((r) => r.teacherId === '1').slice(0, 3);

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
                  item.active
                    ? 'bg-[#171813] text-white'
                    : 'text-black/55 hover:bg-black/5 hover:text-black'
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
        {/* Welcome */}
        <h1 className="text-2xl font-medium tracking-[-0.02em] mb-6">Welcome back, Sarah! 👋</h1>

        {/* Earnings Overview */}
        <div className="border border-black/10 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#91a838]" />
            <h2 className="text-lg font-medium tracking-[-0.02em]">Earnings Overview</h2>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-black/55 mb-1">This Month</p>
              <p className="text-2xl font-medium tracking-[-0.02em]">$1,250</p>
            </div>
            <div>
              <p className="text-sm text-black/55 mb-1">Total Earnings</p>
              <p className="text-2xl font-medium tracking-[-0.02em]">$12,480</p>
            </div>
            <div>
              <p className="text-sm text-black/55 mb-1">Pending</p>
              <p className="text-2xl font-medium tracking-[-0.02em]">$320</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-black/10 mb-8">
          <div className="border-r border-b border-black/10 p-6 text-center">
            <Users className="w-6 h-6 text-black/45 mx-auto mb-2" />
            <p className="text-2xl font-medium tracking-[-0.02em]">42</p>
            <p className="text-sm text-black/55">Active Students</p>
          </div>
          <div className="border-r border-b border-black/10 p-6 text-center">
            <Calendar className="w-6 h-6 text-black/45 mx-auto mb-2" />
            <p className="text-2xl font-medium tracking-[-0.02em]">186</p>
            <p className="text-sm text-black/55">Total Lessons</p>
          </div>
          <div className="border-r border-b border-black/10 p-6 text-center">
            <Star className="w-6 h-6 text-[#91a838] mx-auto mb-2" />
            <div className="flex items-center justify-center gap-1">
              <p className="text-2xl font-medium tracking-[-0.02em]">4.9</p>
              <Star className="w-4 h-4 text-[#91a838] fill-[#91a838]" />
            </div>
            <p className="text-sm text-black/55">Average Rating</p>
          </div>
          <div className="border-r border-b border-black/10 p-6 text-center">
            <Eye className="w-6 h-6 text-black/45 mx-auto mb-2" />
            <p className="text-2xl font-medium tracking-[-0.02em]">1,247</p>
            <p className="text-sm text-black/55">Profile Views</p>
          </div>
        </div>

        {/* Upcoming Schedule */}
        <section className="mb-8">
          <h2 className="text-lg font-medium tracking-[-0.02em] mb-4">
            Upcoming Schedule{' '}
            <span className="text-sm text-black/45 font-normal">({upcomingBookings.length})</span>
          </h2>
          <div className="flex flex-col gap-px bg-black/10">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-[#f4f1e9] border border-black/10 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={booking.teacherImage}
                    alt={booking.teacherName}
                    className="w-10 h-10 object-cover"
                  />
                  <div>
                    <p className="font-semibold">{booking.teacherName}</p>
                    <span className="border border-black/15 text-black/60 px-2 py-0.5 text-xs">
                      {booking.subject}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="text-black/70 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {booking.date}
                    </p>
                    <p className="text-black/55 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {booking.time} · {booking.duration} min
                    </p>
                  </div>
                  <span className="border border-[#91a838]/40 text-[#5f6f26] px-3 py-1 text-xs">
                    Upcoming
                  </span>
                </div>
              </div>
            ))}
            {upcomingBookings.length === 0 && (
              <p className="text-black/45 text-sm bg-[#f4f1e9] p-4">No upcoming lessons scheduled.</p>
            )}
          </div>
        </section>

        {/* Recent Reviews */}
        <section className="mb-8">
          <h2 className="text-lg font-medium tracking-[-0.02em] mb-4">Recent Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 border-l border-t border-black/10">
            {teacherReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          {teacherReviews.length === 0 && (
            <p className="text-black/45 text-sm">No reviews yet.</p>
          )}
        </section>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-8">
          <button className="border border-black/15 px-6 py-3 text-sm text-black/70 font-medium hover:border-black/30 hover:text-black transition-colors">
            Edit Profile
          </button>
          <button className="border border-black/15 px-6 py-3 text-sm text-black/70 font-medium hover:border-black/30 hover:text-black transition-colors">
            Manage Schedule
          </button>
          <button className="bg-[#171813] px-6 py-3 text-sm text-white font-medium hover:bg-[#91a838] hover:text-black transition-colors">
            Withdraw Funds
          </button>
        </div>

        {/* Stripe Connect Card */}
        <div className="border border-black/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-[#91a838]" />
                <h2 className="text-lg font-medium tracking-[-0.02em]">Payment Setup</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#91a838]" />
                <span className="text-sm text-black/70">Stripe Connected</span>
              </div>
            </div>
            <button className="border border-black/15 px-4 py-2 text-sm text-black/70 hover:border-black/30 hover:text-black transition-colors">
              Manage Payments
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
