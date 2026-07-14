// Seeds one real, VERIFIED teacher (plus an admin reviewer) so the trust-layer
// signal loop works end to end: visit the teacher's profile, flip the
// certificate's verificationStatus in Prisma Studio, and watch the badge toggle.
//
// Idempotent: re-running upserts the same users and only creates the profile
// once. Run with:  node prisma/seed.mjs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@youteach.dev';
const TEACHER_EMAIL = 'aigerim.tutor@youteach.dev';

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: 'ADMIN' },
    create: { name: 'Youteach Admin', email: ADMIN_EMAIL, role: 'ADMIN' },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: TEACHER_EMAIL },
    update: { role: 'TEACHER' },
    create: {
      name: 'Aigerim Nurlanova',
      email: TEACHER_EMAIL,
      role: 'TEACHER',
      image: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Aigerim',
    },
  });

  const existing = await prisma.teacherProfile.findUnique({
    where: { userId: teacherUser.id },
  });

  if (existing) {
    console.log('Teacher profile already seeded.');
    console.log(`Profile id: ${existing.id}`);
    console.log(`Visit: /en/teachers/${existing.id}`);
    return;
  }

  const profile = await prisma.teacherProfile.create({
    data: {
      userId: teacherUser.id,
      headline: 'Math Tutor | 10+ Years | School & Olympiad Prep',
      bio: 'I help school students build real confidence in math, from fixing gaps in the fundamentals to olympiad-level problem solving. Every plan is tailored to the student.',
      hourlyRate: 25,
      currency: 'USD',
      experience: 10,
      country: 'Kazakhstan',
      city: 'Almaty',
      timezone: 'Asia/Almaty',
      rating: 4.9,
      reviewCount: 0,
      totalStudents: 120,
      verified: true,
      featured: false,
      subjects: {
        create: [{ name: 'Mathematics' }, { name: 'Algebra' }, { name: 'Geometry' }],
      },
      languages: {
        create: [{ code: 'English' }, { code: 'Russian' }, { code: 'Kazakh' }],
      },
      availabilities: {
        // dayOfWeek 0..4 => Mon-Fri (see DAY_LABELS in src/lib/teacher-profile.ts)
        create: [0, 1, 2, 3, 4].map((dayOfWeek) => ({
          dayOfWeek,
          startTime: '16:00',
          endTime: '20:00',
        })),
      },
      certificates: {
        create: [
          {
            url: 'https://example.com/aigerim-math-degree.pdf',
            verificationStatus: 'VERIFIED',
            verifiedAt: new Date(),
            reviewedBy: admin.id,
            adminNote: 'Seed: degree verified for demo.',
          },
        ],
      },
    },
  });

  console.log('Seeded verified teacher.');
  console.log(`Profile id: ${profile.id}`);
  console.log(`Visit: /en/teachers/${profile.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
