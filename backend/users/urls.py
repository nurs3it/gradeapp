from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserViewSet, UserRoleViewSet

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')
router.register(r'roles', UserRoleViewSet, basename='userrole')

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', UserViewSet.as_view({'post': 'register'}), name='register'),
    path('me/', UserViewSet.as_view({'get': 'me', 'patch': 'me'}), name='user-me'),
    path('', include(router.urls)),
]

