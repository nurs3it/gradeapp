from django.urls import path
from .views import StudentParentViewSet

urlpatterns = [
    path('', StudentParentViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('<uuid:pk>/', StudentParentViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy',
    })),
]
