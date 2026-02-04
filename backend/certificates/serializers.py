from rest_framework import serializers
from .models import Certificate, CertificateTemplate
from students.serializers import StudentSerializer


class CertificateTemplateSerializer(serializers.ModelSerializer):
    """CertificateTemplate serializer."""
    class Meta:
        model = CertificateTemplate
        fields = [
            'id', 'school', 'name', 'html_template', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CertificateSerializer(serializers.ModelSerializer):
    """Certificate serializer."""
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    
    class Meta:
        model = Certificate
        fields = [
            'id', 'student', 'student_name', 'title', 'issue_date',
            'expires', 'pdf_url', 'pdf_file', 'template_id', 'language',
            'meta', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

