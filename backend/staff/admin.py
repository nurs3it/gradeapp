from django.contrib import admin
from .models import Staff, Subject, StaffSubject


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ('user', 'school', 'position', 'employment_date')
    list_filter = ('position', 'school')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'school', 'default_credits')
    list_filter = ('school',)
    search_fields = ('name', 'code')


@admin.register(StaffSubject)
class StaffSubjectAdmin(admin.ModelAdmin):
    list_display = ('staff', 'subject')
    list_filter = ('subject',)

