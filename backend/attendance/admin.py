from django.contrib import admin
from .models import Attendance


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'lesson', 'status', 'recorded_by', 'created_at')
    list_filter = ('status', 'lesson__date')
    search_fields = ('student__user__email', 'student__user__first_name')

