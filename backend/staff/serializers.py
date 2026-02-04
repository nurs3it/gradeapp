from rest_framework import serializers
from .models import Staff, Subject, StaffSubject
from users.serializers import UserSerializer


class SubjectSerializer(serializers.ModelSerializer):
    """Subject serializer."""
    class Meta:
        model = Subject
        fields = [
            'id', 'school', 'name', 'code', 'description',
            'default_credits', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class StaffSubjectSerializer(serializers.ModelSerializer):
    """StaffSubject serializer."""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = StaffSubject
        fields = ['id', 'staff', 'subject', 'subject_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class StaffSerializer(serializers.ModelSerializer):
    """Staff serializer."""
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)
    subjects = SubjectSerializer(many=True, read_only=True, source='subjects.subject')
    
    class Meta:
        model = Staff
        fields = [
            'id', 'user', 'user_id', 'school', 'position',
            'employment_date', 'load_limit_hours', 'subjects',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

