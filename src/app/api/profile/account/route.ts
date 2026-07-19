import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DJANGO_API_URL } from '@/lib/django-api';

/**
 * Server-side proxy to Django's /api/auth/me/ — reads the caller's Django JWT
 * from the session so the raw token never touches client JS (same pattern as
 * the Stripe proxies). GET reads the current user; PATCH updates name/image.
 */
async function forward(method: 'GET' | 'PATCH', body?: string) {
  const session = await auth();
  if (!session?.user || !session.djangoAccessToken) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const res = await fetch(`${DJANGO_API_URL}/api/auth/me/`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.djangoAccessToken}`,
    },
    body,
    cache: 'no-store',
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}

export async function GET() {
  return forward('GET');
}

export async function PATCH(req: Request) {
  return forward('PATCH', await req.text());
}
