from rest_framework.routers import DefaultRouter

from .views import BookingViewSet, ReviewViewSet, SubjectViewSet, TeacherProfileViewSet

router = DefaultRouter()
router.register('subjects', SubjectViewSet, basename='subject')
router.register('teachers', TeacherProfileViewSet, basename='teacher')
router.register('bookings', BookingViewSet, basename='booking')
router.register('reviews', ReviewViewSet, basename='review')

urlpatterns = router.urls
