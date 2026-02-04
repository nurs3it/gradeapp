from django.urls import path
from .views import ClassGroupViewSet

urlpatterns = [
    path('', ClassGroupViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('<uuid:pk>/', ClassGroupViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy',
    })),
    path('<uuid:pk>/students/', ClassGroupViewSet.as_view({'get': 'students'})),
]
