import uuid
from django.db import models


class AttendanceStatus(models.TextChoices):
    PRESENT = 'present', 'Present'
    ABSENT = 'absent', 'Absent'
    TARDY = 'tardy', 'Tardy'
    EXCUSED = 'excused', 'Excused'


class Attendance(models.Model):
    """Attendance model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lesson = models.ForeignKey('schedule.Lesson', on_delete=models.CASCADE, related_name='attendance_records')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='attendance_records')
    status = models.CharField(max_length=20, choices=AttendanceStatus.choices, default=AttendanceStatus.PRESENT)
    reason = models.TextField(blank=True, help_text="Причина отсутствия или опоздания")
    recorded_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='attendance_records'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'attendance'
        verbose_name = 'Attendance'
        verbose_name_plural = 'Attendance'
        unique_together = [['lesson', 'student']]
        indexes = [
            models.Index(fields=['lesson', 'student']),
            models.Index(fields=['student']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.get_status_display()} - {self.lesson.date}"

