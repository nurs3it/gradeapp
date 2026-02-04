from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GradeViewSet, FeedbackViewSet

router = DefaultRouter()
router.register(r'grades', GradeViewSet, basename='grade')
router.register(r'feedback', FeedbackViewSet, basename='feedback')

urlpatterns = router.urls

