from calendar import month_abbr
from datetime import datetime, timedelta

from django.db import transaction
from django.db.models import Avg, Count, Q, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.serializers import get_user_image_url

from .models import (
    Booking,
    Review,
    TeacherAvailability,
    TeacherLanguage,
    TeacherProfile,
    TeacherSubject,
)
from .serializers import BookingSerializer, DAY_LABELS, ReviewSerializer


PAID_STATUSES = [Booking.Status.CONFIRMED, Booking.Status.COMPLETED]


class IsAdminRole(permissions.BasePermission):
    message = 'Administrator access is required.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
            and request.user.role == User.Role.ADMIN
        )


class AdminUserSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    student_bookings = serializers.IntegerField(read_only=True, default=0)
    taught_bookings = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'image', 'role', 'is_active', 'is_staff',
            'student_bookings', 'taught_bookings', 'created_at',
        ]
        read_only_fields = ['id', 'image', 'is_staff', 'student_bookings', 'taught_bookings', 'created_at']

    def get_image(self, obj):
        return get_user_image_url(obj, self.context.get('request'))

    def validate_role(self, value):
        if value not in (User.Role.STUDENT, User.Role.TEACHER, User.Role.ADMIN):
            raise serializers.ValidationError('Unsupported role.')
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        if self.instance and request and self.instance.pk == request.user.pk:
            if attrs.get('is_active') is False:
                raise serializers.ValidationError('You cannot deactivate your own account.')
            if attrs.get('role') and attrs['role'] != User.Role.ADMIN:
                raise serializers.ValidationError('You cannot remove your own administrator role.')
        return attrs


class AdminTeacherSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    name = serializers.CharField(source='user.name', read_only=True)
    image = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    subjects = serializers.SerializerMethodField()
    languages = serializers.SerializerMethodField()
    availability = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    booking_count = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    gross_revenue = serializers.SerializerMethodField()
    platform_revenue = serializers.SerializerMethodField()
    teacher_earnings = serializers.SerializerMethodField()

    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'user_id', 'email', 'name', 'image', 'is_active', 'headline', 'bio',
            'subjects', 'languages', 'availability', 'hourly_rate', 'currency',
            'experience', 'country', 'city', 'timezone', 'verified', 'featured',
            'stripe_account_id', 'review_count', 'average_rating', 'booking_count',
            'student_count', 'gross_revenue', 'platform_revenue', 'teacher_earnings',
            'created_at',
        ]

    def get_image(self, obj):
        return get_user_image_url(obj.user, self.context.get('request'))

    def get_subjects(self, obj):
        return [subject.name for subject in obj.subjects.all()]

    def get_languages(self, obj):
        return [language.code for language in obj.languages.all()]

    def get_availability(self, obj):
        return [
            DAY_LABELS[row.day_of_week]
            for row in obj.availabilities.all()
            if 0 <= row.day_of_week < len(DAY_LABELS)
        ]

    def get_teacher_earnings(self, obj):
        metrics = self._metrics(obj)
        return round(metrics['gross_revenue'] - metrics['platform_revenue'], 2)

    def _metrics(self, obj):
        if not hasattr(obj, '_admin_metrics_cache'):
            review = obj.reviews.aggregate(count=Count('id'), average=Avg('rating'))
            paid = obj.bookings.filter(status__in=PAID_STATUSES)
            booking = paid.aggregate(
                count=Count('id'),
                students=Count('student_id', distinct=True),
                gross=Sum('price', default=0),
                platform=Sum('platform_fee', default=0),
            )
            obj._admin_metrics_cache = {
                'review_count': review['count'] or 0,
                'average_rating': round(review['average'] or 0, 1),
                'booking_count': booking['count'] or 0,
                'student_count': booking['students'] or 0,
                'gross_revenue': round(booking['gross'] or 0, 2),
                'platform_revenue': round(booking['platform'] or 0, 2),
            }
        return obj._admin_metrics_cache

    def get_review_count(self, obj):
        return self._metrics(obj)['review_count']

    def get_average_rating(self, obj):
        return self._metrics(obj)['average_rating']

    def get_booking_count(self, obj):
        return self._metrics(obj)['booking_count']

    def get_student_count(self, obj):
        return self._metrics(obj)['student_count']

    def get_gross_revenue(self, obj):
        return self._metrics(obj)['gross_revenue']

    def get_platform_revenue(self, obj):
        return self._metrics(obj)['platform_revenue']


class AdminTeacherWriteSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(max_length=255)
    password = serializers.CharField(min_length=8, required=False, allow_blank=True, write_only=True)
    is_active = serializers.BooleanField(default=True)
    headline = serializers.CharField(max_length=255, allow_blank=True, required=False, default='')
    bio = serializers.CharField(allow_blank=True, required=False, default='')
    hourly_rate = serializers.FloatField(min_value=0, required=False, default=0)
    currency = serializers.ChoiceField(choices=['USD', 'EUR', 'GBP', 'KZT'], required=False, default='USD')
    experience = serializers.IntegerField(min_value=0, required=False, default=0)
    country = serializers.CharField(max_length=100, allow_blank=True, required=False, default='')
    city = serializers.CharField(max_length=100, allow_blank=True, required=False, default='')
    timezone = serializers.CharField(max_length=100, required=False, default='UTC')
    verified = serializers.BooleanField(required=False, default=False)
    featured = serializers.BooleanField(required=False, default=False)
    subjects = serializers.ListField(child=serializers.CharField(max_length=100), required=False, default=list)
    languages = serializers.ListField(child=serializers.CharField(max_length=50), required=False, default=list)
    availability = serializers.ListField(child=serializers.ChoiceField(choices=DAY_LABELS), required=False, default=list)

    def validate_email(self, value):
        queryset = User.objects.filter(email=User.objects.normalize_email(value))
        profile = self.context.get('profile')
        if profile:
            queryset = queryset.exclude(pk=profile.user_id)
        if queryset.exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return User.objects.normalize_email(value)

    @staticmethod
    def _dedupe(values):
        result = []
        seen = set()
        for value in values:
            cleaned = value.strip()
            key = cleaned.casefold()
            if cleaned and key not in seen:
                result.append(cleaned)
                seen.add(key)
        return result

    def validate_subjects(self, values):
        return self._dedupe(values)

    def validate_languages(self, values):
        return self._dedupe(values)

    @transaction.atomic
    def create(self, validated_data):
        subjects = validated_data.pop('subjects', [])
        languages = validated_data.pop('languages', [])
        availability = validated_data.pop('availability', [])
        password = validated_data.pop('password', '')
        user_fields = {
            'email': validated_data.pop('email'),
            'name': validated_data.pop('name'),
            'is_active': validated_data.pop('is_active', True),
            'role': User.Role.TEACHER,
        }
        user = User.objects.create_user(password=password or None, **user_fields)
        profile = TeacherProfile.objects.create(user=user, **validated_data)
        self._replace_relations(profile, subjects, languages, availability)
        return profile

    @transaction.atomic
    def update(self, profile, validated_data):
        subjects = validated_data.pop('subjects', None)
        languages = validated_data.pop('languages', None)
        availability = validated_data.pop('availability', None)
        password = validated_data.pop('password', '')

        user = profile.user
        for field in ('email', 'name', 'is_active'):
            if field in validated_data:
                setattr(user, field, validated_data.pop(field))
        if password:
            user.set_password(password)
        user.role = User.Role.TEACHER
        user.save()

        for field, value in validated_data.items():
            setattr(profile, field, value)
        profile.save()
        self._replace_relations(profile, subjects, languages, availability)
        return profile

    @staticmethod
    def _replace_relations(profile, subjects, languages, availability):
        if subjects is not None:
            profile.subjects.all().delete()
            TeacherSubject.objects.bulk_create([
                TeacherSubject(teacher_profile=profile, name=value) for value in subjects
            ])
        if languages is not None:
            profile.languages.all().delete()
            TeacherLanguage.objects.bulk_create([
                TeacherLanguage(teacher_profile=profile, code=value) for value in languages
            ])
        if availability is not None:
            profile.availabilities.all().delete()
            TeacherAvailability.objects.bulk_create([
                TeacherAvailability(
                    teacher_profile=profile,
                    day_of_week=DAY_LABELS.index(value),
                    start_time='09:00',
                    end_time='17:00',
                )
                for value in availability
            ])


