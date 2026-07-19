from rest_framework import generics, permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from accounts.models import User

from .models import Booking, Review, Subject, TeacherProfile
from .serializers import (
    BookingSerializer,
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
    queryset = TeacherProfile.objects.select_related('user').prefetch_related(
        'subjects', 'languages', 'availabilities', 'certificates', 'reviews__student'
    )
    serializer_class = TeacherProfileSerializer
    permission_classes = [permissions.AllowAny]


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

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
