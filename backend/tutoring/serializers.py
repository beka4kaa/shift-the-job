from rest_framework import serializers
from django.db.models import Avg

from accounts.serializers import get_user_image_url

from .models import (
    Booking,
    Favorite,
    Message,
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
    student_image = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'student', 'student_name', 'student_image', 'teacher', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'student', 'student_name', 'student_image', 'created_at']

    def get_student_image(self, obj):
        return get_user_image_url(obj.student, self.context.get('request'))


class TeacherCertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherCertificate
        fields = ['id', 'url', 'verification_status', 'verified_at']
        read_only_fields = ['id', 'verification_status', 'verified_at']


class TeacherProfileSerializer(serializers.ModelSerializer):
    """List/detail serializer. `is_verified` mirrors the Next.js app's
    certificatesAreVerified logic: true iff at least one certificate is VERIFIED."""

    name = serializers.CharField(source='user.name', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    image = serializers.SerializerMethodField()
    subjects = serializers.SlugRelatedField(slug_field='name', many=True, read_only=True)
    languages = serializers.SlugRelatedField(slug_field='code', many=True, read_only=True)
    availability = serializers.SerializerMethodField()
    is_verified = serializers.SerializerMethodField()
    reviews = ReviewSerializer(many=True, read_only=True)
    rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    total_students = serializers.SerializerMethodField()

    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'user_id', 'name', 'image', 'headline', 'bio', 'subjects', 'languages',
            'hourly_rate', 'currency', 'experience', 'country', 'city',
            'rating', 'review_count', 'total_students', 'is_verified',
            'availability', 'reviews', 'created_at',
        ]
        read_only_fields = fields

    def get_availability(self, obj):
        return [DAY_LABELS[a.day_of_week] for a in obj.availabilities.all() if 0 <= a.day_of_week < 7]

    def get_image(self, obj):
        return get_user_image_url(obj.user, self.context.get('request'))

    def get_is_verified(self, obj):
        return obj.verified or obj.certificates.filter(verification_status=TeacherCertificate.VerificationStatus.VERIFIED).exists()

    def get_rating(self, obj):
        annotated = getattr(obj, 'calculated_rating', None)
        value = annotated if annotated is not None else obj.reviews.aggregate(value=Avg('rating'))['value']
        return round(value or 0, 1)

    def get_review_count(self, obj):
        annotated = getattr(obj, 'calculated_review_count', None)
        return annotated if annotated is not None else obj.reviews.count()

    def get_total_students(self, obj):
        annotated = getattr(obj, 'calculated_total_students', None)
        if annotated is not None:
            return annotated
        return obj.bookings.filter(status__in=[Booking.Status.CONFIRMED, Booking.Status.COMPLETED]).values('student_id').distinct().count()


