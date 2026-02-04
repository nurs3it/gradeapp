from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserRoleSerializer,
    UserProfileUpdateSerializer,
    PermissionSerializer,
    RolePermissionsUpdateSerializer,
    SchoolJoinRequestSerializer,
    SchoolJoinRequestCreateSerializer,
    SchoolJoinRequestReviewSerializer,
    NotificationSerializer,
)
from .permissions import IsSuperAdminOrSchoolAdmin, HasPermission
from .models import (
    UserRole,
    Permission,
    RolePermission,
    Role,
    SchoolJoinRequest,
    SchoolJoinRequestStatus,
    Notification,
    AuditLog,
)

User = get_user_model()


def can_approve_for_school(user, school):
    """True if user can approve join requests for this school (Director/SchoolAdmin/SuperAdmin for this school)."""
    if getattr(user, 'is_superuser', False):
        return True
    return user.user_roles.filter(
        school=school,
        role__in=[Role.DIRECTOR, Role.SCHOOLADMIN, Role.SUPERADMIN]
    ).exists()


def get_schools_user_can_approve(user):
    """School IDs for which user can approve join requests."""
    if getattr(user, 'is_superuser', False):
        from schools.models import School
        return list(School.objects.values_list('id', flat=True))
    return list(
        user.user_roles.filter(
            role__in=[Role.DIRECTOR, Role.SCHOOLADMIN, Role.SUPERADMIN]
        ).values_list('school_id', flat=True).distinct()
    )


class UserViewSet(viewsets.ModelViewSet):
    """User viewset."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ('create', 'register'):
            return [AllowAny()]
        elif self.action in ['list', 'retrieve', 'update', 'partial_update', 'destroy']:
            return [IsSuperAdminOrSchoolAdmin()]
        return super().get_permissions()
    
    def get_queryset(self):
        queryset = User.objects.all()
        school_id = self.request.query_params.get('school_id')
        role = self.request.query_params.get('role')
        
        if school_id:
            queryset = queryset.filter(linked_school_id=school_id)
        if role:
            queryset = queryset.filter(user_roles__role=role).distinct()
        
        return queryset
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """User registration endpoint."""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get or update current user profile."""
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        # PATCH: update own profile (first_name, last_name, middle_name, phone, language_pref, profile)
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserRoleViewSet(viewsets.ModelViewSet):
    """UserRole viewset."""
    queryset = UserRole.objects.all()
    serializer_class = UserRoleSerializer
    permission_classes = [IsSuperAdminOrSchoolAdmin]
    
    def get_queryset(self):
        queryset = UserRole.objects.all()
        school_id = self.request.query_params.get('school_id')
        user_id = self.request.query_params.get('user_id')
        
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """List/retrieve permissions (SuperAdmin only)."""
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['resource', 'action']
    search_fields = ['code', 'name']

    def get_permissions(self):
        return [IsAuthenticated(), HasPermission('permissions.manage')]


