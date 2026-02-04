from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
from django.conf import settings
import os
from .models import Certificate, CertificateTemplate
from .serializers import CertificateSerializer, CertificateTemplateSerializer
from .services import generate_certificate_pdf
from users.permissions import IsSchoolAdmin, IsTeacher, IsSuperAdmin


class CertificateTemplateViewSet(viewsets.ModelViewSet):
    """CertificateTemplate viewset."""
    queryset = CertificateTemplate.objects.all()
    serializer_class = CertificateTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Allow read access for teachers, full access for admins
        if self.action in ['list', 'retrieve']:
            from users.permissions import IsTeacher
            # IsTeacher includes Teacher, SchoolAdmin, Director, SuperAdmin
            return [IsTeacher()]
        # Full access for admins only
        return [IsSchoolAdmin() | IsSuperAdmin()]
    
    def get_queryset(self):
        queryset = CertificateTemplate.objects.all()
        school_id = self.request.query_params.get('school_id')
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        return queryset


class CertificateViewSet(viewsets.ModelViewSet):
    """Certificate viewset."""
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'generate']:
            return [IsTeacher() | IsSchoolAdmin() | IsSuperAdmin()]
        return super().get_permissions()
    
    def get_queryset(self):
        queryset = Certificate.objects.all()
        student_id = self.request.query_params.get('student_id')
        school_id = self.request.query_params.get('school_id')
        
        user = self.request.user
        
        # Students can only see their own certificates
        if user.has_role('student'):
            try:
                student = user.student_profile
                queryset = queryset.filter(student=student)
            except:
                queryset = Certificate.objects.none()
        
        # Parents can only see their children's certificates
        if user.has_role('parent'):
            children_ids = [sp.student_id for sp in user.children.all()]
            queryset = queryset.filter(student_id__in=children_ids)
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if school_id:
            queryset = queryset.filter(student__school_id=school_id)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate certificate PDF."""
        student_id = request.data.get('student_id')
        template_id = request.data.get('template_id')
        title = request.data.get('title', 'Certificate')
        language = request.data.get('language', 'ru')
        meta = request.data.get('meta', {})
        
        if not student_id:
            return Response({'error': 'student_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        from students.models import Student
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Create certificate
        certificate = Certificate.objects.create(
            student=student,
            title=title,
            language=language,
            meta=meta,
            issue_date=request.data.get('issue_date')
        )
        
        # Get template
        template = None
        if template_id:
            try:
                template = CertificateTemplate.objects.get(id=template_id)
            except CertificateTemplate.DoesNotExist:
                pass
        
        # Generate PDF
        try:
            generate_certificate_pdf(certificate, template)
            serializer = self.get_serializer(certificate)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            certificate.delete()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download certificate PDF."""
        certificate = self.get_object()
        
        if not certificate.pdf_file:
            return Response({'error': 'PDF not generated'}, status=status.HTTP_404_NOT_FOUND)
        
        filepath = certificate.pdf_file.path
        if not os.path.exists(filepath):
            return Response({'error': 'PDF file not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return FileResponse(
            open(filepath, 'rb'),
            content_type='application/pdf',
            filename=f"certificate_{certificate.id}.pdf"
        )

