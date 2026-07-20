import createMiddleware from 'next-intl/middleware';
import { auth } from '@/auth';

const intlMiddleware = createMiddleware({
  locales: ['en', 'ru', 'kz'],
  defaultLocale: 'en',
});

export default auth((req) => {
  // `req.auth` can contain an error-shaped object after an Auth.js config
  // failure, so only a real session user counts as authenticated.
  const isLoggedIn = Boolean(req.auth?.user);
  const { pathname } = req.nextUrl;
  const isDashboardRoute = pathname.includes('/dashboard');
  const role = req.auth?.user?.role;
  const dashboard = role === 'ADMIN'
    ? '/en/dashboard/admin'
    : role === 'TEACHER'
      ? '/en/dashboard/teacher'
      : '/en/dashboard/student';

  if (isLoggedIn && pathname.includes('/auth/login')) {
    return Response.redirect(new URL(dashboard, req.nextUrl));
  }

  if (!isLoggedIn && isDashboardRoute) {
    return Response.redirect(new URL('/en/auth/login', req.nextUrl));
  }

  if (isLoggedIn && pathname.includes('/dashboard/admin') && role !== 'ADMIN') {
    return Response.redirect(new URL(dashboard, req.nextUrl));
  }

  if (isLoggedIn && pathname.includes('/dashboard/teacher') && role !== 'TEACHER') {
    return Response.redirect(new URL(dashboard, req.nextUrl));
  }

  if (isLoggedIn && pathname.includes('/dashboard/student') && role !== 'STUDENT') {
    return Response.redirect(new URL(dashboard, req.nextUrl));
  }

  if (isLoggedIn && pathname.includes('/booking/') && role !== 'STUDENT') {
    return Response.redirect(new URL(dashboard, req.nextUrl));
  }

  return intlMiddleware(req);
});

export const config = {
  // Public assets bypass locale/auth handling so avatars and other static
  // files are never redirected to locale-prefixed paths.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)'],
};
