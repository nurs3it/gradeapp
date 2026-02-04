from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StaffViewSet, SubjectViewSet, StaffSubjectViewSet

router = DefaultRouter()
router.register(r'staff', StaffViewSet, basename='staff')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'staff-subjects', StaffSubjectViewSet, basename='staffsubject')

urlpatterns = router.urls

