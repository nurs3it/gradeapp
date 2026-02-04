from django.contrib import admin
from .models import Certificate, CertificateTemplate


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('student', 'title', 'issue_date', 'language', 'expires')
    list_filter = ('issue_date', 'language', 'student__school')
    search_fields = ('student__user__email', 'title')


@admin.register(CertificateTemplate)
class CertificateTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'school', 'is_active', 'created_at')
    list_filter = ('is_active', 'school')
    search_fields = ('name', 'school__name')

