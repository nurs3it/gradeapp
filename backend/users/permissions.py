from rest_framework import permissions
from .models import Role


class IsSuperAdmin(permissions.BasePermission):
    """Permission check for SuperAdmin role."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.has_role(Role.SUPERADMIN)


class IsSchoolAdmin(permissions.BasePermission):
    """Permission check for SchoolAdmin or Director role."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            request.user.has_role(Role.SCHOOLADMIN) or
            request.user.has_role(Role.DIRECTOR) or
            request.user.has_role(Role.SUPERADMIN)
        )


class IsTeacher(permissions.BasePermission):
    """Permission check for Teacher role."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            request.user.has_role(Role.TEACHER) or
            request.user.has_role(Role.SCHOOLADMIN) or
            request.user.has_role(Role.DIRECTOR) or
            request.user.has_role(Role.SUPERADMIN)
        )


class IsStudent(permissions.BasePermission):
    """Permission check for Student role."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.has_role(Role.STUDENT)


class IsParent(permissions.BasePermission):
    """Permission check for Parent role."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.has_role(Role.PARENT)


class IsTeacherOrStudent(permissions.BasePermission):
    """Permission check for Teacher or Student role."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            request.user.has_role(Role.TEACHER) or
            request.user.has_role(Role.STUDENT) or
            request.user.has_role(Role.SCHOOLADMIN) or
            request.user.has_role(Role.DIRECTOR) or
            request.user.has_role(Role.SUPERADMIN)
        )


class IsSuperAdminOrSchoolAdmin(permissions.BasePermission):
    """Permission check for SuperAdmin or SchoolAdmin/Director role.
    Also allows Django is_superuser (e.g. staff users without UserRole).
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, 'is_superuser', False):
            return True
        return (
            request.user.has_role(Role.SUPERADMIN) or
            request.user.has_role(Role.SCHOOLADMIN) or
            request.user.has_role(Role.DIRECTOR)
        )


class IsScheduleAdmin(permissions.BasePermission):
    """Permission for schedule admin: builder, conflicts. Includes Registrar and Scheduler."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, 'is_superuser', False):
            return True
        return (
            request.user.has_role(Role.SUPERADMIN) or
            request.user.has_role(Role.SCHOOLADMIN) or
            request.user.has_role(Role.DIRECTOR) or
            request.user.has_role(Role.REGISTRAR) or
            request.user.has_role(Role.SCHEDULER)
        )


class HasPermission(permissions.BasePermission):
    """Check that the user has the given permission code (from RolePermission or is_superuser)."""

    def __init__(self, permission_code):
        self.permission_code = permission_code

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, 'is_superuser', False):
            return True
        codes = request.user.get_effective_permission_codes()
        return self.permission_code in codes

