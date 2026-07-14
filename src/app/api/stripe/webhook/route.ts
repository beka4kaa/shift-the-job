import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { DJANGO_API_URL } from '@/lib/django-api';

/**
 * Thin proxy to the Django backend's /api/stripe/webhook/ — signature
 * verification and booking confirmation now live there. Forwards the raw
 * body unchanged so Django's signature check (over the exact payload bytes
 * Stripe signed) still matches.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') || '';

  const res = await fetch(`${DJANGO_API_URL}/api/stripe/webhook/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': signature,
    },
    body,
  });

  const text = await res.text();
  return new NextResponse(text, { status: res.status });
}
