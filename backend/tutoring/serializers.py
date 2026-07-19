from rest_framework import serializers

from .models import (
    Booking,
    Review,
    Subject,
    TeacherAvailability,
    TeacherLanguage,
    TeacherSubject,
    TeacherCertificate,
    TeacherProfile,
)

DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']


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
        return [DAY_LABELS[a.day_of_week] for a in obj.availabilities.all() if 0 <= a.day_of_week < 7]

    def get_is_verified(self, obj):
        return obj.certificates.filter(verification_status=TeacherCertificate.VerificationStatus.VERIFIED).exists()


class TeacherProfileWriteSerializer(serializers.ModelSerializer):
    """Read + write serializer for a teacher editing their OWN profile at
    /api/teachers/me/. subjects/languages/availability are flat string lists
    here (the related rows are rebuilt on save), so the settings form can send
    plain arrays. name/image mirror the linked user and are read-only."""

    name = serializers.CharField(source='user.name', read_only=True)
    image = serializers.CharField(source='user.image', read_only=True)
    subjects = serializers.ListField(child=serializers.CharField(max_length=100), required=False, write_only=True)
    languages = serializers.ListField(child=serializers.CharField(max_length=50), required=False, write_only=True)
    availability = serializers.ListField(child=serializers.CharField(max_length=10), required=False, write_only=True)

    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'name', 'image', 'headline', 'bio', 'hourly_rate', 'currency',
            'experience', 'country', 'city', 'timezone', 'verified',
            'subjects', 'languages', 'availability',
        ]
        read_only_fields = ['id', 'name', 'image', 'verified']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['subjects'] = [s.name for s in instance.subjects.all()]
        data['languages'] = [lang.code for lang in instance.languages.all()]
        data['availability'] = [
            DAY_LABELS[a.day_of_week] for a in instance.availabilities.all() if 0 <= a.day_of_week < 7
        ]
        return data

    def update(self, instance, validated_data):
        subjects = validated_data.pop('subjects', None)
        languages = validated_data.pop('languages', None)
        availability = validated_data.pop('availability', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Nested lists are replaced wholesale — simplest correct semantics for a
        # settings form that always submits the full current set.
        if subjects is not None:
            instance.subjects.all().delete()
            TeacherSubject.objects.bulk_create(
                [TeacherSubject(teacher_profile=instance, name=s) for s in subjects if s.strip()]
            )
        if languages is not None:
            instance.languages.all().delete()
            TeacherLanguage.objects.bulk_create(
                [TeacherLanguage(teacher_profile=instance, code=c) for c in languages if c.strip()]
            )
        if availability is not None:
            instance.availabilities.all().delete()
            TeacherAvailability.objects.bulk_create([
                TeacherAvailability(
                    teacher_profile=instance, day_of_week=DAY_LABELS.index(label),
                    start_time='09:00', end_time='17:00',
                )
                for label in availability if label in DAY_LABELS
            ])
        return instance


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
