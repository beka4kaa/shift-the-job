import createMiddleware from 'next-intl/middleware';
import { auth } from '@/auth';

const intlMiddleware = createMiddleware({
  locales: ['en', 'ru', 'kz'],
  defaultLocale: 'en'
});

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // We want to skip auth checks for public routes, but still run next-intl
  const publicPathnameRegex = RegExp(
    `^(/([a-z]{2}))?(/auth.*|/teachers.*|/)?$`,
    'i'
  );

  const isPublicPage = publicPathnameRegex.test(pathname);
  const isDashboardRoute = pathname.includes('/dashboard');

  if (isLoggedIn && pathname.includes('/auth/login')) {
    return Response.redirect(new URL('/en/dashboard/student', req.nextUrl));
  }

  if (!isLoggedIn && isDashboardRoute) {
    return Response.redirect(new URL('/en/auth/login', req.nextUrl));
  }

  return intlMiddleware(req as any);
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
