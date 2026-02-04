from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count
from .models import Grade, Feedback
from .serializers import GradeSerializer, FeedbackSerializer
from users.permissions import IsTeacher, IsSchoolAdmin, IsSuperAdmin, IsParent, IsStudent


class GradeViewSet(viewsets.ModelViewSet):
    """Grade viewset."""
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacher() | IsSchoolAdmin() | IsSuperAdmin()]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)
    
    def get_queryset(self):
        queryset = Grade.objects.all()
        student_id = self.request.query_params.get('student_id')
        course_id = self.request.query_params.get('course_id')
        period = self.request.query_params.get('period')  # e.g., '2024-01'
        
        user = self.request.user
        
        # Students can only see their own grades
        if user.has_role('student'):
            try:
                student = user.student_profile
                queryset = queryset.filter(student=student)
            except:
                queryset = Grade.objects.none()
        
        # Parents can only see their children's grades
        if user.has_role('parent'):
            children_ids = [sp.student_id for sp in user.children.all()]
            queryset = queryset.filter(student_id__in=children_ids)
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if period:
            year, month = map(int, period.split('-'))
            queryset = queryset.filter(date__year=year, date__month=month)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get grade statistics."""
        student_id = request.query_params.get('student_id')
        course_id = request.query_params.get('course_id')
        
        queryset = self.get_queryset()
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        stats = queryset.aggregate(
            avg_grade=Avg('value'),
            total_grades=Count('id')
        )
        
        return Response(stats)


class FeedbackViewSet(viewsets.ModelViewSet):
    """Feedback viewset."""
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacher() | IsSchoolAdmin() | IsSuperAdmin()]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        serializer.save(from_user=self.request.user)
    
    def get_queryset(self):
        queryset = Feedback.objects.all()
        student_id = self.request.query_params.get('student_id')
        
        user = self.request.user
        
        # Students can only see feedback to them
        if user.has_role('student'):
            try:
                student = user.student_profile
                queryset = queryset.filter(to_student=student)
            except:
                queryset = Feedback.objects.none()
        
        # Parents can only see feedback to their children
        if user.has_role('parent'):
            children_ids = [sp.student_id for sp in user.children.all()]
            queryset = queryset.filter(to_student_id__in=children_ids)
        
        if student_id:
            queryset = queryset.filter(to_student_id=student_id)
        
        return queryset

