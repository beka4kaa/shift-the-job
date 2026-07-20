from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    BookingViewSet,
    FavoriteViewSet,
    MessageViewSet,
    MyTeacherProfileView,
    ReviewViewSet,
    SubjectViewSet,
    TeacherProfileViewSet,
)
from .stripe_views import StripeCheckoutView, StripeConnectView, StripeWebhookView
from .admin_api import (
    AdminBookingViewSet,
    AdminRevenueView,
    AdminReviewViewSet,
    AdminSummaryView,
    AdminTeacherViewSet,
    AdminUserViewSet,
)

router = DefaultRouter()
router.register('subjects', SubjectViewSet, basename='subject')
router.register('teachers', TeacherProfileViewSet, basename='teacher')
router.register('bookings', BookingViewSet, basename='booking')
router.register('favorites', FavoriteViewSet, basename='favorite')
router.register('messages', MessageViewSet, basename='message')
router.register('admin/users', AdminUserViewSet, basename='admin-user')
router.register('admin/teachers', AdminTeacherViewSet, basename='admin-teacher')
router.register('admin/bookings', AdminBookingViewSet, basename='admin-booking')
router.register('admin/reviews', AdminReviewViewSet, basename='admin-review')
router.register('reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path('admin/summary/', AdminSummaryView.as_view(), name='admin-summary'),
    path('admin/revenue/', AdminRevenueView.as_view(), name='admin-revenue'),
    # Must precede the router so `teachers/me/` isn't captured by teachers/<pk>/.
    path('teachers/me/', MyTeacherProfileView.as_view(), name='teacher-me'),
] + router.urls + [
    path('stripe/checkout/', StripeCheckoutView.as_view(), name='stripe-checkout'),
    path('stripe/connect/', StripeConnectView.as_view(), name='stripe-connect'),
    path('stripe/webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
]
