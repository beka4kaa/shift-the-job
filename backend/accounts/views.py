import logging

from django.conf import settings
from django.utils import timezone
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import PasswordResetToken, User
from .serializers import (
    ForgotPasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class GoogleAuthView(APIView):
    """Verifies a Google id_token (obtained by the frontend's NextAuth Google
    provider), then finds-or-creates the matching user and issues this backend's
    own JWTs — the same {access, refresh, user} shape as LoginView. This keeps
    Django the source of truth: a Google sign-in produces a real local user and
    a real access token, so bookings/Stripe work identically to password login.
    """

    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('id_token')
        if not token:
            return Response({'detail': 'Missing id_token'}, status=status.HTTP_400_BAD_REQUEST)

        if not settings.GOOGLE_CLIENT_ID:
            logger.error('GOOGLE_AUTH_ERROR: GOOGLE_CLIENT_ID is not configured')
            return Response({'detail': 'Google login is not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            info = google_id_token.verify_oauth2_token(
                token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
        except ValueError:
            # Bad signature, wrong audience, expired token, etc.
            return Response({'detail': 'Invalid Google token'}, status=status.HTTP_401_UNAUTHORIZED)

        email = info.get('email')
        if not email or not info.get('email_verified'):
            return Response({'detail': 'Google account email is not verified'}, status=status.HTTP_401_UNAUTHORIZED)

        email = User.objects.normalize_email(email)
        name = info.get('name') or email.split('@')[0]
        picture = info.get('picture')

        user, created = User.objects.get_or_create(
            email=email,
            defaults={'name': name, 'image': picture},
        )
        if created:
            # Google-only account — no usable password until they set one.
            user.set_unusable_password()
            user.save(update_fields=['password'])
        elif picture and user.image != picture:
            user.image = picture
            user.save(update_fields=['image'])

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


class MeView(generics.RetrieveUpdateAPIView):
    """GET returns the current user; PATCH/PUT lets them edit their own
    name/image (email and role are read-only, enforced by UserSerializer)."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ForgotPasswordView(APIView):
    """Always responds with a generic message regardless of whether the email
    exists, to prevent account enumeration — mirrors the Next.js endpoint at
    src/app/api/auth/forgot-password/route.ts.

    No email provider is configured yet: the reset link is logged instead of
    sent. Swap the logger.info call for real delivery once one is chosen.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            user = None

        if user is not None:
            raw_token = PasswordResetToken.issue(user)
            reset_link = f"{settings.FRONTEND_URL}/auth/reset-password?token={raw_token}"
            # TODO: replace with real email delivery once a provider is configured.
            logger.info('[password reset] link for %s: %s', email, reset_link)

        return Response({'message': 'If an account exists for that email, a reset link has been sent.'})


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        password = serializer.validated_data['password']

        token_hash = PasswordResetToken.hash_token(token)
        try:
            reset_token = PasswordResetToken.objects.select_related('user').get(token_hash=token_hash)
        except PasswordResetToken.DoesNotExist:
            reset_token = None

        if reset_token is None or not reset_token.is_usable():
            return Response(
                {'detail': 'This reset link is invalid or has expired'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = reset_token.user
        user.set_password(password)
        user.save(update_fields=['password'])

        reset_token.used_at = timezone.now()
        reset_token.save(update_fields=['used_at'])

        return Response({'message': 'Password updated successfully'})
