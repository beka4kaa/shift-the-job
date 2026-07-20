from django.conf import settings
from django.urls import reverse
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


def get_user_image_url(user, request=None):
    """Prefer an upload, then Google/external photo, then the local default."""
    if user.avatar_updated_at:
        path = reverse('avatar', kwargs={'user_id': user.id})
        # Microsecond precision prevents two quick consecutive uploads from
        # reusing the same cache key and showing the previous image for an hour.
        path = f'{path}?v={int(user.avatar_updated_at.timestamp() * 1_000_000)}'
        return request.build_absolute_uri(path) if request else path
    if user.image:
        return user.image
    return f"{settings.FRONTEND_URL.rstrip('/')}/default-avatar.svg"


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'image', 'role', 'created_at']
        # email is the login identifier and role is privilege-bearing, so both
        # stay read-only — only name/image are user-editable via PATCH /me/.
        read_only_fields = ['id', 'email', 'role', 'created_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['image'] = get_user_image_url(instance, self.context.get('request'))
        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'name', 'password', 'role']

    def validate_role(self, value):
        if value not in (User.Role.STUDENT, User.Role.TEACHER):
            raise serializers.ValidationError('role must be STUDENT or TEACHER')
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(TokenObtainPairSerializer):
    """Adds the user's profile fields to the token response so the frontend
    (NextAuth) doesn't need a second round-trip to /api/auth/me/ on login."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user, context=self.context).data
        return data


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(min_length=8)
