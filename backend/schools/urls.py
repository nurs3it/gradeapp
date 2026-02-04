from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CityViewSet, SchoolViewSet, AcademicYearViewSet, SchoolByCodeView

router = DefaultRouter()
router.register(r'cities', CityViewSet, basename='city')
router.register(r'', SchoolViewSet, basename='school')

academic_years_router = DefaultRouter()
academic_years_router.register(r'', AcademicYearViewSet, basename='academicyear')

urlpatterns = [
    path('by_code/<str:code>/', SchoolByCodeView.as_view(), name='school-by-code'),
    path('academic-years/', include(academic_years_router.urls)),
    path('', include(router.urls)),
]

