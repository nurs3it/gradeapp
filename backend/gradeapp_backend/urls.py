"""
URL configuration for gradeapp_backend project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/auth/', include('users.urls')),
    path('api/schools/', include('schools.urls')),
    path('api/users/', include('users.urls')),
    path('api/staff/', include('staff.urls')),
    path('api/classes/', include('students.urls_classes')),
    path('api/students/', include('students.urls_students')),
    path('api/parents/', include('students.urls_parents')),
    path('api/schedule/', include('schedule.urls')),
    path('api/lessons/', include('schedule.urls')),
    path('api/journal/', include('journal.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/grades/', include('journal.urls')),
    path('api/feedback/', include('journal.urls')),
    path('api/certificates/', include('certificates.urls')),
    path('api/permissions/', include('users.permission_urls')),
    path('api/roles/', include('users.role_permission_urls')),
    path('api/school-join-requests/', include('users.join_request_urls')),
    path('api/notifications/', include('users.notifications_urls')),

    # Frontend (SPA)
    path('', TemplateView.as_view(template_name='index.html')),
    re_path(r'^(?!api/|admin/|static/|media/).*$', TemplateView.as_view(template_name='index.html')),
]

