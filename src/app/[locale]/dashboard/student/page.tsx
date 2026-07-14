'use client';

import { mockBookings } from '@/lib/mock-data';
import {
  Calendar,
  CheckCircle,
  Heart,
  Clock,
  BookOpen,
  MessageCircle,
  Settings,
  LayoutDashboard,
  Star,
  Video,
  Search,
  User,
} from 'lucide-react';
import Link from 'next/link';

const sidebarItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/student', active: true },
  { label: 'My Bookings', icon: Calendar, href: '/dashboard/student/bookings', active: false },
  { label: 'Favorites', icon: Heart, href: '/dashboard/student/favorites', active: false },
  { label: 'Messages', icon: MessageCircle, href: '/dashboard/student/messages', active: false },
  { label: 'Settings', icon: Settings, href: '/dashboard/student/settings', active: false },
];

export default function StudentDashboardPage() {
  const upcomingBookings = mockBookings.filter((b) => b.status === 'upcoming');
  const completedBookings = mockBookings.filter((b) => b.status === 'completed');

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
        <h1 className="text-2xl font-bold mb-6">Welcome back, Alex! 👋</h1>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">Upcoming Lessons</span>
            </div>
            <p className="text-3xl font-bold">2</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-gray-400">Completed Lessons</span>
            </div>
            <p className="text-3xl font-bold">12</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-5 h-5 text-rose-400" />
              <span className="text-sm text-gray-400">Favorite Tutors</span>
            </div>
            <p className="text-3xl font-bold">5</p>
          </div>
        </div>

        {/* Upcoming Lessons */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Upcoming Lessons{' '}
            <span className="text-sm text-gray-400 font-normal">({upcomingBookings.length})</span>
          </h2>
          <div className="flex flex-col gap-4">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center gap-4"
              >
                <img
                  src={booking.teacherImage}
                  alt={booking.teacherName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{booking.teacherName}</span>
                    <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-xs">
                      {booking.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {booking.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {booking.time}
                    </span>
                    <span>{booking.duration} min</span>
                    <span>${booking.price}</span>
                  </div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs">
                  Upcoming
                </span>
                <button className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 rounded-xl text-sm text-white hover:opacity-90 transition-opacity">
                  Join Lesson
                </button>
              </div>
            ))}
            {upcomingBookings.length === 0 && (
              <p className="text-gray-500 text-sm">No upcoming lessons scheduled.</p>
            )}
          </div>
        </section>

        {/* Past Lessons */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Past Lessons{' '}
            <span className="text-sm text-gray-400 font-normal">({completedBookings.length})</span>
          </h2>
          <div className="flex flex-col gap-4">
            {completedBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center gap-4"
              >
                <img
                  src={booking.teacherImage}
                  alt={booking.teacherName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{booking.teacherName}</span>
                    <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-xs">
                      {booking.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {booking.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {booking.time}
                    </span>
                    <span>{booking.duration} min</span>
                    <span>${booking.price}</span>
                  </div>
                </div>
                <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-xs">
                  Completed
                </span>
                <button className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition-colors">
                  Leave Review
                </button>
              </div>
            ))}
            {completedBookings.length === 0 && (
              <p className="text-gray-500 text-sm">No completed lessons yet.</p>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link
            href="/teachers"
            className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 rounded-xl text-sm text-white font-medium hover:opacity-90 transition-opacity"
          >
            Find a Tutor
          </Link>
          <button className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm text-gray-300 font-medium hover:bg-white/10 transition-colors">
            My Bookings
          </button>
        </div>
      </main>
    </div>
  );
}
