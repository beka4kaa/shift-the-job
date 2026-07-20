from unittest.mock import MagicMock, patch

from rest_framework.test import APITestCase

from accounts.models import User
from .models import (
    Booking,
    Favorite,
    Message,
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
        # verified defaults to True so most tests get an approved, publicly
        # listed/bookable teacher; gate tests pass verified=False explicitly.
        headline='Math Tutor', bio='Bio', hourly_rate=25.0, currency='USD',
        experience=10, country='Kazakhstan', city='Almaty', verified=True,
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

    def test_unverified_teacher_is_hidden_from_the_public_listing(self):
        make_teacher(email='approved@example.com', verified=True)
        make_teacher(email='pending@example.com', verified=False)
        res = self.client.get('/api/teachers/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['name'], 'Teacher')  # only the approved one

    def test_unverified_teacher_detail_is_not_publicly_viewable(self):
        teacher = make_teacher(verified=False)
        res = self.client.get(f'/api/teachers/{teacher.id}/')
        self.assertEqual(res.status_code, 404)

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


class MyTeacherProfileAPITests(APITestCase):
    URL = '/api/teachers/me/'

    def test_requires_authentication(self):
        self.assertEqual(self.client.get(self.URL).status_code, 401)

    def test_students_are_forbidden(self):
        student = User.objects.create_user(email='s@example.com', name='S', password='pw123456')
        self.client.force_authenticate(user=student)
        self.assertEqual(self.client.get(self.URL).status_code, 403)

    def test_get_creates_blank_profile_on_first_access(self):
        teacher_user = User.objects.create_user(
            email='t@example.com', name='T', password='pw123456', role=User.Role.TEACHER
        )
        self.client.force_authenticate(user=teacher_user)
        self.assertFalse(TeacherProfile.objects.filter(user=teacher_user).exists())
        res = self.client.get(self.URL)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(TeacherProfile.objects.filter(user=teacher_user).exists())
        self.assertEqual(res.data['name'], 'T')

    def test_put_updates_scalars_and_nested_lists(self):
        teacher = make_teacher(email='u@example.com')
        self.client.force_authenticate(user=teacher.user)
        payload = {
            'headline': 'IELTS Coach', 'bio': 'New bio', 'hourly_rate': 40,
            'currency': 'USD', 'experience': 6, 'country': 'Kazakhstan', 'city': 'Astana',
            'subjects': ['IELTS', 'English'], 'languages': ['English', 'Russian'],
            'availability': ['Mon', 'Wed', 'Fri'],
        }
        res = self.client.put(self.URL, payload, format='json')
        self.assertEqual(res.status_code, 200)
        teacher.refresh_from_db()
        self.assertEqual(teacher.headline, 'IELTS Coach')
        self.assertEqual(teacher.hourly_rate, 40)
        self.assertEqual(sorted(s.name for s in teacher.subjects.all()), ['English', 'IELTS'])
        self.assertEqual(sorted(lang.code for lang in teacher.languages.all()), ['English', 'Russian'])
        self.assertEqual(sorted(a.day_of_week for a in teacher.availabilities.all()), [0, 2, 4])

    def test_put_replaces_previous_nested_lists(self):
        teacher = make_teacher(email='v@example.com')
        TeacherSubject.objects.create(teacher_profile=teacher, name='OldSubject')
        self.client.force_authenticate(user=teacher.user)
        res = self.client.patch(self.URL, {'subjects': ['NewSubject']}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual([s.name for s in teacher.subjects.all()], ['NewSubject'])

    def test_cannot_change_verified_flag(self):
        teacher = make_teacher(email='w@example.com', verified=False)
        self.client.force_authenticate(user=teacher.user)
        res = self.client.patch(self.URL, {'verified': True}, format='json')
        self.assertEqual(res.status_code, 200)
        teacher.refresh_from_db()
        self.assertFalse(teacher.verified)


class BookingAPITests(APITestCase):
    def test_create_requires_authentication(self):
        teacher = make_teacher()
        res = self.client.post('/api/bookings/', {
            'teacher': teacher.id, 'subject': 'Mathematics', 'date': '2026-08-01T14:00:00Z', 'duration': 60,
        })
        self.assertEqual(res.status_code, 401)

    def test_direct_creation_is_rejected_so_payment_cannot_be_bypassed(self):
        teacher = make_teacher(hourly_rate=30.0)
        student = User.objects.create_user(email='student@example.com', name='Student', password='pw123456')
        self.client.force_authenticate(user=student)

        res = self.client.post('/api/bookings/', {
            'teacher': teacher.id, 'subject': 'Mathematics', 'date': '2026-08-01T14:00:00Z', 'duration': 60,
        })
        self.assertEqual(res.status_code, 405)
        self.assertEqual(Booking.objects.count(), 0)

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

    def test_booking_includes_display_names(self):
        teacher = make_teacher(email='dn@example.com')
        student = User.objects.create_user(email='dns@example.com', name='Dina', password='pw123456')
        Booking.objects.create(
            student=student, teacher=teacher, subject='Mathematics', date='2026-08-01T14:00:00Z',
            duration=60, price=25, platform_fee=3.75, currency='USD',
        )
        self.client.force_authenticate(user=student)
        res = self.client.get('/api/bookings/')
        self.assertEqual(res.data[0]['teacher_name'], 'Teacher')
        self.assertEqual(res.data[0]['student_name'], 'Dina')

    def test_role_teacher_returns_lessons_the_caller_teaches(self):
        teacher = make_teacher(email='rt@example.com')
        student = User.objects.create_user(email='rts@example.com', name='Stu', password='pw123456')
        Booking.objects.create(
            student=student, teacher=teacher, subject='Mathematics', date='2026-08-01T14:00:00Z',
            duration=60, price=25, platform_fee=3.75, currency='USD',
        )
        # As the teacher, ?role=teacher sees the lesson; default (student view) does not.
        self.client.force_authenticate(user=teacher.user)
        as_teacher = self.client.get('/api/bookings/?role=teacher')
        as_student = self.client.get('/api/bookings/')
        self.assertEqual(len(as_teacher.data), 1)
        self.assertEqual(len(as_student.data), 0)


class MyTeacherProfileStatsTests(APITestCase):
    def test_me_endpoint_calculates_stats_from_real_reviews_and_bookings(self):
        teacher = make_teacher(email='st@example.com', rating=4.8, review_count=3, total_students=12)
        student = User.objects.create_user(email='sts@example.com', name='Rev', password='pw123456')
        Review.objects.create(student=student, teacher=teacher, rating=5, comment='Great tutor')
        Booking.objects.create(
            student=student, teacher=teacher, subject='Mathematics', date='2026-08-01T14:00:00Z',
            duration=60, price=25, platform_fee=3.75, currency='USD', status=Booking.Status.CONFIRMED,
        )
        self.client.force_authenticate(user=teacher.user)
        res = self.client.get('/api/teachers/me/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['rating'], 5.0)
        self.assertEqual(res.data['review_count'], 1)
        self.assertEqual(res.data['total_students'], 1)
        self.assertEqual(len(res.data['reviews']), 1)
        self.assertEqual(res.data['reviews'][0]['comment'], 'Great tutor')


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


class FavoriteAPITests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(email='fav@example.com', name='Fav', password='pw123456')
        self.teacher = make_teacher(email='fav-teacher@example.com')
        self.client.force_authenticate(user=self.student)

    def test_create_and_list_favorite(self):
        created = self.client.post('/api/favorites/', {'teacher_id': self.teacher.id}, format='json')
        listed = self.client.get('/api/favorites/')
        self.assertEqual(created.status_code, 201)
        self.assertEqual(len(listed.data), 1)
        self.assertEqual(listed.data[0]['teacher']['id'], self.teacher.id)

    def test_duplicate_favorite_is_rejected(self):
        Favorite.objects.create(user=self.student, teacher=self.teacher)
        res = self.client.post('/api/favorites/', {'teacher_id': self.teacher.id}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_user_cannot_delete_another_users_favorite(self):
        other = User.objects.create_user(email='other-fav@example.com', name='Other', password='pw123456')
        favorite = Favorite.objects.create(user=other, teacher=self.teacher)
        res = self.client.delete(f'/api/favorites/{favorite.id}/')
        self.assertEqual(res.status_code, 404)

    def test_teacher_accounts_cannot_favorite_tutors(self):
        self.client.force_authenticate(user=self.teacher.user)
        res = self.client.post('/api/favorites/', {'teacher_id': self.teacher.id}, format='json')
        self.assertEqual(res.status_code, 400)


class MessageAPITests(APITestCase):
    def setUp(self):
        self.sender = User.objects.create_user(email='sender@example.com', name='Sender', password='pw123456')
        self.recipient = User.objects.create_user(email='recipient@example.com', name='Recipient', password='pw123456')
        self.client.force_authenticate(user=self.sender)

    def test_send_and_list_message(self):
        sent = self.client.post('/api/messages/', {'recipient': self.recipient.id, 'body': 'Hello'}, format='json')
        listed = self.client.get('/api/messages/')
        self.assertEqual(sent.status_code, 201)
        self.assertEqual(len(listed.data), 1)
        self.assertEqual(listed.data[0]['body'], 'Hello')

    def test_messages_are_private_to_participants(self):
        outsider = User.objects.create_user(email='outsider@example.com', name='Out', password='pw123456')
        Message.objects.create(sender=self.recipient, recipient=outsider, body='Private')
        self.assertEqual(len(self.client.get('/api/messages/').data), 0)

    def test_conversation_filter_marks_incoming_messages_read(self):
        message = Message.objects.create(sender=self.recipient, recipient=self.sender, body='Hi')
        res = self.client.get(f'/api/messages/?with={self.recipient.id}')
        self.assertEqual(len(res.data), 1)
        message.refresh_from_db()
        self.assertIsNotNone(message.read_at)

    def test_cannot_message_self(self):
        res = self.client.post('/api/messages/', {'recipient': self.sender.id, 'body': 'Nope'}, format='json')
        self.assertEqual(res.status_code, 400)


class AdminPanelAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='panel-admin@example.com', name='Panel Admin', password='pw123456',
            role=User.Role.ADMIN, is_staff=True,
        )
        self.client.force_authenticate(user=self.admin)

    def test_admin_endpoints_reject_non_admin_users(self):
        student = User.objects.create_user(email='not-admin@example.com', name='No', password='pw123456')
        self.client.force_authenticate(user=student)
        self.assertEqual(self.client.get('/api/admin/summary/').status_code, 403)
        self.assertEqual(self.client.get('/api/admin/users/').status_code, 403)
        self.assertEqual(self.client.post('/api/admin/teachers/', {}, format='json').status_code, 403)

    def test_summary_returns_real_metrics_and_twelve_month_trend(self):
        teacher = make_teacher(email='summary-teacher@example.com')
        student = User.objects.create_user(email='summary-student@example.com', name='Student', password='pw123456')
        Booking.objects.create(
            student=student, teacher=teacher, subject='Math', date='2026-08-01T14:00:00Z', duration=60,
            price=100, platform_fee=15, currency='USD', status=Booking.Status.CONFIRMED,
        )
        res = self.client.get('/api/admin/summary/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['metrics']['gross_revenue'], 100)
        self.assertEqual(res.data['metrics']['platform_revenue'], 15)
        self.assertEqual(res.data['metrics']['teacher_earnings'], 85)
        self.assertEqual(len(res.data['trend']), 12)

    def test_pending_filter_and_metric_surface_unverified_teachers(self):
        make_teacher(email='approved-admin@example.com', verified=True)
        make_teacher(email='pending-admin@example.com', verified=False)
        pending = self.client.get('/api/admin/teachers/?state=pending')
        self.assertEqual(pending.status_code, 200)
        self.assertEqual(len(pending.data), 1)
        self.assertFalse(pending.data[0]['verified'])
        summary = self.client.get('/api/admin/summary/')
        self.assertEqual(summary.data['metrics']['pending_teachers'], 1)

    def test_admin_can_approve_a_pending_teacher(self):
        teacher = make_teacher(email='to-approve@example.com', verified=False)
        res = self.client.patch(f'/api/admin/teachers/{teacher.id}/', {'verified': True}, format='json')
        self.assertEqual(res.status_code, 200)
        teacher.refresh_from_db()
        self.assertTrue(teacher.verified)

    def test_admin_can_create_and_edit_a_teacher(self):
        created = self.client.post('/api/admin/teachers/', {
            'email': 'created-teacher@example.com', 'name': 'Created Teacher', 'password': 'teacher-pass-123',
            'headline': 'Physics mentor', 'bio': 'Helpful', 'hourly_rate': 40, 'currency': 'USD',
            'experience': 5, 'country': 'Kazakhstan', 'city': 'Astana', 'verified': True,
            'subjects': ['Physics', 'Physics', 'Math'], 'languages': ['English', 'Russian'],
            'availability': ['Mon', 'Wed'],
        }, format='json')
        self.assertEqual(created.status_code, 201)
        teacher_id = created.data['id']
        self.assertEqual(created.data['subjects'], ['Physics', 'Math'])
        self.assertTrue(created.data['verified'])
        user = User.objects.get(email='created-teacher@example.com')
        self.assertEqual(user.role, User.Role.TEACHER)
        self.assertTrue(user.check_password('teacher-pass-123'))

        updated = self.client.patch(f'/api/admin/teachers/{teacher_id}/', {
            'headline': 'Senior physics mentor', 'featured': True,
            'subjects': ['Physics'], 'availability': ['Fri'],
        }, format='json')
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.data['headline'], 'Senior physics mentor')
        self.assertEqual(updated.data['subjects'], ['Physics'])
        self.assertEqual(updated.data['availability'], ['Fri'])
        self.assertTrue(updated.data['featured'])

    def test_admin_can_update_booking_operations_fields(self):
        teacher = make_teacher(email='ops-teacher@example.com')
        student = User.objects.create_user(email='ops-student@example.com', name='Student', password='pw123456')
        booking = Booking.objects.create(
            student=student, teacher=teacher, subject='Math', date='2026-08-01T14:00:00Z', duration=60,
            price=25, platform_fee=3.75, currency='USD', status=Booking.Status.PENDING,
        )
        res = self.client.patch(f'/api/admin/bookings/{booking.id}/', {
            'status': 'CONFIRMED', 'meeting_link': 'https://meet.example.com/lesson',
        }, format='json')
        self.assertEqual(res.status_code, 200)
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.Status.CONFIRMED)
        self.assertEqual(booking.meeting_link, 'https://meet.example.com/lesson')

    def test_admin_can_moderate_reviews(self):
        teacher = make_teacher(email='review-admin-teacher@example.com')
        student = User.objects.create_user(email='review-admin-student@example.com', name='Student', password='pw123456')
        review = Review.objects.create(student=student, teacher=teacher, rating=1, comment='Remove me')
        res = self.client.delete(f'/api/admin/reviews/{review.id}/')
        self.assertEqual(res.status_code, 204)
        self.assertFalse(Review.objects.filter(pk=review.id).exists())


class StripeCheckoutAPITests(APITestCase):
    def test_requires_authentication(self):
        teacher = make_teacher()
        res = self.client.post('/api/stripe/checkout/', {
            'teacherId': teacher.id, 'subject': 'Mathematics', 'date': '2026-08-01T14:00:00Z', 'duration': 60,
        }, format='json')
        self.assertEqual(res.status_code, 401)

    def test_returns_404_for_unknown_teacher(self):
        student = User.objects.create_user(email='s1@example.com', name='S1', password='pw123456')
        self.client.force_authenticate(user=student)
        res = self.client.post('/api/stripe/checkout/', {
            'teacherId': 99999, 'subject': 'Mathematics', 'date': '2026-08-01T14:00:00Z', 'duration': 60,
        }, format='json')
        self.assertEqual(res.status_code, 404)

    def test_rejects_missing_date(self):
        teacher = make_teacher()
        student = User.objects.create_user(email='s2@example.com', name='S2', password='pw123456')
        self.client.force_authenticate(user=student)
        res = self.client.post('/api/stripe/checkout/', {
            'teacherId': teacher.id, 'subject': 'Mathematics', 'duration': 60,
        }, format='json')
        self.assertEqual(res.status_code, 400)

    def test_cannot_book_an_unverified_teacher(self):
        teacher = make_teacher(email='pending-checkout@example.com', hourly_rate=30.0, verified=False)
        TeacherSubject.objects.create(teacher_profile=teacher, name='Mathematics')
        student = User.objects.create_user(email='s-gate@example.com', name='SG', password='pw123456')
        self.client.force_authenticate(user=student)
        res = self.client.post('/api/stripe/checkout/', {
            'teacherId': teacher.id, 'subject': 'Mathematics', 'date': '2099-08-01T14:00:00Z', 'duration': 60,
        }, format='json')
        self.assertEqual(res.status_code, 403)
        self.assertFalse(Booking.objects.filter(teacher=teacher).exists())

    @patch('tutoring.stripe_views.stripe.checkout.Session.create')
    def test_creates_a_pending_booking_with_computed_price(self, mock_create):
        mock_create.return_value = MagicMock(url='https://checkout.stripe.com/fake-session')
        teacher = make_teacher(hourly_rate=30.0)
        TeacherSubject.objects.create(teacher_profile=teacher, name='Mathematics')
        student = User.objects.create_user(email='s3@example.com', name='S3', password='pw123456')
        self.client.force_authenticate(user=student)

        res = self.client.post('/api/stripe/checkout/', {
            'teacherId': teacher.id, 'subject': 'Mathematics', 'date': '2026-08-01T14:00:00Z', 'duration': 60,
        }, format='json')

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['url'], 'https://checkout.stripe.com/fake-session')
        booking = Booking.objects.get(student=student)
        self.assertEqual(booking.price, 30.0)
        self.assertAlmostEqual(booking.platform_fee, 4.5)
        self.assertEqual(booking.status, Booking.Status.PENDING)

    @patch('tutoring.stripe_views.stripe.checkout.Session.create')
    def test_stripe_error_removes_the_unpaid_booking(self, mock_create):
        mock_create.side_effect = Exception('stripe boom')
        teacher = make_teacher()
        TeacherSubject.objects.create(teacher_profile=teacher, name='Mathematics')
        student = User.objects.create_user(email='s4@example.com', name='S4', password='pw123456')
        self.client.force_authenticate(user=student)

        res = self.client.post('/api/stripe/checkout/', {
            'teacherId': teacher.id, 'subject': 'Mathematics', 'date': '2026-08-01T14:00:00Z', 'duration': 60,
        }, format='json')
        self.assertEqual(res.status_code, 503)
        self.assertEqual(Booking.objects.filter(student=student).count(), 0)

    def test_rejects_a_subject_the_tutor_does_not_offer(self):
        teacher = make_teacher()
        TeacherSubject.objects.create(teacher_profile=teacher, name='Mathematics')
        student = User.objects.create_user(email='s5@example.com', name='S5', password='pw123456')
        self.client.force_authenticate(user=student)
        res = self.client.post('/api/stripe/checkout/', {
            'teacherId': teacher.id, 'subject': 'Physics', 'date': '2026-08-01T14:00:00Z', 'duration': 60,
        }, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(Booking.objects.count(), 0)

    def test_teacher_accounts_cannot_book_lessons(self):
        teacher = make_teacher()
        TeacherSubject.objects.create(teacher_profile=teacher, name='Mathematics')
        self.client.force_authenticate(user=teacher.user)
        res = self.client.post('/api/stripe/checkout/', {
            'teacherId': teacher.id, 'subject': 'Mathematics', 'date': '2026-08-01T14:00:00Z', 'duration': 60,
        }, format='json')
        self.assertEqual(res.status_code, 403)


class StripeConnectAPITests(APITestCase):
    def test_requires_authentication(self):
        res = self.client.post('/api/stripe/connect/')
        self.assertEqual(res.status_code, 401)

    def test_returns_404_when_requester_has_no_teacher_profile(self):
        student = User.objects.create_user(email='nope@example.com', name='Nope', password='pw123456')
        self.client.force_authenticate(user=student)
        res = self.client.post('/api/stripe/connect/')
        self.assertEqual(res.status_code, 404)

    @patch('tutoring.stripe_views.stripe.AccountLink.create')
    @patch('tutoring.stripe_views.stripe.Account.create')
    def test_creates_a_stripe_account_when_teacher_has_none(self, mock_account_create, mock_link_create):
        mock_account_create.return_value = MagicMock(id='acct_fake123')
        mock_link_create.return_value = MagicMock(url='https://connect.stripe.com/fake-link')
        teacher = make_teacher()
        self.client.force_authenticate(user=teacher.user)

        res = self.client.post('/api/stripe/connect/')

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['url'], 'https://connect.stripe.com/fake-link')
        mock_account_create.assert_called_once()
        teacher.refresh_from_db()
        self.assertEqual(teacher.stripe_account_id, 'acct_fake123')

    @patch('tutoring.stripe_views.stripe.AccountLink.create')
    @patch('tutoring.stripe_views.stripe.Account.create')
    def test_reuses_existing_stripe_account(self, mock_account_create, mock_link_create):
        mock_link_create.return_value = MagicMock(url='https://connect.stripe.com/fake-link')
        teacher = make_teacher(stripe_account_id='acct_existing456')
        self.client.force_authenticate(user=teacher.user)

        res = self.client.post('/api/stripe/connect/')

        self.assertEqual(res.status_code, 200)
        mock_account_create.assert_not_called()


class StripeWebhookAPITests(APITestCase):
    @patch('tutoring.stripe_views.stripe.Webhook.construct_event')
    def test_invalid_signature_returns_400(self, mock_construct_event):
        import stripe as stripe_module
        mock_construct_event.side_effect = stripe_module.error.SignatureVerificationError('bad sig', 'sig_header')

        res = self.client.post(
            '/api/stripe/webhook/', data='{}', content_type='application/json',
            HTTP_STRIPE_SIGNATURE='bad',
        )
        self.assertEqual(res.status_code, 400)

    @patch('tutoring.stripe_views.stripe.Webhook.construct_event')
    def test_checkout_session_completed_confirms_the_booking(self, mock_construct_event):
        teacher = make_teacher()
        student = User.objects.create_user(email='webhook@example.com', name='Webhook', password='pw123456')
        booking = Booking.objects.create(
            student=student, teacher=teacher, subject='Mathematics', date='2026-08-01T14:00:00Z',
            duration=60, price=25, platform_fee=3.75, currency='USD', status=Booking.Status.PENDING,
        )
        mock_construct_event.return_value = {
            'type': 'checkout.session.completed',
            'data': {'object': {'metadata': {'bookingId': str(booking.id)}, 'payment_intent': 'pi_fake789'}},
        }

        res = self.client.post(
            '/api/stripe/webhook/', data='{}', content_type='application/json',
            HTTP_STRIPE_SIGNATURE='valid',
        )

        self.assertEqual(res.status_code, 200)
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.Status.CONFIRMED)
        self.assertEqual(booking.stripe_payment_id, 'pi_fake789')

    @patch('tutoring.stripe_views.stripe.Webhook.construct_event')
    def test_ignores_unrelated_event_types(self, mock_construct_event):
        mock_construct_event.return_value = {'type': 'payment_intent.created', 'data': {'object': {}}}
        res = self.client.post(
            '/api/stripe/webhook/', data='{}', content_type='application/json',
            HTTP_STRIPE_SIGNATURE='valid',
        )
        self.assertEqual(res.status_code, 200)

    @patch('tutoring.stripe_views.stripe.Webhook.construct_event')
    def test_expired_checkout_cancels_pending_booking(self, mock_construct_event):
        teacher = make_teacher(email='expired-teacher@example.com')
        student = User.objects.create_user(email='expired@example.com', name='Expired', password='pw123456')
        booking = Booking.objects.create(
            student=student, teacher=teacher, subject='Mathematics', date='2026-08-01T14:00:00Z',
            duration=60, price=25, platform_fee=3.75, currency='USD', status=Booking.Status.PENDING,
        )
        mock_construct_event.return_value = {
            'type': 'checkout.session.expired',
            'data': {'object': {'metadata': {'bookingId': str(booking.id)}}},
        }
        res = self.client.post(
            '/api/stripe/webhook/', data='{}', content_type='application/json',
            HTTP_STRIPE_SIGNATURE='valid',
        )
        self.assertEqual(res.status_code, 200)
        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.Status.CANCELLED)
