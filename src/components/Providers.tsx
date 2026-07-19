'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * Client-side context providers for the app. Currently just NextAuth's
 * SessionProvider, which powers useSession() in client components (dashboards,
 * settings, header).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
