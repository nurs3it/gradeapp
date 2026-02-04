from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, UserRole, Role, Permission, RolePermission, SchoolJoinRequest, SchoolJoinRequestStatus, Notification


class UserSerializer(serializers.ModelSerializer):
    """User serializer."""
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    schools = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'middle_name',
            'phone', 'language_pref', 'profile', 'linked_school',
            'is_active', 'is_superuser', 'date_joined', 'roles', 'permissions', 'schools'
        ]
        read_only_fields = ['id', 'date_joined']

    def get_roles(self, obj):
        """Get user roles (from UserRole per school)."""
        return [ur.role for ur in obj.user_roles.all()]

    def get_permissions(self, obj):
        """Effective permission codes for this user (from RolePermission / is_superuser)."""
        return obj.get_effective_permission_codes()

    def get_schools(self, obj):
        """Schools where user has a role (for school switcher)."""
        return [
            {'id': str(ur.school_id), 'name': ur.school.name}
            for ur in obj.user_roles.select_related('school').all()
        ]


class UserRegistrationSerializer(serializers.ModelSerializer):
    """User registration serializer."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=Role.choices, write_only=True, required=False)
    school_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm', 'first_name',
            'last_name', 'middle_name', 'phone', 'language_pref',
            'role', 'school_id'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        role = validated_data.pop('role', None)
        school_id = validated_data.pop('school_id', None)
        password = validated_data.pop('password')
        
        user = User.objects.create_user(password=password, **validated_data)
        
        if role and school_id:
            UserRole.objects.create(user=user, school_id=school_id, role=role)
        
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for current user profile update (PATCH /users/me/)."""
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'middle_name', 'phone', 'language_pref', 'profile', 'linked_school']
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'middle_name': {'required': False},
            'phone': {'required': False},
            'language_pref': {'required': False},
            'profile': {'required': False},
            'linked_school': {'required': False, 'allow_null': True},
        }

    def validate_linked_school(self, value):
        if value is None:
            return value
        user = self.instance
        if not user.user_roles.filter(school_id=value).exists():
            raise serializers.ValidationError('You do not have a role in this school.')
        return value


class UserRoleSerializer(serializers.ModelSerializer):
    """UserRole serializer."""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    
    class Meta:
        model = UserRole
        fields = ['id', 'user', 'user_email', 'school', 'school_name', 'role', 'created_at']
        read_only_fields = ['id', 'created_at']


class PermissionSerializer(serializers.ModelSerializer):
    """Permission serializer (read-only for API)."""
    class Meta:
        model = Permission
        fields = ['id', 'code', 'name', 'description', 'resource', 'action']
        read_only_fields = ['id', 'code', 'name', 'description', 'resource', 'action']


class RolePermissionsUpdateSerializer(serializers.Serializer):
    """Body for PUT role permissions: set list of permission codes."""
    permission_codes = serializers.ListField(
        child=serializers.CharField(max_length=80),
        allow_empty=True
    )


# Roles allowed in join request (all except SuperAdmin)
JOIN_REQUEST_ROLES = [c for c in Role.choices if c[0] != Role.SUPERADMIN]


class SchoolJoinRequestSerializer(serializers.ModelSerializer):
    """SchoolJoinRequest read serializer."""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    school_name = serializers.CharField(source='school.name', read_only=True)

    class Meta:
        model = SchoolJoinRequest
        fields = [
            'id', 'user', 'user_email', 'user_name', 'school', 'school_name',
            'requested_role', 'status', 'created_at', 'reviewed_at', 'reviewed_by', 'rejection_reason'
        ]
        read_only_fields = ['id', 'created_at', 'reviewed_at', 'reviewed_by']

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email


class SchoolJoinRequestCreateSerializer(serializers.Serializer):
    """Body for creating a join request."""
    school_id = serializers.UUIDField()
    requested_role = serializers.ChoiceField(choices=JOIN_REQUEST_ROLES)


class SchoolJoinRequestReviewSerializer(serializers.Serializer):
    """Body for approve/reject."""
    status = serializers.ChoiceField(choices=['approved', 'rejected'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)


class NotificationSerializer(serializers.ModelSerializer):
    """Notification serializer."""
    class Meta:
        model = Notification
        fields = ['id', 'type', 'payload', 'read_flag', 'created_at']
        read_only_fields = ['id', 'type', 'payload', 'created_at']

