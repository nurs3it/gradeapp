from rest_framework import serializers
from .models import Grade, Feedback
from students.serializers import StudentSerializer


class GradeSerializer(serializers.ModelSerializer):
    """Grade serializer."""
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Grade
        fields = [
            'id', 'student', 'student_name', 'lesson', 'course', 'course_name',
            'value', 'scale', 'type', 'comment', 'recorded_by', 'recorded_by_name',
            'date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FeedbackSerializer(serializers.ModelSerializer):
    """Feedback serializer."""
    from_user_name = serializers.CharField(source='from_user.get_full_name', read_only=True)
    to_student_name = serializers.CharField(source='to_student.user.get_full_name', read_only=True)
    
    class Meta:
        model = Feedback
        fields = [
            'id', 'from_user', 'from_user_name', 'to_student', 'to_student_name',
            'text', 'tags', 'date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

