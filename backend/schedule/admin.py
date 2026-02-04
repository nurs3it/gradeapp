from django.contrib import admin
from .models import Course, ScheduleSlot, Lesson


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'teacher', 'class_group', 'school', 'is_optional')
    list_filter = ('school', 'is_optional', 'academic_year')
    search_fields = ('name', 'subject__name')


@admin.register(ScheduleSlot)
class ScheduleSlotAdmin(admin.ModelAdmin):
    list_display = ('course', 'day_of_week', 'start_time', 'end_time', 'classroom')
    list_filter = ('day_of_week', 'course__school')


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('course', 'date', 'start_time', 'teacher', 'attendance_open_flag')
    list_filter = ('date', 'attendance_open_flag', 'course__school')
    search_fields = ('course__name',)

