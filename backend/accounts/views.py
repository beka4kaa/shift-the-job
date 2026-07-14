import logging

from django.conf import settings
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PasswordResetToken, User
from .serializers import (
    ForgotPasswordSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
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
