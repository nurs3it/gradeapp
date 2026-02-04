from rest_framework import serializers
from .models import Student, ClassGroup, StudentParent
from users.serializers import UserSerializer


class ClassGroupSerializer(serializers.ModelSerializer):
    """ClassGroup serializer."""
    homeroom_teacher_name = serializers.CharField(source='homeroom_teacher.user.get_full_name', read_only=True)
    student_count = serializers.IntegerField(source='students.count', read_only=True)
    
    class Meta:
        model = ClassGroup
        fields = [
            'id', 'school', 'name', 'grade_level', 'homeroom_teacher',
            'homeroom_teacher_name', 'academic_year', 'student_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentParentSerializer(serializers.ModelSerializer):
    """StudentParent serializer."""
    parent_email = serializers.EmailField(source='parent.email', read_only=True)
    parent_name = serializers.CharField(source='parent.get_full_name', read_only=True)
    
    class Meta:
        model = StudentParent
        fields = ['id', 'student', 'parent', 'parent_email', 'parent_name', 'relationship', 'created_at']
        read_only_fields = ['id', 'created_at']


class StudentSerializer(serializers.ModelSerializer):
    """Student serializer."""
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True, required=False)
    class_group_name = serializers.CharField(source='class_group.name', read_only=True)
    parents = StudentParentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Student
        fields = [
            'id', 'user', 'user_id', 'school', 'student_number',
            'class_group', 'class_group_name', 'enrollment_date',
            'graduation_date', 'birth_date', 'gender', 'parents',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

