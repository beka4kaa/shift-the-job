import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DJANGO_API_URL } from '@/lib/django-api';

async function forward(method: 'GET' | 'POST', req: Request) {
  const session = await auth();
  if (!session?.user || !session.djangoAccessToken) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const incoming = new URL(req.url);
  const otherUser = incoming.searchParams.get('with');
  const query = otherUser ? `?with=${encodeURIComponent(otherUser)}` : '';
  const res = await fetch(`${DJANGO_API_URL}/api/messages/${query}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.djangoAccessToken}`,
    },
    body: method === 'POST' ? await req.text() : undefined,
    cache: 'no-store',
  });

  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}

export async function GET(req: Request) { return forward('GET', req); }
export async function POST(req: Request) { return forward('POST', req); }
