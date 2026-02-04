"""
Management command to load demo data for the educational platform.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from users.models import User, UserRole, Role
from schools.models import School, AcademicYear, City
from staff.models import Staff, Subject, StaffSubject, Position
from students.models import Student, ClassGroup, StudentParent
from schedule.models import Course, ScheduleSlot, Lesson
from journal.models import Grade, Feedback, GradeType
from attendance.models import Attendance, AttendanceStatus
from certificates.models import Certificate, CertificateTemplate
import uuid


class Command(BaseCommand):
    help = 'Load demo data for the educational platform'
    
    def handle(self, *args, **options):
        self.stdout.write('Loading demo data...')

        # Ensure cities exist for demo
        city_almaty, _ = City.objects.get_or_create(
            name='Almaty',
            defaults={'name_ru': 'Алматы'}
        )
        City.objects.get_or_create(name='Astana', defaults={'name_ru': 'Астана'})
        City.objects.get_or_create(name='Shymkent', defaults={'name_ru': 'Шымкент'})

        # Create demo school
        school = School.objects.create(
            name='Haileybury Almaty',
            city=city_almaty,
            address='Almaty, Kazakhstan',
            grading_system={'scale': '10-point', 'min': 0, 'max': 10},
            languages_supported=['ru', 'kz', 'en']
        )
        self.stdout.write(self.style.SUCCESS(f'Created school: {school.name} (connection code: {school.connection_code})'))

        # Create academic year
        academic_year = AcademicYear.objects.create(
            school=school,
            name='2024-2025',
            start_date=date(2024, 9, 1),
            end_date=date(2025, 5, 31),
            is_current=True
        )
        self.stdout.write(self.style.SUCCESS(f'Created academic year: {academic_year.name}'))
        
        # Create SuperAdmin
        superadmin = User.objects.create_user(
            email='superadmin@haileybury.kz',
            password='admin123',
            first_name='Super',
            last_name='Admin',
            language_pref='en',
            linked_school=school
        )
        superadmin.is_staff = True
        superadmin.is_superuser = True
        superadmin.save()
        UserRole.objects.create(user=superadmin, school=school, role=Role.SUPERADMIN)
        self.stdout.write(self.style.SUCCESS('Created SuperAdmin'))
        
        # Create SchoolAdmin
        schooladmin = User.objects.create_user(
            email='admin@haileybury.kz',
            password='admin123',
            first_name='School',
            last_name='Administrator',
            language_pref='ru',
            linked_school=school
        )
        UserRole.objects.create(user=schooladmin, school=school, role=Role.SCHOOLADMIN)
        staff_admin = Staff.objects.create(
            user=schooladmin,
            school=school,
            position=Position.ADMIN,
            employment_date=date(2020, 9, 1)
        )
        self.stdout.write(self.style.SUCCESS('Created SchoolAdmin'))
        
        # Create Director
        director = User.objects.create_user(
            email='director@haileybury.kz',
            password='director123',
            first_name='Director',
            last_name='Principal',
            language_pref='ru',
            linked_school=school
        )
        UserRole.objects.create(user=director, school=school, role=Role.DIRECTOR)
        staff_director = Staff.objects.create(
            user=director,
            school=school,
            position=Position.DIRECTOR,
            employment_date=date(2019, 9, 1)
        )
        self.stdout.write(self.style.SUCCESS('Created Director'))

        # Create Scheduler (Составитель расписания)
        scheduler = User.objects.create_user(
            email='scheduler@haileybury.kz',
            password='scheduler123',
            first_name='Schedule',
            last_name='Manager',
            language_pref='ru',
            linked_school=school
        )
        UserRole.objects.create(user=scheduler, school=school, role=Role.SCHEDULER)
        Staff.objects.create(
            user=scheduler,
            school=school,
            position=Position.SCHEDULER,
            employment_date=date(2023, 9, 1)
        )
        self.stdout.write(self.style.SUCCESS('Created Scheduler (Составитель расписания)'))

        # Create 3 teachers
        teachers = []
        teacher_names = [
            ('Ivan', 'Ivanov', 'ivanov@haileybury.kz'),
            ('Maria', 'Petrova', 'petrova@haileybury.kz'),
            ('Aidar', 'Nurmagambetov', 'nurmagambetov@haileybury.kz'),
        ]
        
        for first_name, last_name, email in teacher_names:
            teacher_user = User.objects.create_user(
                email=email,
                password='teacher123',
                first_name=first_name,
                last_name=last_name,
                language_pref='ru',
                linked_school=school
            )
            UserRole.objects.create(user=teacher_user, school=school, role=Role.TEACHER)
            teacher_staff = Staff.objects.create(
                user=teacher_user,
                school=school,
                position=Position.TEACHER,
                employment_date=date(2022, 9, 1),
                load_limit_hours=20
            )
            teachers.append(teacher_staff)
            self.stdout.write(self.style.SUCCESS(f'Created teacher: {first_name} {last_name}'))
        
        # Create subjects
        subjects = []
        subject_data = [
            ('Mathematics', 'MATH', 3),
            ('Physics', 'PHYS', 3),
            ('English', 'ENG', 2),
        ]
        
        for name, code, credits in subject_data:
            subject = Subject.objects.create(
                school=school,
                name=name,
                code=code,
                default_credits=credits
            )
            subjects.append(subject)
            self.stdout.write(self.style.SUCCESS(f'Created subject: {name}'))
        
        # Assign subjects to teachers
        StaffSubject.objects.create(staff=teachers[0], subject=subjects[0])  # Math
        StaffSubject.objects.create(staff=teachers[1], subject=subjects[1])  # Physics
        StaffSubject.objects.create(staff=teachers[2], subject=subjects[2])  # English
        
        # Create 3 class groups
        class_groups = []
        class_names = ['10A', '10B', '11A']
        
        for i, class_name in enumerate(class_names):
            class_group = ClassGroup.objects.create(
                school=school,
                name=class_name,
                grade_level=10 if '10' in class_name else 11,
                homeroom_teacher=teachers[i % len(teachers)],
                academic_year=academic_year
            )
            class_groups.append(class_group)
            self.stdout.write(self.style.SUCCESS(f'Created class: {class_name}'))
        
        # Create 30 students
        students = []
        for i in range(30):
            student_user = User.objects.create_user(
                email=f'student{i+1}@haileybury.kz',
                password='student123',
                first_name=f'Student{i+1}',
                last_name='Demo',
                language_pref='ru',
                linked_school=school
            )
            UserRole.objects.create(user=student_user, school=school, role=Role.STUDENT)
            student = Student.objects.create(
                user=student_user,
                school=school,
                student_number=f'STU{2024}{i+1:03d}',
                class_group=class_groups[i % len(class_groups)],
                enrollment_date=date(2024, 9, 1),
                birth_date=date(2008, 1, 1) + timedelta(days=i*10),
                gender='M' if i % 2 == 0 else 'F'
            )
            students.append(student)
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(students)} students'))
        
        # Create 2 parents
        parents = []
        for i in range(2):
            parent_user = User.objects.create_user(
                email=f'parent{i+1}@haileybury.kz',
                password='parent123',
                first_name=f'Parent{i+1}',
                last_name='Demo',
                language_pref='ru',
                linked_school=school
            )
            UserRole.objects.create(user=parent_user, school=school, role=Role.PARENT)
            parents.append(parent_user)
            # Link parent to first 5 students
            for j in range(5):
                if i * 5 + j < len(students):
                    StudentParent.objects.create(
                        student=students[i * 5 + j],
                        parent=parent_user,
                        relationship='parent'
                    )
        
        self.stdout.write(self.style.SUCCESS('Created 2 parents'))
        
        # Create courses
        courses = []
        for i, subject in enumerate(subjects):
            course = Course.objects.create(
                school=school,
                name=f'{subject.name} Course',
                subject=subject,
                teacher=teachers[i],
                class_group=class_groups[0],
                academic_year=academic_year,
                is_optional=False
            )
            courses.append(course)
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(courses)} courses'))
        
        # Create schedule slots
        days_of_week = [0, 1, 2, 3, 4]  # Monday to Friday
        times = [
            ('09:00', '09:45'),
            ('10:00', '10:45'),
            ('11:00', '11:45'),
        ]
        
        for i, course in enumerate(courses):
            day = days_of_week[i % len(days_of_week)]
            start_time, end_time = times[i % len(times)]
            ScheduleSlot.objects.create(
                course=course,
                day_of_week=day,
                start_time=start_time,
                end_time=end_time,
                classroom=f'A{200+i}'
            )
        
        self.stdout.write(self.style.SUCCESS('Created schedule slots'))
        
        # Create lessons for this week
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        
        for day_offset in range(5):  # Monday to Friday
            lesson_date = week_start + timedelta(days=day_offset)
            for i, course in enumerate(courses):
                if day_offset % 3 == i % 3:  # Distribute lessons
                    Lesson.objects.create(
                        course=course,
                        date=lesson_date,
                        start_time='09:00',
                        end_time='09:45',
                        classroom=f'A{200+i}',
                        teacher=course.teacher,
                        attendance_open_flag=True
                    )
        
        self.stdout.write(self.style.SUCCESS('Created lessons for this week'))
        
        # Create attendance records
        lessons = Lesson.objects.all()[:10]  # First 10 lessons
        for lesson in lessons:
            for student in students[:20]:  # First 20 students
                status = AttendanceStatus.PRESENT if hash(f'{lesson.id}{student.id}') % 10 != 0 else AttendanceStatus.ABSENT
                Attendance.objects.create(
                    lesson=lesson,
                    student=student,
                    status=status,
                    recorded_by=teachers[0].user
                )
        
        self.stdout.write(self.style.SUCCESS('Created attendance records'))
        
        # Create grades
        for course in courses:
            for student in students[:15]:  # First 15 students
                for grade_type in [GradeType.HOMEWORK, GradeType.QUIZ]:
                    Grade.objects.create(
                        student=student,
                        course=course,
                        value=7.5 + (hash(f'{course.id}{student.id}{grade_type}') % 30) / 10,
                        scale='10-point',
                        type=grade_type,
                        comment='Good work',
                        recorded_by=course.teacher.user,
                        date=today - timedelta(days=hash(f'{course.id}{student.id}') % 30)
                    )
        
        self.stdout.write(self.style.SUCCESS('Created grades'))
        
        # Create feedback
        for teacher_staff in teachers:
            for student in students[:10]:  # First 10 students
                Feedback.objects.create(
                    from_user=teacher_staff.user,
                    to_student=student,
                    text='Keep up the good work!',
                    tags=['positive'],
                    date=today - timedelta(days=hash(f'{teacher_staff.id}{student.id}') % 7)
                )
        
        self.stdout.write(self.style.SUCCESS('Created feedback'))
        
        # Create certificate template
        template = CertificateTemplate.objects.create(
            school=school,
            name='Default Certificate',
            html_template='''
            <html>
            <body style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                <h1>Certificate of Achievement</h1>
                <p>This is to certify that</p>
                <h2>{{student_name}}</h2>
                <p>has successfully completed the course</p>
                <h3>{{title}}</h3>
                <p>Date: {{issue_date}}</p>
                <p>{{school_name}}</p>
            </body>
            </html>
            ''',
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS('Created certificate template'))
        
        # Create 3 sample certificates
        for i in range(3):
            certificate = Certificate.objects.create(
                student=students[i],
                title='Certificate of Excellence',
                issue_date=today - timedelta(days=i*10),
                language='ru',
                template_id=str(template.id),
                meta={'achievement': 'Outstanding performance'}
            )
        
        self.stdout.write(self.style.SUCCESS('Created 3 sample certificates'))
        
        self.stdout.write(self.style.SUCCESS('\nDemo data loaded successfully!'))
        self.stdout.write(self.style.SUCCESS('\nLogin credentials:'))
        self.stdout.write(self.style.SUCCESS('SuperAdmin: superadmin@haileybury.kz / admin123'))
        self.stdout.write(self.style.SUCCESS('SchoolAdmin: admin@haileybury.kz / admin123'))
        self.stdout.write(self.style.SUCCESS('Director: director@haileybury.kz / director123'))
        self.stdout.write(self.style.SUCCESS('Scheduler: scheduler@haileybury.kz / scheduler123'))
        self.stdout.write(self.style.SUCCESS('Teacher: ivanov@haileybury.kz / teacher123'))
        self.stdout.write(self.style.SUCCESS('Student: student1@haileybury.kz / student123'))
        self.stdout.write(self.style.SUCCESS('Parent: parent1@haileybury.kz / parent123'))

