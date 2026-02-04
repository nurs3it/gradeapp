import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager."""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class Role(models.TextChoices):
    SUPERADMIN = 'superadmin', 'SuperAdmin'
    SCHOOLADMIN = 'schooladmin', 'SchoolAdmin'
    DIRECTOR = 'director', 'Director'
    TEACHER = 'teacher', 'Teacher'
    STUDENT = 'student', 'Student'
    PARENT = 'parent', 'Parent'
    REGISTRAR = 'registrar', 'Registrar'
    SCHEDULER = 'scheduler', 'Scheduler'


class LanguagePreference(models.TextChoices):
    RU = 'ru', 'Русский'
    KZ = 'kz', 'Қазақша'
    EN = 'en', 'English'


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    middle_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    language_pref = models.CharField(
        max_length=2,
        choices=LanguagePreference.choices,
        default=LanguagePreference.RU
    )
    profile = models.JSONField(default=dict, blank=True)
    linked_school = models.ForeignKey(
        'schools.School',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.email} ({self.get_full_name()})"
    
    def get_full_name(self):
        parts = [self.first_name, self.middle_name, self.last_name]
        return ' '.join(filter(None, parts)) or self.email
    
    def has_role(self, role):
        """Check if user has a specific role."""
        return self.user_roles.filter(role=role).exists()
    
    def get_roles(self):
        """Get all roles for this user."""
        return [ur.role for ur in self.user_roles.all()]

    def get_effective_permission_codes(self):
        """Permission codes for this user (from RolePermission by user roles; all if is_superuser)."""
        if getattr(self, 'is_superuser', False):
            return list(Permission.objects.values_list('code', flat=True))
        roles = self.get_roles()
        if not roles:
            return []
        return list(
            RolePermission.objects.filter(role__in=roles)
            .values_list('permission__code', flat=True)
            .distinct()
        )


class UserRole(models.Model):
    """User roles per school (many-to-many relationship)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='user_roles')
    role = models.CharField(max_length=20, choices=Role.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_roles'
        unique_together = [['user', 'school', 'role']]
        indexes = [
            models.Index(fields=['user', 'school']),
            models.Index(fields=['school', 'role']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.role} @ {self.school.name}"


class Permission(models.Model):
    """Dynamic permission (code used in HasPermission and frontend)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=80, unique=True, db_index=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    resource = models.CharField(max_length=50, blank=True, db_index=True)
    action = models.CharField(max_length=50, blank=True)
    
    class Meta:
        db_table = 'permissions'
        verbose_name = 'Permission'
        verbose_name_plural = 'Permissions'
        ordering = ['resource', 'action', 'code']
    
    def __str__(self):
        return f"{self.code} ({self.name})"


class RolePermission(models.Model):
    """Which permissions are granted to which role."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=Role.choices, db_index=True)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name='role_permissions')
    
    class Meta:
        db_table = 'role_permissions'
        unique_together = [['role', 'permission']]
        indexes = [
            models.Index(fields=['role']),
        ]
        verbose_name = 'Role permission'
        verbose_name_plural = 'Role permissions'
    
    def __str__(self):
        return f"{self.role} -> {self.permission.code}"


class SchoolJoinRequestStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'


class SchoolJoinRequest(models.Model):
    """Request by a user to join a school with a role (pending until approved/rejected)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='school_join_requests')
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='join_requests')
    requested_role = models.CharField(max_length=20, choices=Role.choices)
    status = models.CharField(
        max_length=20,
        choices=SchoolJoinRequestStatus.choices,
        default=SchoolJoinRequestStatus.PENDING,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_join_requests'
    )
    rejection_reason = models.TextField(blank=True)

    class Meta:
        db_table = 'school_join_requests'
        verbose_name = 'School join request'
        verbose_name_plural = 'School join requests'
        indexes = [
            models.Index(fields=['school', 'status']),
            models.Index(fields=['user', 'school']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'school'],
                condition=models.Q(status='pending'),
                name='unique_pending_per_user_school',
            )
        ]

    def __str__(self):
        return f"{self.user.email} -> {self.school.name} ({self.requested_role}) {self.status}"


class Notification(models.Model):
    """Notification model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, help_text="Тип уведомления (grade, attendance, feedback, etc.)")
    payload = models.JSONField(default=dict, help_text="Данные уведомления")
    read_flag = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        indexes = [
            models.Index(fields=['to_user', 'read_flag']),
            models.Index(fields=['to_user', 'created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.type} - {self.to_user.email}"


class AuditLog(models.Model):
    """Audit log model for tracking critical actions."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs',
        help_text="Пользователь, выполнивший действие"
    )
    action = models.CharField(max_length=100, help_text="Тип действия (create, update, delete, etc.)")
    target = models.CharField(max_length=100, help_text="Целевой объект (model name)")
    target_id = models.UUIDField(null=True, blank=True, help_text="ID целевого объекта")
    payload = models.JSONField(default=dict, help_text="Дополнительные данные действия")
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        indexes = [
            models.Index(fields=['actor', 'timestamp']),
            models.Index(fields=['target', 'target_id']),
            models.Index(fields=['timestamp']),
        ]
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.action} {self.target} by {self.actor.email if self.actor else 'System'}"
