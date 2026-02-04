from django.contrib import admin
from .models import Grade, Feedback


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'value', 'type', 'date', 'recorded_by')
    list_filter = ('type', 'scale', 'date', 'course__school')
    search_fields = ('student__user__email', 'student__user__first_name')


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('to_student', 'from_user', 'date', 'created_at')
    list_filter = ('date',)
    search_fields = ('to_student__user__email', 'from_user__email')

