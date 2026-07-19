from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import PasswordResetToken, User


class PasswordResetTokenTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='a@example.com', name='A', password='pw123456')

    def test_issue_returns_raw_token_that_hashes_to_stored_value(self):
        raw_token = PasswordResetToken.issue(self.user)
        stored = PasswordResetToken.objects.get(user=self.user)
        self.assertEqual(stored.token_hash, PasswordResetToken.hash_token(raw_token))

    def test_raw_token_is_never_equal_to_its_hash(self):
        raw_token = PasswordResetToken.issue(self.user)
        stored = PasswordResetToken.objects.get(user=self.user)
        self.assertNotEqual(raw_token, stored.token_hash)

    def test_fresh_token_is_usable(self):
        PasswordResetToken.issue(self.user)
        token = PasswordResetToken.objects.get(user=self.user)
        self.assertTrue(token.is_usable())

    def test_expired_token_is_not_usable(self):
        token = PasswordResetToken.objects.create(
            user=self.user,
            token_hash='deadbeef',
            expires_at=timezone.now() - timedelta(minutes=1),
        )
        self.assertFalse(token.is_usable())

    def test_used_token_is_not_usable_even_if_not_expired(self):
        token = PasswordResetToken.objects.create(
            user=self.user,
            token_hash='deadbeef',
            expires_at=timezone.now() + timedelta(hours=1),
            used_at=timezone.now(),
        )
        self.assertFalse(token.is_usable())


class AuthAPITests(APITestCase):
    def test_register_creates_a_user(self):
        res = self.client.post('/api/auth/register/', {
            'email': 'new@example.com', 'name': 'New User', 'password': 'pw123456', 'role': 'STUDENT',
        })
        self.assertEqual(res.status_code, 201)
        self.assertTrue(User.objects.filter(email='new@example.com').exists())

    def test_register_rejects_admin_role(self):
        res = self.client.post('/api/auth/register/', {
            'email': 'sneaky@example.com', 'name': 'Sneaky', 'password': 'pw123456', 'role': 'ADMIN',
        })
        self.assertEqual(res.status_code, 400)

    def test_login_returns_jwt_pair(self):
        User.objects.create_user(email='b@example.com', name='B', password='pw123456')
        res = self.client.post('/api/auth/login/', {'email': 'b@example.com', 'password': 'pw123456'})
        self.assertEqual(res.status_code, 200)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)

    def test_login_rejects_wrong_password(self):
        User.objects.create_user(email='c@example.com', name='C', password='pw123456')
        res = self.client.post('/api/auth/login/', {'email': 'c@example.com', 'password': 'wrong'})
        self.assertEqual(res.status_code, 401)

    def test_me_requires_authentication(self):
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, 401)

    def test_me_returns_current_user_when_authenticated(self):
        user = User.objects.create_user(email='d@example.com', name='D', password='pw123456')
        self.client.force_authenticate(user=user)
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['email'], 'd@example.com')

    def test_forgot_password_same_response_for_real_and_fake_email(self):
        User.objects.create_user(email='e@example.com', name='E', password='pw123456')
        real = self.client.post('/api/auth/forgot-password/', {'email': 'e@example.com'})
        fake = self.client.post('/api/auth/forgot-password/', {'email': 'nobody@nowhere.dev'})
        self.assertEqual(real.status_code, 200)
        self.assertEqual(fake.status_code, 200)
        self.assertEqual(real.data, fake.data)

    def test_forgot_password_issues_a_usable_token(self):
        user = User.objects.create_user(email='f@example.com', name='F', password='pw123456')
        self.client.post('/api/auth/forgot-password/', {'email': 'f@example.com'})
        self.assertEqual(PasswordResetToken.objects.filter(user=user).count(), 1)

    def test_reset_password_rejects_invalid_token(self):
        res = self.client.post('/api/auth/reset-password/', {'token': 'bogus', 'password': 'newpass123'})
        self.assertEqual(res.status_code, 400)

    def test_reset_password_rejects_short_password(self):
        user = User.objects.create_user(email='g@example.com', name='G', password='pw123456')
        raw_token = PasswordResetToken.issue(user)
        res = self.client.post('/api/auth/reset-password/', {'token': raw_token, 'password': 'short'})
        self.assertEqual(res.status_code, 400)

    def test_reset_password_updates_password_and_allows_login(self):
        user = User.objects.create_user(email='h@example.com', name='H', password='oldpass123')
        raw_token = PasswordResetToken.issue(user)
        res = self.client.post('/api/auth/reset-password/', {'token': raw_token, 'password': 'newpass123'})
        self.assertEqual(res.status_code, 200)

        login = self.client.post('/api/auth/login/', {'email': 'h@example.com', 'password': 'newpass123'})
        self.assertEqual(login.status_code, 200)

    def test_reset_password_token_is_single_use(self):
        user = User.objects.create_user(email='i@example.com', name='I', password='pw123456')
        raw_token = PasswordResetToken.issue(user)
        first = self.client.post('/api/auth/reset-password/', {'token': raw_token, 'password': 'newpass123'})
        second = self.client.post('/api/auth/reset-password/', {'token': raw_token, 'password': 'anotherpass123'})
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 400)


