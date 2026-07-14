import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DJANGO_API_URL } from '@/lib/django-api';

/**
 * Thin proxy to the Django backend's /api/stripe/checkout/ — booking
 * creation and Stripe session creation now live there (see backend/tutoring/stripe_views.py).
 * This route only forwards the request with the caller's Django JWT.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !session.djangoAccessToken) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.text();
    const res = await fetch(`${DJANGO_API_URL}/api/stripe/checkout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.djangoAccessToken}`,
      },
      body,
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
    });
  } catch (error) {
    console.error('STRIPE_CHECKOUT_PROXY_ERROR', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
