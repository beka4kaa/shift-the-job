from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    BookingViewSet,
    MyTeacherProfileView,
    ReviewViewSet,
    SubjectViewSet,
    TeacherProfileViewSet,
)
from .stripe_views import StripeCheckoutView, StripeConnectView, StripeWebhookView

router = DefaultRouter()
router.register('subjects', SubjectViewSet, basename='subject')
router.register('teachers', TeacherProfileViewSet, basename='teacher')
router.register('bookings', BookingViewSet, basename='booking')
router.register('reviews', ReviewViewSet, basename='review')

urlpatterns = [
    # Must precede the router so `teachers/me/` isn't captured by teachers/<pk>/.
    path('teachers/me/', MyTeacherProfileView.as_view(), name='teacher-me'),
] + router.urls + [
    path('stripe/checkout/', StripeCheckoutView.as_view(), name='stripe-checkout'),
    path('stripe/connect/', StripeConnectView.as_view(), name='stripe-connect'),
    path('stripe/webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
]
