import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Position(models.TextChoices):
    TEACHER = 'teacher', 'Teacher'
    DIRECTOR = 'director', 'Director'
    ADMIN = 'admin', 'Admin'
    REGISTRAR = 'registrar', 'Registrar'
    SCHEDULER = 'scheduler', 'Scheduler'


class Staff(models.Model):
    """Staff member model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='staff_profile'
    )
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='staff_members')
    position = models.CharField(max_length=20, choices=Position.choices, default=Position.TEACHER)
    employment_date = models.DateField()
    load_limit_hours = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(40)],
        help_text="Максимальная нагрузка в часах в неделю"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'staff'
        verbose_name = 'Staff'
        verbose_name_plural = 'Staff'
        indexes = [
            models.Index(fields=['school', 'position']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_position_display()} @ {self.school.name}"


class Subject(models.Model):
    """Subject model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='subjects')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    default_credits = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'subjects'
        verbose_name = 'Subject'
        verbose_name_plural = 'Subjects'
        unique_together = [['school', 'code']] if 'code' else []
        indexes = [
            models.Index(fields=['school']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.school.name})"


class StaffSubject(models.Model):
    """Many-to-many relationship between Staff and Subjects."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='subjects')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='staff_members')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'staff_subjects'
        unique_together = [['staff', 'subject']]
    
    def __str__(self):
        return f"{self.staff.user.get_full_name()} - {self.subject.name}"

