from rest_framework.routers import DefaultRouter
from .views import SchoolJoinRequestViewSet

router = DefaultRouter()
router.register(r'', SchoolJoinRequestViewSet, basename='schooljoinrequest')

urlpatterns = router.urls
