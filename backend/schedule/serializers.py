from rest_framework import serializers
from .models import Course, ScheduleSlot, Lesson
from staff.serializers import StaffSerializer
from students.serializers import ClassGroupSerializer


class ScheduleSlotSerializer(serializers.ModelSerializer):
    """ScheduleSlot serializer."""
    course_name = serializers.CharField(source='course.name', read_only=True)
    
    class Meta:
        model = ScheduleSlot
        fields = [
            'id', 'course', 'course_name', 'day_of_week',
            'start_time', 'end_time', 'classroom', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CourseSerializer(serializers.ModelSerializer):
    """Course serializer."""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    class_group_name = serializers.CharField(source='class_group.name', read_only=True)
    schedule_slots = ScheduleSlotSerializer(many=True, read_only=True)
    
    class Meta:
        model = Course
        fields = [
            'id', 'school', 'name', 'subject', 'subject_name',
            'teacher', 'teacher_name', 'class_group', 'class_group_name',
            'academic_year', 'is_optional', 'schedule_rules', 'schedule_slots',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LessonSerializer(serializers.ModelSerializer):
    """Lesson serializer."""
    course_name = serializers.CharField(source='course.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    
    class Meta:
        model = Lesson
        fields = [
            'id', 'course', 'course_name', 'date', 'start_time', 'end_time',
            'classroom', 'teacher', 'teacher_name', 'attendance_open_flag',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

