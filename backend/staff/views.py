from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Staff, Subject, StaffSubject
from .serializers import StaffSerializer, SubjectSerializer, StaffSubjectSerializer
from users.permissions import IsSchoolAdmin, IsSuperAdmin


class StaffViewSet(viewsets.ModelViewSet):
    """Staff viewset."""
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
    permission_classes = [IsSchoolAdmin | IsSuperAdmin]
    
    def get_queryset(self):
        queryset = Staff.objects.all()
        school_id = self.request.query_params.get('school_id')
        position = self.request.query_params.get('position')
        
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        if position:
            queryset = queryset.filter(position=position)
        
        return queryset


class SubjectViewSet(viewsets.ModelViewSet):
    """Subject viewset."""
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsSchoolAdmin | IsSuperAdmin]
    
    def get_queryset(self):
        queryset = Subject.objects.all()
        school_id = self.request.query_params.get('school_id')
        if school_id:
            queryset = queryset.filter(school_id=school_id)
        return queryset


class StaffSubjectViewSet(viewsets.ModelViewSet):
    """StaffSubject viewset."""
    queryset = StaffSubject.objects.all()
    serializer_class = StaffSubjectSerializer
    permission_classes = [IsSchoolAdmin | IsSuperAdmin]
    
    def get_queryset(self):
        queryset = StaffSubject.objects.all()
        staff_id = self.request.query_params.get('staff_id')
        subject_id = self.request.query_params.get('subject_id')
        
        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        
        return queryset

