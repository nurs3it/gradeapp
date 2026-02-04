from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from datetime import datetime, timedelta
from .models import Course, ScheduleSlot, Lesson
from .serializers import CourseSerializer, ScheduleSlotSerializer, LessonSerializer
from users.permissions import HasPermission, IsSchoolAdmin, IsTeacher, IsSuperAdmin


class CourseViewSet(viewsets.ModelViewSet):
    """Course viewset."""
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [HasPermission('schedule.admin_manage')]
    
    def get_queryset(self):
        queryset = Course.objects.all()
        school_id = self.request.query_params.get('school_id')
        teacher_id = self.request.query_params.get('teacher_id')
        class_group_id = self.request.query_params.get('class_group_id')
        
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        if class_group_id:
            queryset = queryset.filter(class_group_id=class_group_id)
        
        return queryset


class ScheduleSlotViewSet(viewsets.ModelViewSet):
    """ScheduleSlot viewset."""
    queryset = ScheduleSlot.objects.all()
    serializer_class = ScheduleSlotSerializer
    permission_classes = [HasPermission('schedule.admin_manage')]
    
    def get_queryset(self):
        queryset = ScheduleSlot.objects.all()
        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset
    
    @action(detail=False, methods=['post'])
    def resolve_conflicts(self, request):
        """Detect and suggest resolution for schedule conflicts."""
        # TODO: Implement conflict detection logic
        # Check for overlapping time slots for same teacher/classroom/class_group
        conflicts = []
        
        # Example conflict detection (simplified)
        slots = ScheduleSlot.objects.all()
        for slot1 in slots:
            for slot2 in slots.exclude(id=slot1.id):
                if (slot1.day_of_week == slot2.day_of_week and
                    slot1.start_time < slot2.end_time and
                    slot1.end_time > slot2.start_time):
                    # Check if same teacher or classroom
                    if (slot1.course.teacher == slot2.course.teacher or
                        (slot1.classroom and slot2.classroom and slot1.classroom == slot2.classroom)):
                        conflicts.append({
                            'slot1': ScheduleSlotSerializer(slot1).data,
                            'slot2': ScheduleSlotSerializer(slot2).data,
                            'type': 'teacher' if slot1.course.teacher == slot2.course.teacher else 'classroom'
                        })
        
        return Response({
            'conflicts': conflicts,
            'suggestions': [
                'Move one of the conflicting slots to a different time',
                'Assign different teacher or classroom'
            ]
        })


class LessonViewSet(viewsets.ModelViewSet):
    """Lesson viewset."""
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacher() | IsSchoolAdmin() | IsSuperAdmin()]
        return super().get_permissions()
    
    def get_queryset(self):
        queryset = Lesson.objects.all()
        date = self.request.query_params.get('date')
        course_id = self.request.query_params.get('course_id')
        teacher_id = self.request.query_params.get('teacher_id')
        week = self.request.query_params.get('week')  # Format: YYYY-WW
        
        if date:
            queryset = queryset.filter(date=date)
        elif week:
            # Parse week and get date range
            year, week_num = map(int, week.split('-W'))
            start_date = datetime.strptime(f'{year}-W{week_num-1}-1', '%Y-W%W-%w').date()
            end_date = start_date + timedelta(days=6)
            queryset = queryset.filter(date__range=[start_date, end_date])
        
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def open_attendance(self, request, pk=None):
        """Open attendance for a lesson."""
        lesson = self.get_object()
        lesson.attendance_open_flag = True
        lesson.save()
        return Response({'message': 'Attendance opened'})
    
    @action(detail=True, methods=['post'])
    def close_attendance(self, request, pk=None):
        """Close attendance for a lesson."""
        lesson = self.get_object()
        lesson.attendance_open_flag = False
        lesson.save()
        return Response({'message': 'Attendance closed'})

