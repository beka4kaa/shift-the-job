"""Stripe integration — ported from the Next.js app's src/app/api/stripe/*
routes (checkout/connect/webhook), same logic and error handling, now backed
by Django's ORM instead of Prisma.
"""

import logging

import stripe
from django.conf import settings
from django.http import HttpResponse
from django.utils.dateparse import parse_datetime
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Booking, TeacherProfile

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeCheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        teacher_id = request.data.get('teacherId')
        subject = request.data.get('subject')
        raw_date = request.data.get('date')
        duration = request.data.get('duration')

        parsed_date = parse_datetime(raw_date) if isinstance(raw_date, str) else None
        if not subject or parsed_date is None or not isinstance(duration, (int, float)):
            return Response('Missing or invalid booking details', status=status.HTTP_400_BAD_REQUEST)

        try:
            teacher = TeacherProfile.objects.select_related('user').get(id=teacher_id)
        except (TeacherProfile.DoesNotExist, ValueError, TypeError):
            return Response('Teacher not found', status=status.HTTP_404_NOT_FOUND)

        amount = (teacher.hourly_rate / 60) * duration
        platform_fee = amount * settings.PLATFORM_FEE

        booking = Booking.objects.create(
            student=request.user,
            teacher=teacher,
            subject=subject,
            date=parsed_date,
            duration=duration,
            price=amount,
            platform_fee=platform_fee,
            currency=teacher.currency,
            status=Booking.Status.PENDING,
        )

        try:
            payment_intent_data = None
            if teacher.stripe_account_id:
                payment_intent_data = {
                    'application_fee_amount': round(platform_fee * 100),
                    'transfer_data': {'destination': teacher.stripe_account_id},
                }

            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': teacher.currency.lower(),
                        'product_data': {
                            'name': f'Tutoring Session: {subject} with {teacher.user.name}',
                            'description': f'{duration} minutes on {parsed_date}',
                        },
                        'unit_amount': round(amount * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f'{settings.FRONTEND_URL}/dashboard/student?success=1',
                cancel_url=f'{settings.FRONTEND_URL}/booking/{teacher_id}?cancelled=1',
                metadata={
                    'bookingId': str(booking.id),
                    'teacherId': str(teacher.id),
                    'studentId': str(request.user.id),
                },
                payment_intent_data=payment_intent_data,
            )
            return Response({'url': checkout_session.url})
        except Exception as e:
            logger.error('STRIPE_CHECKOUT_ERROR: %s', e)
            return Response('Internal Error', status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StripeConnectView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            teacher = TeacherProfile.objects.select_related('user').get(user=request.user)
        except TeacherProfile.DoesNotExist:
            return Response('Teacher profile not found', status=status.HTTP_404_NOT_FOUND)

        try:
            account_id = teacher.stripe_account_id

            if not account_id:
                account = stripe.Account.create(
                    type='express',
                    email=teacher.user.email,
                    capabilities={
                        'card_payments': {'requested': True},
                        'transfers': {'requested': True},
                    },
                )
                account_id = account.id
                teacher.stripe_account_id = account_id
                teacher.save(update_fields=['stripe_account_id'])

            account_link = stripe.AccountLink.create(
                account=account_id,
                refresh_url=f'{settings.FRONTEND_URL}/dashboard/teacher?stripe_refresh=1',
                return_url=f'{settings.FRONTEND_URL}/dashboard/teacher?stripe_success=1',
                type='account_onboarding',
            )
            return Response({'url': account_link.url})
        except Exception as e:
            logger.error('STRIPE_CONNECT_ERROR: %s', e)
            return Response('Internal Error', status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.headers.get('Stripe-Signature', '')

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
        except (ValueError, stripe.error.SignatureVerificationError) as e:
            return HttpResponse(f'Webhook Error: {e}', status=400)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            booking_id = session.get('metadata', {}).get('bookingId')
            if booking_id:
                Booking.objects.filter(id=booking_id).update(
                    status=Booking.Status.CONFIRMED,
                    stripe_payment_id=session.get('payment_intent'),
                )

        return HttpResponse('OK', status=200)
