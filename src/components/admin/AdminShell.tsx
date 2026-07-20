'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  MessageSquareText,
  ShieldCheck,
  Users,
  WalletCards,
} from 'lucide-react';

const items = [
  { label: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Teachers', href: '/dashboard/admin/teachers', icon: ShieldCheck },
  { label: 'Users', href: '/dashboard/admin/users', icon: Users },
  { label: 'Bookings', href: '/dashboard/admin/bookings', icon: BookOpen },
  { label: 'Revenue', href: '/dashboard/admin/revenue', icon: WalletCards },
  { label: 'Reviews', href: '/dashboard/admin/reviews', icon: MessageSquareText },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname().replace(/^\/(en|ru|kz)(?=\/|$)/, '');
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#eeece5] pt-[72px] text-[#151610] lg:flex">
      <aside className="border-b border-black/10 bg-[#171813] text-white lg:min-h-[calc(100vh-72px)] lg:w-64 lg:border-b-0">
        <div className="hidden border-b border-white/10 px-6 py-6 lg:block">
          <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center bg-[#cfe16f] text-black"><BarChart3 className="h-4 w-4" /></div><div><p className="text-sm font-semibold">Administration</p><p className="text-xs text-white/35">YouTeach control center</p></div></div>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:p-4">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/dashboard/admin' && pathname.startsWith(`${item.href}/`));
            return <Link key={item.href} href={item.href} className={`flex shrink-0 items-center gap-3 px-4 py-3 text-sm transition-colors ${active ? 'bg-[#cfe16f] text-black' : 'text-white/55 hover:bg-white/5 hover:text-white'}`}><Icon className="h-4 w-4" />{item.label}</Link>;
          })}
        </nav>
        <div className="mx-4 mt-auto hidden border-t border-white/10 px-2 py-5 lg:block"><p className="truncate text-xs text-white/35">Signed in as</p><p className="mt-1 truncate text-sm text-white/75">{session?.user?.email}</p></div>
      </aside>
      <div className="min-w-0 flex-1"><div className="mx-auto max-w-[1500px] p-5 sm:p-8 lg:p-10">{children}</div></div>
    </div>
  );
}