class AdminBookingSerializer(BookingSerializer):
    class Meta(BookingSerializer.Meta):
        read_only_fields = [
            'id', 'student', 'teacher', 'teacher_name', 'teacher_image', 'student_name',
            'student_image', 'subject', 'date', 'duration', 'price', 'platform_fee',
            'currency', 'stripe_payment_id', 'created_at',
        ]


class AdminReviewSerializer(ReviewSerializer):
    teacher_name = serializers.CharField(source='teacher.user.name', read_only=True)

    class Meta(ReviewSerializer.Meta):
        fields = [*ReviewSerializer.Meta.fields, 'teacher_name']


class AdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    serializer_class = AdminUserSerializer
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        queryset = User.objects.annotate(
            student_bookings=Count('bookings', distinct=True),
            taught_bookings=Count('teacher_profile__bookings', distinct=True),
        ).order_by('-created_at')
        search = self.request.query_params.get('search', '').strip()
        role = self.request.query_params.get('role', '').strip().upper()
        active = self.request.query_params.get('active')
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(email__icontains=search))
        if role in User.Role.values:
            queryset = queryset.filter(role=role)
        if active in ('true', 'false'):
            queryset = queryset.filter(is_active=active == 'true')
        return queryset

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.pk == request.user.pk:
            return Response({'detail': 'You cannot deactivate your own account.'}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminTeacherViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        queryset = TeacherProfile.objects.select_related('user').prefetch_related(
            'subjects', 'languages', 'availabilities'
        ).order_by('-created_at')
        search = self.request.query_params.get('search', '').strip()
        state = self.request.query_params.get('state', '').strip()
        if search:
            queryset = queryset.filter(
                Q(user__name__icontains=search)
                | Q(user__email__icontains=search)
                | Q(headline__icontains=search)
            )
        if state == 'verified':
            queryset = queryset.filter(verified=True)
        elif state == 'featured':
            queryset = queryset.filter(featured=True)
        elif state == 'inactive':
            queryset = queryset.filter(user__is_active=False)
        return queryset

    def get_serializer_class(self):
        return AdminTeacherWriteSerializer if self.action in ('create', 'partial_update', 'update') else AdminTeacherSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.action in ('partial_update', 'update'):
            context['profile'] = self.get_object()
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        output = AdminTeacherSerializer(profile, context={'request': request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        profile = self.get_object()
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        output = AdminTeacherSerializer(profile, context={'request': request})
        return Response(output.data)

    def destroy(self, request, *args, **kwargs):
        profile = self.get_object()
        profile.user.is_active = False
        profile.user.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminBookingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]
    serializer_class = AdminBookingSerializer
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_queryset(self):
        queryset = Booking.objects.select_related('student', 'teacher__user').order_by('-created_at')
        state = self.request.query_params.get('status', '').strip().upper()
        search = self.request.query_params.get('search', '').strip()
        if state in Booking.Status.values:
            queryset = queryset.filter(status=state)
        if search:
            queryset = queryset.filter(
                Q(student__name__icontains=search)
                | Q(student__email__icontains=search)
                | Q(teacher__user__name__icontains=search)
                | Q(subject__icontains=search)
            )
        return queryset


class AdminReviewViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminRole]
    serializer_class = AdminReviewSerializer
    http_method_names = ['get', 'delete', 'head', 'options']

    def get_queryset(self):
        queryset = Review.objects.select_related('student', 'teacher__user').order_by('-created_at')
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(student__name__icontains=search)
                | Q(teacher__user__name__icontains=search)
                | Q(comment__icontains=search)
            )
        return queryset

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def _month_starts(count=12):
    now = timezone.now()
    year, month = now.year, now.month
    values = []
    for offset in range(count - 1, -1, -1):
        absolute = year * 12 + month - 1 - offset
        values.append(datetime(absolute // 12, absolute % 12 + 1, 1, tzinfo=timezone.get_current_timezone()))
    return values


class AdminSummaryView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        paid = Booking.objects.filter(status__in=PAID_STATUSES)
        financials = paid.aggregate(
            gross=Sum('price', default=0),
            platform=Sum('platform_fee', default=0),
        )
        month_starts = _month_starts()
        first_month = month_starts[0]
        user_rows = {
            row['month'].strftime('%Y-%m'): row['count']
            for row in User.objects.filter(created_at__gte=first_month)
            .annotate(month=TruncMonth('created_at')).values('month').annotate(count=Count('id'))
        }
        booking_rows = {
            row['month'].strftime('%Y-%m'): row
            for row in paid.filter(created_at__gte=first_month)
            .annotate(month=TruncMonth('created_at')).values('month')
            .annotate(bookings=Count('id'), gross=Sum('price', default=0), platform=Sum('platform_fee', default=0))
        }
        trend = []
        for month in month_starts:
            key = month.strftime('%Y-%m')
            booking = booking_rows.get(key, {})
            trend.append({
                'key': key,
                'label': f'{month_abbr[month.month]} {str(month.year)[2:]}',
                'users': user_rows.get(key, 0),
                'bookings': booking.get('bookings', 0),
                'gross': round(booking.get('gross', 0) or 0, 2),
                'platform': round(booking.get('platform', 0) or 0, 2),
            })

        top_teachers = TeacherProfile.objects.select_related('user').annotate(
            gross=Sum('bookings__price', filter=Q(bookings__status__in=PAID_STATUSES), default=0),
            platform=Sum('bookings__platform_fee', filter=Q(bookings__status__in=PAID_STATUSES), default=0),
            lessons=Count('bookings', filter=Q(bookings__status__in=PAID_STATUSES), distinct=True),
        ).order_by('-gross')[:5]

        recent = Booking.objects.select_related('student', 'teacher__user').order_by('-created_at')[:6]
        users_by_role = {row['role']: row['count'] for row in User.objects.values('role').annotate(count=Count('id'))}
        gross = financials['gross'] or 0
        platform = financials['platform'] or 0
        return Response({
            'metrics': {
                'users': User.objects.count(),
                'active_users': User.objects.filter(is_active=True).count(),
                'new_users_30d': User.objects.filter(created_at__gte=timezone.now() - timedelta(days=30)).count(),
                'teachers': TeacherProfile.objects.count(),
                'verified_teachers': TeacherProfile.objects.filter(verified=True).count(),
                'bookings': Booking.objects.count(),
                'paid_bookings': paid.count(),
                'pending_bookings': Booking.objects.filter(status=Booking.Status.PENDING).count(),
                'gross_revenue': round(gross, 2),
                'platform_revenue': round(platform, 2),
                'teacher_earnings': round(gross - platform, 2),
            },
            'users_by_role': users_by_role,
            'trend': trend,
            'top_teachers': [
                {
                    'id': teacher.id,
                    'name': teacher.user.name,
                    'image': get_user_image_url(teacher.user, request),
                    'gross': round(teacher.gross or 0, 2),
                    'platform': round(teacher.platform or 0, 2),
                    'earnings': round((teacher.gross or 0) - (teacher.platform or 0), 2),
                    'lessons': teacher.lessons,
                }
                for teacher in top_teachers
            ],
            'recent_bookings': BookingSerializer(recent, many=True, context={'request': request}).data,
        })


class AdminRevenueView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        teachers = TeacherProfile.objects.select_related('user').annotate(
            gross=Sum('bookings__price', filter=Q(bookings__status__in=PAID_STATUSES), default=0),
            platform=Sum('bookings__platform_fee', filter=Q(bookings__status__in=PAID_STATUSES), default=0),
            lessons=Count('bookings', filter=Q(bookings__status__in=PAID_STATUSES), distinct=True),
        ).order_by('-gross')
        return Response([
            {
                'teacher_id': teacher.id,
                'name': teacher.user.name,
                'email': teacher.user.email,
                'currency': teacher.currency,
                'lessons': teacher.lessons,
                'gross': round(teacher.gross or 0, 2),
                'platform': round(teacher.platform or 0, 2),
                'earnings': round((teacher.gross or 0) - (teacher.platform or 0), 2),
                'payouts_ready': bool(teacher.stripe_account_id),
            }
            for teacher in teachers
        ])