class TeacherProfileWriteSerializer(serializers.ModelSerializer):
    """Read + write serializer for a teacher editing their OWN profile at
    /api/teachers/me/. subjects/languages/availability are flat string lists
    here (the related rows are rebuilt on save), so the settings form can send
    plain arrays. name/image mirror the linked user and are read-only."""

    name = serializers.CharField(source='user.name', read_only=True)
    image = serializers.SerializerMethodField()
    subjects = serializers.ListField(child=serializers.CharField(max_length=100), required=False, write_only=True)
    languages = serializers.ListField(child=serializers.CharField(max_length=50), required=False, write_only=True)
    availability = serializers.ListField(child=serializers.CharField(max_length=10), required=False, write_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    total_students = serializers.SerializerMethodField()

    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'name', 'image', 'headline', 'bio', 'hourly_rate', 'currency',
            'experience', 'country', 'city', 'timezone', 'verified',
            'rating', 'review_count', 'total_students',
            'subjects', 'languages', 'availability', 'reviews',
        ]
        read_only_fields = [
            'id', 'name', 'image', 'verified', 'rating', 'review_count', 'total_students',
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['subjects'] = [s.name for s in instance.subjects.all()]
        data['languages'] = [lang.code for lang in instance.languages.all()]
        data['availability'] = [
            DAY_LABELS[a.day_of_week] for a in instance.availabilities.all() if 0 <= a.day_of_week < 7
        ]
        return data

    def get_image(self, obj):
        return get_user_image_url(obj.user, self.context.get('request'))

    def get_rating(self, obj):
        value = obj.reviews.aggregate(value=Avg('rating'))['value']
        return round(value or 0, 1)

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_total_students(self, obj):
        return obj.bookings.filter(status__in=[Booking.Status.CONFIRMED, Booking.Status.COMPLETED]).values('student_id').distinct().count()

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
    # Display fields so dashboards can render the other party without extra
    # round-trips (teacher-side sees the student, student-side sees the teacher).
    teacher_name = serializers.CharField(source='teacher.user.name', read_only=True)
    teacher_image = serializers.SerializerMethodField()
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_image = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'student', 'teacher', 'teacher_name', 'teacher_image',
            'student_name', 'student_image', 'subject', 'date', 'duration',
            'price', 'platform_fee', 'currency', 'status',
            'stripe_payment_id', 'meeting_link', 'notes', 'created_at',
        ]
        read_only_fields = [
            'id', 'student', 'teacher_name', 'teacher_image', 'student_name',
            'student_image', 'price', 'platform_fee', 'currency', 'status', 'created_at',
        ]

    def create(self, validated_data):
        validated_data['student'] = self.context['request'].user
        teacher = validated_data['teacher']
        duration = validated_data['duration']
        amount = (teacher.hourly_rate / 60) * duration
        validated_data['price'] = amount
        validated_data['platform_fee'] = amount * 0.15
        validated_data['currency'] = teacher.currency
        return super().create(validated_data)

    def get_teacher_image(self, obj):
        return get_user_image_url(obj.teacher.user, self.context.get('request'))

    def get_student_image(self, obj):
        return get_user_image_url(obj.student, self.context.get('request'))


class FavoriteSerializer(serializers.ModelSerializer):
    teacher = TeacherProfileSerializer(read_only=True)
    teacher_id = serializers.PrimaryKeyRelatedField(
        queryset=TeacherProfile.objects.all(), source='teacher', write_only=True
    )

    class Meta:
        model = Favorite
        fields = ['id', 'teacher', 'teacher_id', 'created_at']
        read_only_fields = ['id', 'teacher', 'created_at']

    def validate_teacher_id(self, teacher):
        user = self.context['request'].user
        if user.role != user.Role.STUDENT:
            raise serializers.ValidationError('Only student accounts can save tutors.')
        if teacher.user_id == user.id:
            raise serializers.ValidationError('You cannot save your own teaching profile.')
        if Favorite.objects.filter(user=user, teacher=teacher).exists():
            raise serializers.ValidationError('This tutor is already in your favorites.')
        return teacher

    def create(self, validated_data):
        return Favorite.objects.create(user=self.context['request'].user, **validated_data)


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    recipient_name = serializers.CharField(source='recipient.name', read_only=True)
    sender_image = serializers.SerializerMethodField()
    recipient_image = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'sender_name', 'sender_image', 'recipient',
            'recipient_name', 'recipient_image', 'body', 'read_at', 'created_at',
        ]
        read_only_fields = [
            'id', 'sender', 'sender_name', 'sender_image', 'recipient_name',
            'recipient_image', 'read_at', 'created_at',
        ]

    def validate(self, attrs):
        if attrs.get('recipient') == self.context['request'].user:
            raise serializers.ValidationError('You cannot message yourself.')
        return attrs

    def create(self, validated_data):
        return Message.objects.create(sender=self.context['request'].user, **validated_data)

    def get_sender_image(self, obj):
        return get_user_image_url(obj.sender, self.context.get('request'))

    def get_recipient_image(self, obj):
        return get_user_image_url(obj.recipient, self.context.get('request'))
