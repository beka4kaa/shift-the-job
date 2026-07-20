import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DJANGO_API_URL } from '@/lib/django-api';

type RouteParams = { params: Promise<{ path: string[] }> };

async function forward(request: Request, context: RouteParams, method: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN' || !session.djangoAccessToken) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { path } = await context.params;
  const safePath = path.map((segment) => encodeURIComponent(segment)).join('/');
  const incoming = new URL(request.url);
  const endpoint = `${DJANGO_API_URL}/api/admin/${safePath}/${incoming.search}`;

  try {
    const body = method === 'GET' || method === 'HEAD' ? undefined : await request.text();
    const response = await fetch(endpoint, {
      method,
      headers: {
        ...(body ? { 'Content-Type': request.headers.get('Content-Type') || 'application/json' } : {}),
        Authorization: `Bearer ${session.djangoAccessToken}`,
      },
      body,
      cache: 'no-store',
    });
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json' },
    });
  } catch {
    return NextResponse.json({ detail: 'The administration service is unavailable.' }, { status: 502 });
  }
}

export function GET(request: Request, context: RouteParams) { return forward(request, context, 'GET'); }
export function POST(request: Request, context: RouteParams) { return forward(request, context, 'POST'); }
export function PATCH(request: Request, context: RouteParams) { return forward(request, context, 'PATCH'); }
export function DELETE(request: Request, context: RouteParams) { return forward(request, context, 'DELETE'); }
