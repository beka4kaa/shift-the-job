from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'image', 'role', 'created_at']
        read_only_fields = ['id', 'role', 'created_at']


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


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(min_length=8)
