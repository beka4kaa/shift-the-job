import createMiddleware from 'next-intl/middleware';
import { auth } from '@/auth';

const intlMiddleware = createMiddleware({
  locales: ['en', 'ru', 'kz'],
  defaultLocale: 'en',
});

const DASHBOARD_FOR = {
  ADMIN: '/en/dashboard/admin',
  TEACHER: '/en/dashboard/teacher',
  STUDENT: '/en/dashboard/student',
} as const;

export default auth((req) => {
  const user = req.auth?.user;
  const isLoggedIn = Boolean(user);
  const role = user?.role as keyof typeof DASHBOARD_FOR | undefined;
  const home = role ? DASHBOARD_FOR[role] : undefined;
  const { pathname } = req.nextUrl;
  const isGated = pathname.includes('/dashboard') || pathname.includes('/booking/');

  // Redirect helper that refuses to send a path back onto itself — that
  // self-redirect was the cause of the ERR_TOO_MANY_REDIRECTS loop.
  const go = (target: string) => {
    const url = new URL(target, req.nextUrl);
    return url.pathname === pathname ? intlMiddleware(req) : Response.redirect(url);
  };

  // Signed in but no resolved role => the session is broken (typically the
  // Django auth bridge was unreachable, e.g. DJANGO_API_URL misconfigured on
  // the host). Don't trust it for gated areas; send them to log in again.
  if (isLoggedIn && !home) {
    return isGated ? go('/en/auth/login') : intlMiddleware(req);
  }

  if (!isLoggedIn) {
    return isGated ? go('/en/auth/login') : intlMiddleware(req);
  }

  // Logged in with a valid role from here on.
  if (pathname.includes('/auth/login') || pathname.includes('/auth/register')) {
    return go(home!);
  }
  if (pathname.includes('/dashboard/admin') && role !== 'ADMIN') return go(home!);
  if (pathname.includes('/dashboard/teacher') && role !== 'TEACHER') return go(home!);
  if (pathname.includes('/dashboard/student') && role !== 'STUDENT') return go(home!);
  if (pathname.includes('/booking/') && role !== 'STUDENT') return go(home!);

  return intlMiddleware(req);
});

export const config = {
  // Public assets bypass locale/auth handling so avatars and other static
  // files are never redirected to locale-prefixed paths.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)'],
};
