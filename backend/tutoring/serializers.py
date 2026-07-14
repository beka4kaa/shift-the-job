from rest_framework import serializers

from .models import (
    Booking,
    Review,
    Subject,
    TeacherAvailability,
    TeacherCertificate,
    TeacherProfile,
)


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'category', 'icon']


class ReviewSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_image = serializers.CharField(source='student.image', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'student', 'student_name', 'student_image', 'teacher', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'student', 'student_name', 'student_image', 'created_at']


class TeacherCertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherCertificate
        fields = ['id', 'url', 'verification_status', 'verified_at']
        read_only_fields = ['id', 'verification_status', 'verified_at']


class TeacherProfileSerializer(serializers.ModelSerializer):
    """List/detail serializer. `is_verified` mirrors the Next.js app's
    certificatesAreVerified logic: true iff at least one certificate is VERIFIED."""

    name = serializers.CharField(source='user.name', read_only=True)
    image = serializers.CharField(source='user.image', read_only=True)
    subjects = serializers.SlugRelatedField(slug_field='name', many=True, read_only=True)
    languages = serializers.SlugRelatedField(slug_field='code', many=True, read_only=True)
    availability = serializers.SerializerMethodField()
    is_verified = serializers.SerializerMethodField()
    reviews = ReviewSerializer(many=True, read_only=True)

    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'name', 'image', 'headline', 'bio', 'subjects', 'languages',
            'hourly_rate', 'currency', 'experience', 'country', 'city',
            'rating', 'review_count', 'total_students', 'is_verified',
            'availability', 'reviews', 'created_at',
        ]
        read_only_fields = fields

    def get_availability(self, obj):
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        return [days[a.day_of_week] for a in obj.availabilities.all() if 0 <= a.day_of_week < 7]

    def get_is_verified(self, obj):
        return obj.certificates.filter(verification_status=TeacherCertificate.VerificationStatus.VERIFIED).exists()


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            'id', 'student', 'teacher', 'subject', 'date', 'duration',
            'price', 'platform_fee', 'currency', 'status',
            'stripe_payment_id', 'meeting_link', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'student', 'price', 'platform_fee', 'currency', 'status', 'created_at']

    def create(self, validated_data):
        validated_data['student'] = self.context['request'].user
        teacher = validated_data['teacher']
        duration = validated_data['duration']
        amount = (teacher.hourly_rate / 60) * duration
        validated_data['price'] = amount
        validated_data['platform_fee'] = amount * 0.15
        validated_data['currency'] = teacher.currency
        return super().create(validated_data)
