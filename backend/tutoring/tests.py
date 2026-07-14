from rest_framework.test import APITestCase

from accounts.models import User
from .models import (
    Booking,
    Review,
    TeacherAvailability,
    TeacherCertificate,
    TeacherLanguage,
    TeacherProfile,
    TeacherSubject,
)


def make_teacher(email='teacher@example.com', **overrides):
    user = User.objects.create_user(email=email, name='Teacher', password='pw123456', role=User.Role.TEACHER)
    defaults = dict(
        headline='Math Tutor', bio='Bio', hourly_rate=25.0, currency='USD',
        experience=10, country='Kazakhstan', city='Almaty',
    )
    defaults.update(overrides)
    return TeacherProfile.objects.create(user=user, **defaults)


class TeacherProfileAPITests(APITestCase):
    def test_list_is_public(self):
        make_teacher()
        res = self.client.get('/api/teachers/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)

    def test_is_verified_true_when_a_certificate_is_verified(self):
        teacher = make_teacher()
        TeacherCertificate.objects.create(
            teacher_profile=teacher, url='https://example.com/c.pdf',
            verification_status=TeacherCertificate.VerificationStatus.VERIFIED,
        )
        res = self.client.get(f'/api/teachers/{teacher.id}/')
        self.assertTrue(res.data['is_verified'])

    def test_is_verified_false_when_no_certificate_is_verified(self):
        teacher = make_teacher()
        TeacherCertificate.objects.create(
            teacher_profile=teacher, url='https://example.com/c.pdf',
            verification_status=TeacherCertificate.VerificationStatus.PENDING,
        )
        res = self.client.get(f'/api/teachers/{teacher.id}/')
        self.assertFalse(res.data['is_verified'])

    def test_is_verified_false_with_no_certificates_at_all(self):
        teacher = make_teacher()
        res = self.client.get(f'/api/teachers/{teacher.id}/')
        self.assertFalse(res.data['is_verified'])

    def test_subjects_and_languages_serialize_as_plain_string_lists(self):
        teacher = make_teacher()
        TeacherSubject.objects.create(teacher_profile=teacher, name='Mathematics')
        TeacherLanguage.objects.create(teacher_profile=teacher, code='English')
        res = self.client.get(f'/api/teachers/{teacher.id}/')
        self.assertEqual(res.data['subjects'], ['Mathematics'])
        self.assertEqual(res.data['languages'], ['English'])

    def test_availability_maps_day_of_week_to_labels(self):
        teacher = make_teacher()
        TeacherAvailability.objects.create(teacher_profile=teacher, day_of_week=0, start_time='09:00', end_time='10:00')
        TeacherAvailability.objects.create(teacher_profile=teacher, day_of_week=4, start_time='09:00', end_time='10:00')
        res = self.client.get(f'/api/teachers/{teacher.id}/')
        self.assertEqual(sorted(res.data['availability']), ['Fri', 'Mon'])


class BookingAPITests(APITestCase):
    def test_create_requires_authentication(self):
        teacher = make_teacher()
        res = self.client.post('/api/bookings/', {
            'teacher': teacher.id, 'subject': 'Mathematics', 'date': '2026-08-01T14:00:00Z', 'duration': 60,
        })
        self.assertEqual(res.status_code, 401)

    def test_create_computes_price_and_platform_fee_from_hourly_rate(self):
        teacher = make_teacher(hourly_rate=30.0)
        student = User.objects.create_user(email='student@example.com', name='Student', password='pw123456')
        self.client.force_authenticate(user=student)

        res = self.client.post('/api/bookings/', {
            'teacher': teacher.id, 'subject': 'Mathematics', 'date': '2026-08-01T14:00:00Z', 'duration': 60,
        })
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['price'], 30.0)
        self.assertAlmostEqual(res.data['platform_fee'], 4.5)
        self.assertEqual(res.data['status'], 'PENDING')

    def test_student_cannot_set_price_or_status_directly(self):
        teacher = make_teacher(hourly_rate=30.0)
        student = User.objects.create_user(email='student2@example.com', name='Student2', password='pw123456')
        self.client.force_authenticate(user=student)

        res = self.client.post('/api/bookings/', {
            'teacher': teacher.id, 'subject': 'Mathematics', 'date': '2026-08-01T14:00:00Z',
            'duration': 60, 'price': 0.01, 'status': 'COMPLETED',
        })
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['price'], 30.0)
        self.assertEqual(res.data['status'], 'PENDING')

    def test_list_only_returns_the_requesting_students_own_bookings(self):
        teacher = make_teacher()
        student_a = User.objects.create_user(email='sa@example.com', name='SA', password='pw123456')
        student_b = User.objects.create_user(email='sb@example.com', name='SB', password='pw123456')
        Booking.objects.create(
            student=student_a, teacher=teacher, subject='Mathematics', date='2026-08-01T14:00:00Z',
            duration=60, price=25, platform_fee=3.75, currency='USD',
        )
        Booking.objects.create(
            student=student_b, teacher=teacher, subject='Mathematics', date='2026-08-02T14:00:00Z',
            duration=60, price=25, platform_fee=3.75, currency='USD',
        )

        self.client.force_authenticate(user=student_a)
        res = self.client.get('/api/bookings/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['student'], student_a.id)


class ReviewAPITests(APITestCase):
    def test_create_requires_authentication(self):
        teacher = make_teacher()
        res = self.client.post('/api/reviews/', {'teacher': teacher.id, 'rating': 5, 'comment': 'Great!'})
        self.assertEqual(res.status_code, 401)

    def test_create_attaches_the_authenticated_student_as_author(self):
        teacher = make_teacher()
        student = User.objects.create_user(email='reviewer@example.com', name='Reviewer', password='pw123456')
        self.client.force_authenticate(user=student)

        res = self.client.post('/api/reviews/', {'teacher': teacher.id, 'rating': 5, 'comment': 'Great!'})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['student'], student.id)
        self.assertEqual(Review.objects.count(), 1)

    def test_filter_by_teacher_query_param(self):
        teacher_a = make_teacher(email='ta@example.com')
        teacher_b = make_teacher(email='tb@example.com')
        student = User.objects.create_user(email='reviewer2@example.com', name='Reviewer2', password='pw123456')
        Review.objects.create(student=student, teacher=teacher_a, rating=5, comment='A')
        Review.objects.create(student=student, teacher=teacher_b, rating=4, comment='B')

        res = self.client.get(f'/api/reviews/?teacher={teacher_a.id}')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['comment'], 'A')
