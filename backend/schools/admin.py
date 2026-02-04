from django.contrib import admin
from .models import City, School, AcademicYear


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('name', 'name_ru', 'created_at')
    search_fields = ('name', 'name_ru')


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'created_at')
    list_filter = ('city',)
    search_fields = ('name', 'city__name')


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ('school', 'name', 'start_date', 'end_date', 'is_current')
    list_filter = ('is_current', 'school')
    search_fields = ('name', 'school__name')
