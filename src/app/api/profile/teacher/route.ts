import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DJANGO_API_URL } from '@/lib/django-api';

/**
 * Server-side proxy to Django's /api/teachers/me/ — the logged-in teacher's own
 * editable profile. GET creates-and-returns a blank profile on first access;
 * PUT saves the full profile (scalars + subjects/languages/availability lists).
 */
async function forward(method: 'GET' | 'PUT', body?: string) {
  const session = await auth();
  if (!session?.user || !session.djangoAccessToken) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const res = await fetch(`${DJANGO_API_URL}/api/teachers/me/`, {
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

export async function PUT(req: Request) {
  return forward('PUT', await req.text());
}
