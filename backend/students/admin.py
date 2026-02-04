from django.contrib import admin
from .models import Student, ClassGroup, StudentParent


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('user', 'student_number', 'school', 'class_group', 'enrollment_date')
    list_filter = ('school', 'class_group', 'gender')
    search_fields = ('user__email', 'student_number', 'user__first_name', 'user__last_name')


@admin.register(ClassGroup)
class ClassGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'school', 'grade_level', 'homeroom_teacher', 'academic_year')
    list_filter = ('school', 'grade_level', 'academic_year')
    search_fields = ('name', 'school__name')


@admin.register(StudentParent)
class StudentParentAdmin(admin.ModelAdmin):
    list_display = ('student', 'parent', 'relationship')
    list_filter = ('relationship',)
    search_fields = ('student__user__email', 'parent__email')

