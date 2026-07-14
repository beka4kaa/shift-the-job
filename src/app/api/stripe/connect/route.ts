import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    });

    if (!teacher) {
      return new NextResponse('Teacher profile not found', { status: 404 });
    }

    let accountId = teacher.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: teacher.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      
      accountId = account.id;

      await prisma.teacherProfile.update({
        where: { id: teacher.id },
        data: { stripeAccountId: accountId },
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/teacher?stripe_refresh=1`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/teacher?stripe_success=1`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('STRIPE_CONNECT_ERROR', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
