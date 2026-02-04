from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CertificateViewSet, CertificateTemplateViewSet

router = DefaultRouter()
router.register(r'templates', CertificateTemplateViewSet, basename='certificatetemplate')
router.register(r'', CertificateViewSet, basename='certificate')

urlpatterns = [
    path('generate/', CertificateViewSet.as_view({'post': 'generate'}), name='certificate_generate'),
    path('', include(router.urls)),
]

