import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class GradeType(models.TextChoices):
    QUIZ = 'quiz', 'Quiz'
    HOMEWORK = 'homework', 'Homework'
    EXAM = 'exam', 'Exam'
    PROJECT = 'project', 'Project'
    PARTICIPATION = 'participation', 'Participation'
    FINAL = 'final', 'Final'


class Grade(models.Model):
    """Grade model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='grades')
    lesson = models.ForeignKey(
        'schedule.Lesson',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='grades',
        help_text="Оценка за конкретный урок (опционально)"
    )
    course = models.ForeignKey('schedule.Course', on_delete=models.CASCADE, related_name='grades')
    value = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Значение оценки"
    )
    scale = models.CharField(
        max_length=50,
        default='10-point',
        help_text="Шкала оценок (например, '10-point', '5-point')"
    )
    type = models.CharField(max_length=20, choices=GradeType.choices, default=GradeType.HOMEWORK)
    comment = models.TextField(blank=True)
    recorded_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='grades_recorded'
    )
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'grades'
        verbose_name = 'Grade'
        verbose_name_plural = 'Grades'
        indexes = [
            models.Index(fields=['student', 'course']),
            models.Index(fields=['student', 'date']),
            models.Index(fields=['course', 'date']),
            models.Index(fields=['type']),
        ]
    
    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.value} ({self.get_type_display()})"


class Feedback(models.Model):
    """Feedback model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    from_user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='feedback_given',
        help_text="Учитель, оставивший фидбэк"
    )
    to_student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='feedback_received'
    )
    text = models.TextField()
    tags = models.JSONField(
        default=list,
        help_text="Теги для категоризации фидбэка"
    )
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'feedback'
        verbose_name = 'Feedback'
        verbose_name_plural = 'Feedback'
        indexes = [
            models.Index(fields=['to_student', 'date']),
            models.Index(fields=['from_user']),
        ]
    
    def __str__(self):
        return f"Feedback to {self.to_student.user.get_full_name()} from {self.from_user.get_full_name()}"

