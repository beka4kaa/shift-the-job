import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { hashResetToken, isResetTokenUsable } from '@/lib/password-reset';

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== 'string') {
      return new NextResponse('Reset token is required', { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return new NextResponse(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, { status: 400 });
    }

    const tokenHash = hashResetToken(token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || !isResetTokenUsable(resetToken)) {
      return new NextResponse('This reset link is invalid or has expired', { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('RESET_PASSWORD_ERROR', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
