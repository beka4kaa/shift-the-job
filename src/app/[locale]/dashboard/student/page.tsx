'use client';

import { useSession } from 'next-auth/react';
import { mockBookings } from '@/lib/mock-data';
import {
  Calendar,
  CheckCircle,
  Heart,
  Clock,
  MessageCircle,
  Settings,
  LayoutDashboard,
} from 'lucide-react';
import Link from 'next/link';

const sidebarItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/student', active: true },
  { label: 'My Bookings', icon: Calendar, href: '/dashboard/student/bookings', active: false },
  { label: 'Favorites', icon: Heart, href: '/dashboard/student/favorites', active: false },
  { label: 'Messages', icon: MessageCircle, href: '/dashboard/student/messages', active: false },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings', active: false },
];

export default function StudentDashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] ?? 'there';
  const upcomingBookings = mockBookings.filter((b) => b.status === 'upcoming');
  const completedBookings = mockBookings.filter((b) => b.status === 'completed');

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
        <h1 className="text-2xl font-medium tracking-[-0.02em] mb-6">Welcome back, {firstName}! 👋</h1>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 border-l border-t border-black/10 mb-8">
          <div className="border-r border-b border-black/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-black/45" />
              <span className="text-sm text-black/55">Upcoming Lessons</span>
            </div>
            <p className="text-3xl font-medium tracking-[-0.02em]">2</p>
          </div>
          <div className="border-r border-b border-black/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-[#91a838]" />
              <span className="text-sm text-black/55">Completed Lessons</span>
            </div>
            <p className="text-3xl font-medium tracking-[-0.02em]">12</p>
          </div>
          <div className="border-r border-b border-black/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-5 h-5 text-black/45" />
              <span className="text-sm text-black/55">Favorite Tutors</span>
            </div>
            <p className="text-3xl font-medium tracking-[-0.02em]">5</p>
          </div>
        </div>

        {/* Upcoming Lessons */}
        <section className="mb-8">
          <h2 className="text-lg font-medium tracking-[-0.02em] mb-4">
            Upcoming Lessons{' '}
            <span className="text-sm text-black/45 font-normal">({upcomingBookings.length})</span>
          </h2>
          <div className="flex flex-col gap-px bg-black/10">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-[#f4f1e9] border border-black/10 p-6 flex items-center gap-4"
              >
                <img
                  src={booking.teacherImage}
                  alt={booking.teacherName}
                  className="w-12 h-12 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{booking.teacherName}</span>
                    <span className="border border-black/15 text-black/60 px-2 py-0.5 text-xs">
                      {booking.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-black/55">
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
                <span className="border border-[#91a838]/40 text-[#5f6f26] px-3 py-1 text-xs">
                  Upcoming
                </span>
                <button className="bg-[#171813] px-4 py-2 text-sm text-white hover:bg-[#91a838] hover:text-black transition-colors">
                  Join Lesson
                </button>
              </div>
            ))}
            {upcomingBookings.length === 0 && (
              <p className="text-black/45 text-sm bg-[#f4f1e9] p-6">No upcoming lessons scheduled.</p>
            )}
          </div>
        </section>

        {/* Past Lessons */}
        <section className="mb-8">
          <h2 className="text-lg font-medium tracking-[-0.02em] mb-4">
            Past Lessons{' '}
            <span className="text-sm text-black/45 font-normal">({completedBookings.length})</span>
          </h2>
          <div className="flex flex-col gap-px bg-black/10">
            {completedBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-[#f4f1e9] border border-black/10 p-6 flex items-center gap-4"
              >
                <img
                  src={booking.teacherImage}
                  alt={booking.teacherName}
                  className="w-12 h-12 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{booking.teacherName}</span>
                    <span className="border border-black/15 text-black/60 px-2 py-0.5 text-xs">
                      {booking.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-black/55">
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
                <span className="border border-black/15 text-black/45 px-3 py-1 text-xs">
                  Completed
                </span>
                <button className="border border-black/15 px-4 py-2 text-sm text-black/70 hover:border-black/30 hover:text-black transition-colors">
                  Leave Review
                </button>
              </div>
            ))}
            {completedBookings.length === 0 && (
              <p className="text-black/45 text-sm bg-[#f4f1e9] p-6">No completed lessons yet.</p>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link
            href="/teachers"
            className="bg-[#171813] px-6 py-3 text-sm text-white font-medium hover:bg-[#91a838] hover:text-black transition-colors"
          >
            Find a Tutor
          </Link>
          <button className="border border-black/15 px-6 py-3 text-sm text-black/70 font-medium hover:border-black/30 hover:text-black transition-colors">
            My Bookings
          </button>
        </div>
      </main>
    </div>
  );
}
