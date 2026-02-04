import uuid
import secrets
import string
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


def generate_connection_code():
    """Generate a unique 6-character alphanumeric code (uppercase + digits)."""
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(6))


class City(models.Model):
    """City reference for schools."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, unique=True)
    name_ru = models.CharField(max_length=150, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cities'
        verbose_name = 'City'
        verbose_name_plural = 'Cities'
        ordering = ['name']

    def __str__(self):
        return self.name_ru or self.name


class School(models.Model):
    """School model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    connection_code = models.CharField(
        max_length=6,
        unique=True,
        db_index=True,
        blank=True,
        editable=False,
        help_text="6-значный код для подключения к школе (генерируется автоматически)"
    )
    city = models.ForeignKey(
        City,
        on_delete=models.PROTECT,
        related_name='schools',
        null=True,
        blank=True,
    )
    address = models.TextField(blank=True)
    grading_system = models.JSONField(
        default=dict,
        help_text="Настройки шкалы оценок, например: {'scale': '10-point', 'min': 0, 'max': 10}"
    )
    languages_supported = models.JSONField(
        default=list,
        help_text="Список поддерживаемых языков: ['ru', 'kz', 'en']"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'schools'
        verbose_name = 'School'
        verbose_name_plural = 'Schools'
        indexes = [
            models.Index(fields=['city']),
        ]

    def __str__(self):
        return f"{self.name} ({self.city.name if self.city else '-'})"

    def save(self, *args, **kwargs):
        if not self.connection_code:
            for _ in range(10):
                code = generate_connection_code()
                if not School.objects.filter(connection_code=code).exists():
                    self.connection_code = code
                    break
            else:
                raise ValueError("Could not generate unique connection_code")
        super().save(*args, **kwargs)


class AcademicYear(models.Model):
    """Academic year for a school."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='academic_years')
    name = models.CharField(max_length=50, help_text="e.g., '2024-2025'")
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'academic_years'
        verbose_name = 'Academic Year'
        verbose_name_plural = 'Academic Years'
        unique_together = [['school', 'name']]
        indexes = [
            models.Index(fields=['school', 'is_current']),
        ]
    
    def __str__(self):
        return f"{self.school.name} - {self.name}"

