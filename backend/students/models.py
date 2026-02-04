import uuid
from django.db import models


class Student(models.Model):
    """Student model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='students')
    student_number = models.CharField(max_length=50, unique=True, db_index=True)
    class_group = models.ForeignKey(
        'ClassGroup',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    enrollment_date = models.DateField()
    graduation_date = models.DateField(null=True, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'students'
        verbose_name = 'Student'
        verbose_name_plural = 'Students'
        indexes = [
            models.Index(fields=['school', 'class_group']),
            models.Index(fields=['student_number']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} ({self.student_number})"


class ClassGroup(models.Model):
    """Class group model (e.g., 10A, 11B)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='class_groups')
    name = models.CharField(max_length=50, help_text="e.g., '10A', '11B'")
    grade_level = models.IntegerField(help_text="Уровень класса (10, 11, etc.)")
    homeroom_teacher = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='homeroom_classes'
    )
    academic_year = models.ForeignKey(
        'schools.AcademicYear',
        on_delete=models.CASCADE,
        related_name='class_groups'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'class_groups'
        verbose_name = 'Class Group'
        verbose_name_plural = 'Class Groups'
        unique_together = [['school', 'name', 'academic_year']]
        indexes = [
            models.Index(fields=['school', 'academic_year']),
            models.Index(fields=['grade_level']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.school.name})"


class StudentParent(models.Model):
    """Many-to-many relationship between Students and Parents."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='parents')
    parent = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='children')
    relationship = models.CharField(
        max_length=50,
        default='parent',
        help_text="e.g., 'mother', 'father', 'guardian'"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'student_parents'
        unique_together = [['student', 'parent']]
    
    def __str__(self):
        return f"{self.parent.get_full_name()} - {self.student.user.get_full_name()}"

