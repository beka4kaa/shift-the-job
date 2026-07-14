from rest_framework import permissions, viewsets

from .models import Booking, Review, Subject, TeacherProfile
from .serializers import (
    BookingSerializer,
    ReviewSerializer,
    SubjectSerializer,
    TeacherProfileSerializer,
)


class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.AllowAny]


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
        return Booking.objects.filter(student=self.request.user).select_related('teacher__user')


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
