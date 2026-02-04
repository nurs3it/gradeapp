from rest_framework import serializers
from .models import City, School, AcademicYear


class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ['id', 'name', 'name_ru']


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ['id', 'school', 'name', 'start_date', 'end_date', 'is_current', 'created_at']
        read_only_fields = ['id', 'created_at']


class SchoolSerializer(serializers.ModelSerializer):
    city_detail = CitySerializer(source='city', read_only=True)
    academic_years = AcademicYearSerializer(many=True, read_only=True)

    class Meta:
        model = School
        fields = [
            'id', 'name', 'connection_code', 'city', 'city_detail', 'address',
            'grading_system', 'languages_supported',
            'academic_years', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'connection_code', 'created_at', 'updated_at']
