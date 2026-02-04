from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.contrib.auth import get_user_model
import csv
import io
from datetime import datetime
from .models import Student, ClassGroup, StudentParent
from .serializers import StudentSerializer, ClassGroupSerializer, StudentParentSerializer
from users.permissions import IsSchoolAdmin, IsTeacher, IsSuperAdmin
from schools.models import School, AcademicYear

User = get_user_model()


class ClassGroupViewSet(viewsets.ModelViewSet):
    """ClassGroup viewset."""
    queryset = ClassGroup.objects.all()
    serializer_class = ClassGroupSerializer
    permission_classes = [IsSchoolAdmin | IsSuperAdmin]
    
    def get_queryset(self):
        queryset = ClassGroup.objects.all()
        school_id = self.request.query_params.get('school_id')
        academic_year_id = self.request.query_params.get('academic_year_id')
        
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        if academic_year_id:
            queryset = queryset.filter(academic_year_id=academic_year_id)
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """Get students in a class group."""
        class_group = self.get_object()
        students = class_group.students.all()
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)


class StudentViewSet(viewsets.ModelViewSet):
    """Student viewset."""
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSchoolAdmin() | IsSuperAdmin()]
        elif self.action == 'list':
            return [IsTeacher() | IsSchoolAdmin() | IsSuperAdmin()]
        return super().get_permissions()
    
    def get_queryset(self):
        queryset = Student.objects.all()
        school_id = self.request.query_params.get('school_id')
        class_group_id = self.request.query_params.get('class_group_id')
        
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        if class_group_id:
            queryset = queryset.filter(class_group_id=class_group_id)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def bulk_import(self, request):
        """Bulk import students from CSV."""
        if 'file' not in request.FILES:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        csv_file = request.FILES['file']
        school_id = request.data.get('school_id')
        class_group_id = request.data.get('class_group_id')
        
        if not school_id:
            return Response({"error": "school_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            school = School.objects.get(id=school_id)
        except School.DoesNotExist:
            return Response({"error": "School not found"}, status=status.HTTP_404_NOT_FOUND)
        
        class_group = None
        if class_group_id:
            try:
                class_group = ClassGroup.objects.get(id=class_group_id, school=school)
            except ClassGroup.DoesNotExist:
                return Response({"error": "Class group not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Read CSV
        decoded_file = csv_file.read().decode('utf-8-sig')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)
        
        created = []
        errors = []
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 (1 is header)
            try:
                # Required fields
                email = row.get('email', '').strip()
                first_name = row.get('first_name', '').strip()
                last_name = row.get('last_name', '').strip()
                student_number = row.get('student_number', '').strip()
                
                if not all([email, first_name, last_name, student_number]):
                    errors.append(f"Row {row_num}: Missing required fields")
                    continue
                
                # Check if student number already exists
                if Student.objects.filter(student_number=student_number).exists():
                    errors.append(f"Row {row_num}: Student number {student_number} already exists")
                    continue
                
                # Check if user already exists
                user, user_created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'first_name': first_name,
                        'last_name': last_name,
                        'language_pref': row.get('language_pref', 'ru').strip() or 'ru',
                        'linked_school': school,
                    }
                )
                
                if not user_created:
                    # Update existing user
                    user.first_name = first_name
                    user.last_name = last_name
                    user.linked_school = school
                    user.save()
                
                # Parse dates
                enrollment_date = datetime.strptime(
                    row.get('enrollment_date', datetime.now().strftime('%Y-%m-%d')).strip(),
                    '%Y-%m-%d'
                ).date()
                
                birth_date = None
                if row.get('birth_date'):
                    try:
                        birth_date = datetime.strptime(row.get('birth_date').strip(), '%Y-%m-%d').date()
                    except ValueError:
                        pass
                
                # Create student
                student, student_created = Student.objects.get_or_create(
                    student_number=student_number,
                    defaults={
                        'user': user,
                        'school': school,
                        'class_group': class_group,
                        'enrollment_date': enrollment_date,
                        'birth_date': birth_date,
                        'gender': row.get('gender', '').strip().upper()[:1] or '',
                    }
                )
                
                if not student_created:
                    # Update existing student
                    student.user = user
                    student.school = school
                    student.class_group = class_group
                    student.enrollment_date = enrollment_date
                    student.birth_date = birth_date
                    student.gender = row.get('gender', '').strip().upper()[:1] or ''
                    student.save()
                
                # Assign student role if not exists
                from users.models import UserRole, Role
                UserRole.objects.get_or_create(
                    user=user,
                    school=school,
                    role=Role.STUDENT
                )
                
                created.append({
                    'student_number': student_number,
                    'name': f"{first_name} {last_name}",
                    'email': email
                })
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        return Response({
            'created': len(created),
            'errors': len(errors),
            'details': {
                'created_students': created,
                'error_messages': errors
            }
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export students to CSV."""
        school_id = request.query_params.get('school_id')
        class_group_id = request.query_params.get('class_group_id')
        
        queryset = self.get_queryset()
        
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        if class_group_id:
            queryset = queryset.filter(class_group_id=class_group_id)
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="students_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'email', 'first_name', 'last_name', 'student_number',
            'enrollment_date', 'birth_date', 'gender', 'language_pref',
            'class_group', 'school'
        ])
        
        for student in queryset:
            writer.writerow([
                student.user.email,
                student.user.first_name,
                student.user.last_name,
                student.student_number,
                student.enrollment_date.strftime('%Y-%m-%d') if student.enrollment_date else '',
                student.birth_date.strftime('%Y-%m-%d') if student.birth_date else '',
                student.gender,
                student.user.language_pref,
                student.class_group.name if student.class_group else '',
                student.school.name,
            ])
        
        return response


class StudentParentViewSet(viewsets.ModelViewSet):
    """StudentParent viewset."""
    queryset = StudentParent.objects.all()
    serializer_class = StudentParentSerializer
    permission_classes = [IsSchoolAdmin | IsSuperAdmin]
    
    def get_queryset(self):
        queryset = StudentParent.objects.all()
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset

