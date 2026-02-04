from django.test import TestCase
from django.contrib.auth import get_user_model
from schools.models import School, SchoolType, AcademicYear
from students.models import Student, ClassGroup
from staff.models import Staff, Subject, Position
from schedule.models import Course
from journal.models import Grade, GradeType
from datetime import date

User = get_user_model()


class GradeModelTest(TestCase):
    def setUp(self):
        self.school = School.objects.create(
            name='Test School',
            type=SchoolType.NIS,
            city='Almaty'
        )
        self.academic_year = AcademicYear.objects.create(
            school=self.school,
            name='2024-2025',
            start_date=date(2024, 9, 1),
            end_date=date(2025, 5, 31)
        )
        self.user = User.objects.create_user(
            email='student@test.com',
            password='test123'
        )
        self.student = Student.objects.create(
            user=self.user,
            school=self.school,
            student_number='STU001',
            enrollment_date=date(2024, 9, 1)
        )
        self.teacher_user = User.objects.create_user(
            email='teacher@test.com',
            password='test123'
        )
        self.teacher = Staff.objects.create(
            user=self.teacher_user,
            school=self.school,
            position=Position.TEACHER,
            employment_date=date(2020, 9, 1)
        )
        self.subject = Subject.objects.create(
            school=self.school,
            name='Mathematics',
            code='MATH'
        )
        self.class_group = ClassGroup.objects.create(
            school=self.school,
            name='10A',
            grade_level=10,
            academic_year=self.academic_year
        )
        self.course = Course.objects.create(
            school=self.school,
            name='Math Course',
            subject=self.subject,
            teacher=self.teacher,
            class_group=self.class_group,
            academic_year=self.academic_year
        )

    def test_grade_creation(self):
        grade = Grade.objects.create(
            student=self.student,
            course=self.course,
            value=8.5,
            scale='10-point',
            type=GradeType.HOMEWORK,
            recorded_by=self.teacher_user,
            date=date.today()
        )
        self.assertEqual(grade.student, self.student)
        self.assertEqual(grade.course, self.course)
        self.assertEqual(float(grade.value), 8.5)
        self.assertEqual(grade.type, GradeType.HOMEWORK)

