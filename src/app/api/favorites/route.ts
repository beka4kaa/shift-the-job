import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DJANGO_API_URL } from '@/lib/django-api';

async function forward(method: 'GET' | 'POST' | 'DELETE', req: Request) {
  const session = await auth();
  if (!session?.user || !session.djangoAccessToken) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const endpoint = method === 'DELETE' && id ? `/api/favorites/${id}/` : '/api/favorites/';
  const body = method === 'POST' ? await req.text() : undefined;
  const res = await fetch(`${DJANGO_API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.djangoAccessToken}`,
    },
    body,
    cache: 'no-store',
  });

  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}

export async function GET(req: Request) { return forward('GET', req); }
export async function POST(req: Request) { return forward('POST', req); }
export async function DELETE(req: Request) { return forward('DELETE', req); }
