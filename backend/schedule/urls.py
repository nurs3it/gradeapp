from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, ScheduleSlotViewSet, LessonViewSet

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'slots', ScheduleSlotViewSet, basename='scheduleslot')
router.register(r'lessons', LessonViewSet, basename='lesson')

urlpatterns = [
    path('resolve-conflicts/', ScheduleSlotViewSet.as_view({'post': 'resolve_conflicts'}), name='resolve_conflicts'),
    path('', include(router.urls)),
]

