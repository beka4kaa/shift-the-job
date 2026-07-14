import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;

    if (session?.metadata?.bookingId) {
      await prisma.booking.update({
        where: {
          id: session.metadata.bookingId,
        },
        data: {
          status: 'CONFIRMED',
          stripePaymentId: session.payment_intent as string,
        },
      });
      // Optionally: send email confirmation
    }
  }

  return new NextResponse('OK', { status: 200 });
}
