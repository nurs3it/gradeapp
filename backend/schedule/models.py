import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Course(models.Model):
    """Course/Program model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='courses')
    name = models.CharField(max_length=255)
    subject = models.ForeignKey('staff.Subject', on_delete=models.CASCADE, related_name='courses')
    teacher = models.ForeignKey('staff.Staff', on_delete=models.CASCADE, related_name='courses')
    class_group = models.ForeignKey(
        'students.ClassGroup',
        on_delete=models.CASCADE,
        related_name='courses'
    )
    academic_year = models.ForeignKey(
        'schools.AcademicYear',
        on_delete=models.CASCADE,
        related_name='courses'
    )
    is_optional = models.BooleanField(default=False)
    schedule_rules = models.JSONField(
        default=dict,
        help_text="Правила расписания (например, количество уроков в неделю)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'courses'
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'
        indexes = [
            models.Index(fields=['school', 'academic_year']),
            models.Index(fields=['teacher']),
            models.Index(fields=['class_group']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.class_group.name}"


class ScheduleSlot(models.Model):
    """Schedule slot model (recurring weekly schedule)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='schedule_slots')
    day_of_week = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(6)],
        help_text="0=Monday, 6=Sunday"
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    classroom = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'schedule_slots'
        verbose_name = 'Schedule Slot'
        verbose_name_plural = 'Schedule Slots'
        indexes = [
            models.Index(fields=['course', 'day_of_week']),
        ]
    
    def __str__(self):
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return f"{self.course.name} - {days[self.day_of_week]} {self.start_time}-{self.end_time}"


class Lesson(models.Model):
    """Lesson/Session model (actual lesson instance)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    classroom = models.CharField(max_length=100, blank=True)
    teacher = models.ForeignKey('staff.Staff', on_delete=models.CASCADE, related_name='lessons')
    attendance_open_flag = models.BooleanField(
        default=False,
        help_text="Флаг открытия посещаемости для отметки"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'lessons'
        verbose_name = 'Lesson'
        verbose_name_plural = 'Lessons'
        indexes = [
            models.Index(fields=['course', 'date']),
            models.Index(fields=['teacher', 'date']),
            models.Index(fields=['date']),
        ]
    
    def __str__(self):
        return f"{self.course.name} - {self.date} {self.start_time}"

