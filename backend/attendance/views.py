from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from datetime import date, timedelta
from .models import Attendance
from .serializers import AttendanceSerializer
from users.permissions import IsTeacher, IsSchoolAdmin, IsSuperAdmin, IsParent, IsStudent


class AttendanceViewSet(viewsets.ModelViewSet):
    """Attendance viewset."""
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'mark']:
            return [IsTeacher() | IsSchoolAdmin() | IsSuperAdmin()]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)
    
    def get_queryset(self):
        queryset = Attendance.objects.all()
        student_id = self.request.query_params.get('student_id')
        lesson_id = self.request.query_params.get('lesson_id')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        user = self.request.user
        
        # Students can only see their own attendance
        if user.has_role('student'):
            try:
                student = user.student_profile
                queryset = queryset.filter(student=student)
            except:
                queryset = Attendance.objects.none()
        
        # Parents can only see their children's attendance
        if user.has_role('parent'):
            children_ids = [sp.student_id for sp in user.children.all()]
            queryset = queryset.filter(student_id__in=children_ids)
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)
        if date_from:
            queryset = queryset.filter(lesson__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(lesson__date__lte=date_to)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def mark(self, request):
        """Mark attendance for multiple students."""
        lesson_id = request.data.get('lesson_id')
        records = request.data.get('records', [])  # List of {student_id, status, reason}
        
        if not lesson_id:
            return Response({'error': 'lesson_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        created = []
        updated = []
        
        for record in records:
            student_id = record.get('student_id')
            status_val = record.get('status')
            reason = record.get('reason', '')
            
            attendance, created_flag = Attendance.objects.update_or_create(
                lesson_id=lesson_id,
                student_id=student_id,
                defaults={
                    'status': status_val,
                    'reason': reason,
                    'recorded_by': request.user
                }
            )
            
            if created_flag:
                created.append(attendance.id)
            else:
                updated.append(attendance.id)
        
        return Response({
            'created': created,
            'updated': updated,
            'message': f'Marked attendance for {len(records)} students'
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get attendance statistics."""
        student_id = request.query_params.get('student_id')
        date_from = request.query_params.get('date_from', str(date.today() - timedelta(days=30)))
        date_to = request.query_params.get('date_to', str(date.today()))
        
        queryset = self.get_queryset().filter(
            lesson__date__range=[date_from, date_to]
        )
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        total = queryset.count()
        present = queryset.filter(status='present').count()
        absent = queryset.filter(status='absent').count()
        tardy = queryset.filter(status='tardy').count()
        
        attendance_rate = (present / total * 100) if total > 0 else 0
        
        return Response({
            'total': total,
            'present': present,
            'absent': absent,
            'tardy': tardy,
            'attendance_rate': round(attendance_rate, 2),
            'period': {'from': date_from, 'to': date_to}
        })

