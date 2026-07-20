import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DJANGO_API_URL } from '@/lib/django-api';

async function requireSession() {
  const session = await auth();
  return session?.user && session.djangoAccessToken ? session : null;
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const incoming = await req.formData();
  const avatar = incoming.get('avatar');
  if (!(avatar instanceof File)) {
    return NextResponse.json({ avatar: ['Choose an image file.'] }, { status: 400 });
  }

  const outgoing = new FormData();
  outgoing.set('avatar', avatar);
  const res = await fetch(`${DJANGO_API_URL}/api/auth/me/avatar/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.djangoAccessToken}` },
    body: outgoing,
    cache: 'no-store',
  });

  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}

export async function DELETE() {
  const session = await requireSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const res = await fetch(`${DJANGO_API_URL}/api/auth/me/avatar/`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.djangoAccessToken}` },
    cache: 'no-store',
  });

  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
  });
}