@override_settings(GOOGLE_CLIENT_ID='test-client-id')
class GoogleAuthAPITests(APITestCase):
    """The id_token is verified by Google's library, which needs network + real
    Google keys — so verify_oauth2_token is mocked to return a decoded claim set,
    letting us test our find-or-create + JWT-issuing logic in isolation."""

    URL = '/api/auth/google/'

    def _claims(self, **overrides):
        base = {'email': 'g@example.com', 'email_verified': True, 'name': 'Gee', 'picture': 'https://img/g.png'}
        base.update(overrides)
        return base

    @patch('accounts.views.google_id_token.verify_oauth2_token')
    def test_valid_token_creates_user_and_returns_jwt(self, mock_verify):
        mock_verify.return_value = self._claims()
        res = self.client.post(self.URL, {'id_token': 'valid'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['user']['email'], 'g@example.com')
        user = User.objects.get(email='g@example.com')
        self.assertEqual(user.role, User.Role.STUDENT)
        self.assertFalse(user.has_usable_password())

    @patch('accounts.views.google_id_token.verify_oauth2_token')
    def test_valid_token_for_existing_user_does_not_duplicate(self, mock_verify):
        User.objects.create_user(email='g@example.com', name='Existing', password='pw123456')
        mock_verify.return_value = self._claims()
        res = self.client.post(self.URL, {'id_token': 'valid'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(User.objects.filter(email='g@example.com').count(), 1)

    def test_missing_id_token_is_bad_request(self):
        res = self.client.post(self.URL, {}, format='json')
        self.assertEqual(res.status_code, 400)

    @patch('accounts.views.google_id_token.verify_oauth2_token')
    def test_invalid_token_is_unauthorized(self, mock_verify):
        mock_verify.side_effect = ValueError('bad token')
        res = self.client.post(self.URL, {'id_token': 'forged'}, format='json')
        self.assertEqual(res.status_code, 401)

    @patch('accounts.views.google_id_token.verify_oauth2_token')
    def test_unverified_email_is_rejected(self, mock_verify):
        mock_verify.return_value = self._claims(email_verified=False)
        res = self.client.post(self.URL, {'id_token': 'valid'}, format='json')
        self.assertEqual(res.status_code, 401)
        self.assertFalse(User.objects.filter(email='g@example.com').exists())

    @override_settings(GOOGLE_CLIENT_ID='')
    def test_returns_503_when_not_configured(self):
        res = self.client.post(self.URL, {'id_token': 'valid'}, format='json')
        self.assertEqual(res.status_code, 503)
