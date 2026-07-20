from django.contrib import admin

from .models import (
    Booking,
    Favorite,
    Message,
    Review,
    Subject,
    TeacherAvailability,
    TeacherCertificate,
    TeacherLanguage,
    TeacherProfile,
    TeacherSubject,
)


class TeacherSubjectInline(admin.TabularInline):
    model = TeacherSubject
    extra = 1


class TeacherLanguageInline(admin.TabularInline):
    model = TeacherLanguage
    extra = 1


class TeacherCertificateInline(admin.TabularInline):
    model = TeacherCertificate
    extra = 0


class TeacherAvailabilityInline(admin.TabularInline):
    model = TeacherAvailability
    extra = 1


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'headline', 'city', 'country', 'verified', 'featured', 'rating']
    list_filter = ['verified', 'featured', 'country']
    search_fields = ['user__name', 'user__email', 'headline']
    inlines = [TeacherSubjectInline, TeacherLanguageInline, TeacherCertificateInline, TeacherAvailabilityInline]


@admin.register(TeacherCertificate)
class TeacherCertificateAdmin(admin.ModelAdmin):
    list_display = ['teacher_profile', 'verification_status', 'verified_at', 'reviewed_by']
    list_filter = ['verification_status']


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'category']
    search_fields = ['name']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'student', 'teacher', 'subject', 'date', 'status', 'price']
    list_filter = ['status']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'student', 'teacher', 'rating', 'created_at']


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'teacher', 'created_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'recipient', 'created_at', 'read_at']
