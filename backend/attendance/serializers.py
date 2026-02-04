from rest_framework import serializers
from .models import Attendance
from students.serializers import StudentSerializer


class AttendanceSerializer(serializers.ModelSerializer):
    """Attendance serializer."""
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    lesson_date = serializers.DateField(source='lesson.date', read_only=True)
    lesson_course = serializers.CharField(source='lesson.course.name', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'lesson', 'lesson_date', 'lesson_course', 'student', 'student_name',
            'status', 'reason', 'recorded_by', 'recorded_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

