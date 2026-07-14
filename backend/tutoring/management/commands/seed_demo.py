"""Seeds one admin + one verified teacher so the trust-layer signal loop and
the frontend cutover have real data to point at. Mirrors prisma/seed.mjs.

Idempotent: re-running upserts the same users and skips profile creation if
it already exists. Run with: python manage.py seed_demo
"""

from django.core.management.base import BaseCommand

from accounts.models import User
from tutoring.models import TeacherAvailability, TeacherCertificate, TeacherProfile, TeacherSubject, TeacherLanguage

ADMIN_EMAIL = 'admin@youteach.dev'
TEACHER_EMAIL = 'aigerim.tutor@youteach.dev'


class Command(BaseCommand):
    help = 'Seed one admin and one verified teacher for local development.'

    def handle(self, *args, **options):
        admin, _ = User.objects.get_or_create(
            email=ADMIN_EMAIL,
            defaults={'name': 'Youteach Admin', 'role': User.Role.ADMIN, 'is_staff': True, 'is_superuser': True},
        )

        teacher_user, created_user = User.objects.get_or_create(
            email=TEACHER_EMAIL,
            defaults={'name': 'Aigerim Nurlanova', 'role': User.Role.TEACHER},
        )
        if created_user:
            teacher_user.set_password('demopassword123')
            teacher_user.save(update_fields=['password'])

        profile = TeacherProfile.objects.filter(user=teacher_user).first()
        if profile:
            self.stdout.write(f'Teacher profile already seeded. Profile id: {profile.id}')
            self.stdout.write(f'Visit: /en/teachers/{profile.id}')
            return

        profile = TeacherProfile.objects.create(
            user=teacher_user,
            headline='Math Tutor | 10+ Years | School & Olympiad Prep',
            bio=(
                'I help school students build real confidence in math, from fixing gaps '
                'in the fundamentals to olympiad-level problem solving. Every plan is '
                'tailored to the student.'
            ),
            hourly_rate=25.0,
            currency='USD',
            experience=10,
            country='Kazakhstan',
            city='Almaty',
            timezone='Asia/Almaty',
            rating=4.9,
            review_count=0,
            total_students=120,
            verified=True,
            featured=False,
        )
        for name in ['Mathematics', 'Algebra', 'Geometry']:
            TeacherSubject.objects.create(teacher_profile=profile, name=name)
        for code in ['English', 'Russian', 'Kazakh']:
            TeacherLanguage.objects.create(teacher_profile=profile, code=code)
        for day in range(5):  # Mon-Fri
            TeacherAvailability.objects.create(teacher_profile=profile, day_of_week=day, start_time='16:00', end_time='20:00')
        TeacherCertificate.objects.create(
            teacher_profile=profile,
            url='https://example.com/aigerim-math-degree.pdf',
            verification_status=TeacherCertificate.VerificationStatus.VERIFIED,
            reviewed_by=admin,
            admin_note='Seed: degree verified for demo.',
        )

        self.stdout.write(self.style.SUCCESS(f'Seeded verified teacher. Profile id: {profile.id}'))
        self.stdout.write(f'Visit: /en/teachers/{profile.id}')
