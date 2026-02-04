from django.urls import path
from .views import RolePermissionsView

urlpatterns = [
    path('<str:role>/permissions/', RolePermissionsView.as_view(), name='role-permissions'),
]