class RolePermissionsView(APIView):
    """GET/PUT permissions for a role (SuperAdmin only)."""
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        return [IsAuthenticated(), HasPermission('permissions.manage')]

    def get(self, request, role):
        if role not in [r[0] for r in Role.choices]:
            return Response({'detail': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)
        codes = list(
            RolePermission.objects.filter(role=role)
            .values_list('permission__code', flat=True)
            .distinct()
        )
        return Response({'role': role, 'permission_codes': codes})

    def put(self, request, role):
        if role not in [r[0] for r in Role.choices]:
            return Response({'detail': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = RolePermissionsUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        permission_codes = serializer.validated_data['permission_codes']
        # Resolve Permission objects by code
        perms = list(Permission.objects.filter(code__in=permission_codes))
        found_codes = {p.code for p in perms}
        if len(found_codes) != len(permission_codes):
            unknown = set(permission_codes) - found_codes
            return Response(
                {'permission_codes': [f'Unknown codes: {unknown}']},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Replace role's permissions
        RolePermission.objects.filter(role=role).delete()
        RolePermission.objects.bulk_create([
            RolePermission(role=role, permission=p) for p in perms
        ])
        codes = [p.code for p in perms]
        return Response({'role': role, 'permission_codes': codes})


class SchoolJoinRequestViewSet(viewsets.ModelViewSet):
    """Create and list join requests; approve/reject (Director/SchoolAdmin/SuperAdmin for that school)."""
    serializer_class = SchoolJoinRequestSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        school_ids = get_schools_user_can_approve(user)
        status_param = self.request.query_params.get('status')
        school_id_param = self.request.query_params.get('school_id')

        if school_ids:
            # Approver: see pending (or filtered) requests for their schools
            qs = SchoolJoinRequest.objects.filter(school_id__in=school_ids).select_related(
                'user', 'school', 'reviewed_by'
            )
            if status_param:
                qs = qs.filter(status=status_param)
            else:
                qs = qs.filter(status=SchoolJoinRequestStatus.PENDING)
            if school_id_param:
                qs = qs.filter(school_id=school_id_param)
            return qs.order_by('-created_at')
        # Non-approver: only own requests
        return SchoolJoinRequest.objects.filter(user=user).select_related(
            'user', 'school', 'reviewed_by'
        ).order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return SchoolJoinRequestCreateSerializer
        if self.action in ['partial_update', 'update']:
            return SchoolJoinRequestReviewSerializer
        return SchoolJoinRequestSerializer

    def create(self, request, *args, **kwargs):
        serializer = SchoolJoinRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        school_id = serializer.validated_data['school_id']
        requested_role = serializer.validated_data['requested_role']

        if requested_role == Role.SUPERADMIN:
            return Response(
                {'requested_role': ['SuperAdmin cannot be requested.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        from schools.models import School
        if not School.objects.filter(id=school_id).exists():
            return Response({'school_id': ['School not found.']}, status=status.HTTP_400_BAD_REQUEST)

        if SchoolJoinRequest.objects.filter(
            user=request.user, school_id=school_id, status=SchoolJoinRequestStatus.PENDING
        ).exists():
            return Response(
                {'detail': 'Заявка уже подана.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        req = SchoolJoinRequest.objects.create(
            user=request.user,
            school_id=school_id,
            requested_role=requested_role,
            status=SchoolJoinRequestStatus.PENDING,
        )
        return Response(
            SchoolJoinRequestSerializer(req).data,
            status=status.HTTP_201_CREATED
        )

    def partial_update(self, request, *args, **kwargs):
        obj = self.get_object()
        if not can_approve_for_school(request.user, obj.school):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        if obj.status != SchoolJoinRequestStatus.PENDING:
            return Response(
                {'detail': 'Request is not pending.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SchoolJoinRequestReviewSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data.get('status')
        rejection_reason = serializer.validated_data.get('rejection_reason', '') or ''

        now = timezone.now()
        obj.reviewed_at = now
        obj.reviewed_by = request.user
        obj.rejection_reason = rejection_reason
        obj.status = new_status
        obj.save()

        school_name = obj.school.name
        if new_status == 'approved':
            UserRole.objects.get_or_create(
                user=obj.user,
                school=obj.school,
                role=obj.requested_role,
            )
            if not obj.user.linked_school_id:
                obj.user.linked_school = obj.school
                obj.user.save(update_fields=['linked_school'])

            Notification.objects.create(
                to_user=obj.user,
                type='school_join_approved',
                payload={'school_id': str(obj.school.id), 'school_name': school_name, 'role': obj.requested_role},
            )
            AuditLog.objects.create(
                actor=request.user,
                action='approve',
                target='SchoolJoinRequest',
                target_id=obj.id,
                payload={
                    'user_id': str(obj.user.id),
                    'school_id': str(obj.school.id),
                    'requested_role': obj.requested_role,
                },
            )
        else:
            Notification.objects.create(
                to_user=obj.user,
                type='school_join_rejected',
                payload={
                    'school_id': str(obj.school.id),
                    'school_name': school_name,
                    'rejection_reason': rejection_reason,
                },
            )
            AuditLog.objects.create(
                actor=request.user,
                action='reject',
                target='SchoolJoinRequest',
                target_id=obj.id,
                payload={
                    'user_id': str(obj.user.id),
                    'school_id': str(obj.school.id),
                    'requested_role': obj.requested_role,
                    'rejection_reason': rejection_reason,
                },
            )

        return Response(SchoolJoinRequestSerializer(obj).data)


class NotificationViewSet(viewsets.GenericViewSet):
    """List and mark read notifications for current user."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(to_user=self.request.user).order_by('-created_at')[:50]

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        pk = self.kwargs.get('pk')
        instance = Notification.objects.filter(to_user=request.user, pk=pk).first()
        if not instance:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        instance.read_flag = True
        instance.save(update_fields=['read_flag'])
        return Response(NotificationSerializer(instance).data)

