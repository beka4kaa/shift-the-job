import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateResetToken } from '@/lib/password-reset';

/**
 * Requests a password reset. Always responds with a generic success message
 * regardless of whether the email exists, so this endpoint can't be used to
 * enumerate registered accounts.
 *
 * No email provider is configured yet (see TODOS.md) — the reset link is
 * logged server-side instead of sent. Swap the console.log for a real send
 * once a provider is chosen.
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return new NextResponse('Email is required', { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const { rawToken, tokenHash, expiresAt } = generateResetToken();

      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
      const resetLink = `${origin}/auth/reset-password?token=${rawToken}`;

      // TODO(TODOS.md): replace with real email delivery once a provider is configured.
      console.log(`[password reset] link for ${email}: ${resetLink}`);
    }

    return NextResponse.json({
      message: 'If an account exists for that email, a reset link has been sent.',
    });
  } catch (error) {
    console.error('FORGOT_PASSWORD_ERROR', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
