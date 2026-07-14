from django.conf import settings
from django.db import models


class TeacherProfile(models.Model):
    """Mirrors the `TeacherProfile` model from prisma/schema.prisma."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='teacher_profile')
    headline = models.CharField(max_length=255)
    bio = models.TextField()
    hourly_rate = models.FloatField()
    currency = models.CharField(max_length=10, default='USD')
    experience = models.IntegerField()
    country = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    timezone = models.CharField(max_length=100, default='UTC')
    rating = models.FloatField(default=0)
    review_count = models.IntegerField(default=0)
    total_students = models.IntegerField(default=0)
    stripe_account_id = models.CharField(max_length=255, blank=True, null=True)
    verified = models.BooleanField(default=False)
    featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.name} ({self.headline})'


class TeacherSubject(models.Model):
    teacher_profile = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE, related_name='subjects')
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class TeacherLanguage(models.Model):
    teacher_profile = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE, related_name='languages')
    code = models.CharField(max_length=50)

    def __str__(self):
        return self.code


class TeacherCertificate(models.Model):
    class VerificationStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        VERIFIED = 'VERIFIED', 'Verified'
        REJECTED = 'REJECTED', 'Rejected'

    teacher_profile = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE, related_name='certificates')
    url = models.URLField()
    verification_status = models.CharField(max_length=20, choices=VerificationStatus.choices, default=VerificationStatus.PENDING)
    verified_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name='reviewed_certificates'
    )
    admin_note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f'{self.teacher_profile.user.name} — {self.verification_status}'


class TeacherAvailability(models.Model):
    teacher_profile = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE, related_name='availabilities')
    day_of_week = models.IntegerField()  # 0=Mon .. 6=Sun, matching the frontend's DAY_LABELS
    start_time = models.CharField(max_length=10)
    end_time = models.CharField(max_length=10)


class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.name


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        REFUNDED = 'REFUNDED', 'Refunded'

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    teacher = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE, related_name='bookings')
    subject = models.CharField(max_length=100)
    date = models.DateTimeField()
    duration = models.IntegerField()
    price = models.FloatField()
    platform_fee = models.FloatField()
    currency = models.CharField(max_length=10)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    stripe_payment_id = models.CharField(max_length=255, blank=True, null=True)
    meeting_link = models.URLField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Review(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    teacher = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
