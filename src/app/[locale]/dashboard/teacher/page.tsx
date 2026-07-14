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
  MessageCircle,
  BarChart3,
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
    <div className="flex min-h-screen pt-16 bg-[#0a0a0f] text-[#f1f5f9]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#12121a] min-h-screen p-6 border-r border-white/5 hidden md:block">
        <nav className="flex flex-col gap-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                  item.active
                    ? 'bg-purple-500/10 text-purple-400'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-300'
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
        <h1 className="text-2xl font-bold mb-6">Welcome back, Sarah! 👋</h1>

        {/* Earnings Overview */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold">Earnings Overview</h2>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">This Month</p>
              <p className="text-2xl font-bold text-white">$1,250</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-white">$12,480</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">$320</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
            <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">42</p>
            <p className="text-sm text-gray-400">Active Students</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
            <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">186</p>
            <p className="text-sm text-gray-400">Total Lessons</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
            <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="flex items-center justify-center gap-1">
              <p className="text-2xl font-bold">4.9</p>
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            </div>
            <p className="text-sm text-gray-400">Average Rating</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
            <Eye className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">1,247</p>
            <p className="text-sm text-gray-400">Profile Views</p>
          </div>
        </div>

        {/* Upcoming Schedule */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Upcoming Schedule{' '}
            <span className="text-sm text-gray-400 font-normal">({upcomingBookings.length})</span>
          </h2>
          <div className="flex flex-col gap-3">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={booking.teacherImage}
                    alt={booking.teacherName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold">{booking.teacherName}</p>
                    <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-xs">
                      {booking.subject}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="text-gray-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {booking.date}
                    </p>
                    <p className="text-gray-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {booking.time} · {booking.duration} min
                    </p>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs">
                    Upcoming
                  </span>
                </div>
              </div>
            ))}
            {upcomingBookings.length === 0 && (
              <p className="text-gray-500 text-sm">No upcoming lessons scheduled.</p>
            )}
          </div>
        </section>

        {/* Recent Reviews */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Recent Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teacherReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
            {teacherReviews.length === 0 && (
              <p className="text-gray-500 text-sm">No reviews yet.</p>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-8">
          <button className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm text-gray-300 font-medium hover:bg-white/10 transition-colors">
            Edit Profile
          </button>
          <button className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm text-gray-300 font-medium hover:bg-white/10 transition-colors">
            Manage Schedule
          </button>
          <button className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 rounded-xl text-sm text-white font-medium hover:opacity-90 transition-opacity">
            Withdraw Funds
          </button>
        </div>

        {/* Stripe Connect Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold">Payment Setup</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-sm text-gray-300">Stripe Connected</span>
              </div>
            </div>
            <button className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition-colors">
              Manage Payments
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
