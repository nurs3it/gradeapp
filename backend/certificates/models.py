import uuid
from django.db import models


class Certificate(models.Model):
    """Certificate model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='certificates')
    title = models.CharField(max_length=255)
    issue_date = models.DateField()
    expires = models.DateField(null=True, blank=True)
    pdf_url = models.URLField(blank=True, help_text="URL для скачивания PDF")
    pdf_file = models.FileField(
        upload_to='certificates/',
        null=True,
        blank=True,
        help_text="Файл сертификата"
    )
    template_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="ID шаблона сертификата"
    )
    language = models.CharField(
        max_length=2,
        default='ru',
        help_text="Язык сертификата (ru/kz/en)"
    )
    meta = models.JSONField(
        default=dict,
        help_text="Дополнительные данные (подписи, печати, etc.)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'certificates'
        verbose_name = 'Certificate'
        verbose_name_plural = 'Certificates'
        indexes = [
            models.Index(fields=['student', 'issue_date']),
            models.Index(fields=['issue_date']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.student.user.get_full_name()} ({self.issue_date})"


class CertificateTemplate(models.Model):
    """Certificate template model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey('schools.School', on_delete=models.CASCADE, related_name='certificate_templates')
    name = models.CharField(max_length=255)
    html_template = models.TextField(help_text="HTML шаблон с placeholders ({{student_name}}, {{grade}}, etc.)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'certificate_templates'
        verbose_name = 'Certificate Template'
        verbose_name_plural = 'Certificate Templates'
    
    def __str__(self):
        return f"{self.name} ({self.school.name})"

