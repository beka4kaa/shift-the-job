'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Calendar,
  DollarSign,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Star,
  Users,
} from 'lucide-react';

type DashboardRole = 'student' | 'teacher';

const studentItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/student' },
  { label: 'My Bookings', icon: Calendar, href: '/dashboard/student/bookings' },
  { label: 'Favorites', icon: Heart, href: '/dashboard/student/favorites' },
  { label: 'Messages', icon: MessageCircle, href: '/dashboard/student/messages' },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

const teacherItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/teacher' },
  { label: 'Schedule', icon: Calendar, href: '/dashboard/teacher/schedule' },
  { label: 'Students', icon: Users, href: '/dashboard/teacher/students' },
  { label: 'Messages', icon: MessageCircle, href: '/dashboard/teacher/messages' },
  { label: 'Reviews', icon: Star, href: '/dashboard/teacher/reviews' },
  { label: 'Earnings', icon: DollarSign, href: '/dashboard/teacher/earnings' },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

function DashboardSidebar({ role }: { role: DashboardRole }) {
  const pathname = usePathname();
  const dashboardPath = pathname.replace(/^\/(en|ru|kz)(?=\/|$)/, '');
  const items = role === 'teacher' ? teacherItems : studentItems;

  return (
    <aside className="border-b border-black/10 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col md:p-6">
        {items.map((item) => {
          const Icon = item.icon;
          const isRoot = item.href === `/dashboard/${role}`;
          const active = dashboardPath === item.href || (!isRoot && dashboardPath.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-3 px-4 py-3 text-sm transition-colors ${
                active ? 'bg-[#171813] text-white' : 'text-black/55 hover:bg-black/5 hover:text-black'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function DashboardShell({ children, role }: { children: React.ReactNode; role?: DashboardRole }) {
  const { data: session } = useSession();
  const resolvedRole = role ?? (session?.user?.role === 'TEACHER' ? 'teacher' : 'student');

  return (
    <div className="min-h-screen bg-[#f4f1e9] pt-24 text-[#171813] md:flex md:pt-32">
      <DashboardSidebar role={resolvedRole} />
      <div className="min-w-0 flex-1 p-5 sm:p-8">{children}</div>
    </div>
  );
}
