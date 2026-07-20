from django.db.models import Avg, Count, Q
from django.utils import timezone
from rest_framework import generics, permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from accounts.models import User

from .models import Booking, Favorite, Message, Review, Subject, TeacherProfile
from .serializers import (
    BookingSerializer,
    FavoriteSerializer,
    MessageSerializer,
    ReviewSerializer,
    SubjectSerializer,
    TeacherProfileSerializer,
    TeacherProfileWriteSerializer,
)


class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.AllowAny]


class MyTeacherProfileView(generics.RetrieveUpdateAPIView):
    """The logged-in teacher's own editable profile. Created on first access so
    a freshly-registered teacher lands on a blank, ready-to-fill profile.
    Restricted to TEACHER accounts."""

    serializer_class = TeacherProfileWriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        if self.request.user.role != User.Role.TEACHER:
            raise PermissionDenied('Only teacher accounts have a teaching profile.')
        profile, _ = TeacherProfile.objects.get_or_create(
            user=self.request.user,
            defaults={
                'headline': '', 'bio': '', 'hourly_rate': 0, 'experience': 0,
                'country': '', 'city': '',
            },
        )
        return profile


class TeacherProfileViewSet(viewsets.ReadOnlyModelViewSet):
    # Only admin-approved (verified) teachers are public and bookable. A
    # self-registered teacher stays hidden — not listed, not viewable by direct
    # link, not bookable — until an admin verifies them in the control panel.
    queryset = TeacherProfile.objects.filter(user__is_active=True, user__role=User.Role.TEACHER, verified=True).select_related('user').prefetch_related(
        'subjects', 'languages', 'availabilities', 'certificates', 'reviews__student'
    ).annotate(
        calculated_rating=Avg('reviews__rating'),
        calculated_review_count=Count('reviews', distinct=True),
        calculated_total_students=Count(
            'bookings__student',
            filter=Q(bookings__status__in=[Booking.Status.CONFIRMED, Booking.Status.COMPLETED]),
            distinct=True,
        ),
    )
    serializer_class = TeacherProfileSerializer
    permission_classes = [permissions.AllowAny]


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    # New bookings must go through Stripe checkout so clients cannot create
    # unpaid PENDING lessons directly through the generic CRUD endpoint.
    http_method_names = ['get', 'head', 'options']

    def get_queryset(self):
        base = Booking.objects.select_related('teacher__user', 'student').order_by('date')
        # `?role=teacher` returns lessons the caller teaches; otherwise the
        # lessons they booked as a student.
        if self.request.query_params.get('role') == 'teacher':
            return base.filter(teacher__user=self.request.user)
        return base.filter(student=self.request.user)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Review.objects.select_related('student', 'teacher')
        teacher_id = self.request.query_params.get('teacher')
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related('teacher__user').prefetch_related(
            'teacher__subjects', 'teacher__languages', 'teacher__availabilities',
            'teacher__certificates', 'teacher__reviews__student',
        )


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        queryset = Message.objects.filter(Q(sender=user) | Q(recipient=user)).select_related('sender', 'recipient')
        other_user = self.request.query_params.get('with')
        if other_user and other_user.isdigit():
            queryset = queryset.filter(
                Q(sender=user, recipient_id=other_user) | Q(sender_id=other_user, recipient=user)
            )
            queryset.filter(recipient=user, read_at__isnull=True).update(read_at=timezone.now())
        return queryset
