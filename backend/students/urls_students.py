from django.urls import path
from .views import StudentViewSet

urlpatterns = [
    path('', StudentViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('bulk_import/', StudentViewSet.as_view({'post': 'bulk_import'})),
    path('export/', StudentViewSet.as_view({'get': 'export'})),
    path('<uuid:pk>/', StudentViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy',
    })),
]
