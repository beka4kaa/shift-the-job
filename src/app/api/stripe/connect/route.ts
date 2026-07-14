import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DJANGO_API_URL } from '@/lib/django-api';

/**
 * Thin proxy to the Django backend's /api/stripe/connect/ — Stripe Express
 * account onboarding now lives there (see backend/tutoring/stripe_views.py).
 */
export async function POST() {
  const session = await auth();
  if (!session?.user || !session.djangoAccessToken) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const res = await fetch(`${DJANGO_API_URL}/api/stripe/connect/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.djangoAccessToken}`,
      },
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
    });
  } catch (error) {
    console.error('STRIPE_CONNECT_PROXY_ERROR', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
