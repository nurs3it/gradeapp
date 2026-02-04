from django.test import TestCase
from .models import School, AcademicYear, SchoolType
from datetime import date


class SchoolModelTest(TestCase):
    def setUp(self):
        self.school = School.objects.create(
            name='Test School',
            type=SchoolType.NIS,
            city='Almaty',
            grading_system={'scale': '10-point', 'min': 0, 'max': 10}
        )

    def test_school_creation(self):
        self.assertEqual(self.school.name, 'Test School')
        self.assertEqual(self.school.type, SchoolType.NIS)
        self.assertIsNotNone(self.school.grading_system)

    def test_academic_year(self):
        academic_year = AcademicYear.objects.create(
            school=self.school,
            name='2024-2025',
            start_date=date(2024, 9, 1),
            end_date=date(2025, 5, 31),
            is_current=True
        )
        self.assertEqual(academic_year.school, self.school)
        self.assertTrue(academic_year.is_current)

