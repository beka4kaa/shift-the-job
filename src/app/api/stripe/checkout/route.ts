import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { PLATFORM_FEE } from '@/lib/constants';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { teacherId, subject, date, duration } = body;

    const teacher = await prisma.teacherProfile.findUnique({
      where: { id: teacherId },
      include: { user: true },
    });

    if (!teacher) {
      return new NextResponse('Teacher not found', { status: 404 });
    }

    // Calculate prices
    const amount = (teacher.hourlyRate / 60) * duration;
    const platformFee = amount * PLATFORM_FEE;
    const teacherAmount = amount - platformFee;

    // Create a pending booking
    const booking = await prisma.booking.create({
      data: {
        studentId: session.user.id,
        teacherId: teacher.id,
        subject,
        date: new Date(date),
        duration,
        price: amount,
        platformFee,
        currency: teacher.currency,
        status: 'PENDING',
      },
    });

    // Create Stripe session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: teacher.currency.toLowerCase(),
            product_data: {
              name: `Tutoring Session: ${subject} with ${teacher.user.name}`,
              description: `${duration} minutes on ${new Date(date).toLocaleString()}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/student?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/${teacherId}?cancelled=1`,
      metadata: {
        bookingId: booking.id,
        teacherId: teacher.id,
        studentId: session.user.id,
      },
      payment_intent_data: teacher.stripeAccountId ? {
        application_fee_amount: Math.round(platformFee * 100),
        transfer_data: {
          destination: teacher.stripeAccountId,
        },
      } : undefined, // If teacher doesn't have stripe connect yet, all goes to platform
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error('STRIPE_CHECKOUT_ERROR', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
