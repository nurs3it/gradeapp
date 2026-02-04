from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import UserRateThrottle
from .models import City, School, AcademicYear
from .serializers import CitySerializer, SchoolSerializer, AcademicYearSerializer
from users.permissions import HasPermission
from users.models import UserRole, Role


class SchoolByCodeThrottle(UserRateThrottle):
    rate = '5/min'
    scope = 'school_by_code'


class SchoolByCodeView(APIView):
    """Look up school by 6-char connection code (for guests connecting to school). Throttled 5/min."""
    permission_classes = [IsAuthenticated]
    throttle_classes = [SchoolByCodeThrottle]

    def get(self, request, code):
        code = (code or '').strip().upper()[:6]
        if not code or len(code) != 6:
            return Response({'detail': 'Invalid code.'}, status=status.HTTP_400_BAD_REQUEST)
        school = School.objects.filter(connection_code=code).select_related('city').first()
        if not school:
            return Response({'detail': 'School not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'id': str(school.id),
            'name': school.name,
            'city': school.city.name_ru or school.city.name if school.city else None,
        })


class CityViewSet(viewsets.ReadOnlyModelViewSet):
    """City reference - list and retrieve only."""
    queryset = City.objects.all().order_by('name')
    serializer_class = CitySerializer
    permission_classes = [IsAuthenticated]


class SchoolViewSet(viewsets.ModelViewSet):
    """School viewset."""
    queryset = School.objects.all().select_related('city').prefetch_related('academic_years')
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [HasPermission('schools.create_edit_delete')]
        return [HasPermission('schools.view_list')]

    def get_queryset(self):
        user = self.request.user
        if user.has_role('superadmin') or getattr(user, 'is_superuser', False):
            return School.objects.all().select_related('city').prefetch_related('academic_years')
        return School.objects.filter(id=user.linked_school_id).select_related('city').prefetch_related('academic_years') if user.linked_school_id else School.objects.none()

    def perform_create(self, serializer):
        serializer.save()
        school = serializer.instance
        user = self.request.user
        if user.has_role(Role.SUPERADMIN):
            UserRole.objects.get_or_create(
                user=user,
                school=school,
                defaults={'role': Role.SUPERADMIN},
            )
            user.linked_school = school
            user.save(update_fields=['linked_school'])


class AcademicYearViewSet(viewsets.ModelViewSet):
    """AcademicYear viewset."""
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        return [HasPermission('academic_years.crud')]

    def get_queryset(self):
        queryset = AcademicYear.objects.all()
        school_id = self.request.query_params.get('school_id')
        if school_id:
            queryset = queryset.filter(school_id=school_id)

        user = self.request.user
        if not user.has_role('superadmin') and user.linked_school_id:
            queryset = queryset.filter(school_id=user.linked_school_id)

        return queryset
