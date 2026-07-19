import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DJANGO_API_URL } from '@/lib/django-api';

/**
 * Server-side proxy to Django's /api/bookings/ — reads the caller's Django JWT
 * from the session so the token never touches client JS. Forwards the `role`
 * query param (?role=teacher lists lessons the caller teaches).
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || !session.djangoAccessToken) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const role = new URL(req.url).searchParams.get('role');
  const qs = role === 'teacher' ? '?role=teacher' : '';

  const res = await fetch(`${DJANGO_API_URL}/api/bookings/${qs}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.djangoAccessToken}`,
    },
    cache: 'no-store',
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}
