from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, ClassGroupViewSet, StudentParentViewSet

router = DefaultRouter()
router.register(r'classes', ClassGroupViewSet, basename='classgroup')
router.register(r'students', StudentViewSet, basename='student')
router.register(r'parents', StudentParentViewSet, basename='studentparent')

urlpatterns = router.urls
