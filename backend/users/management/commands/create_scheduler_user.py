"""
Management command to create Scheduler (Составитель расписания) account.
Use when demo data is already loaded and you need to add the Scheduler user.
"""
from django.core.management.base import BaseCommand
from datetime import date
from users.models import User, UserRole, Role
from schools.models import School
from staff.models import Staff, Position


class Command(BaseCommand):
    help = 'Create Scheduler (Составитель расписания) account for the first school'

    def handle(self, *args, **options):
        school = School.objects.first()
        if not school:
            self.stdout.write(self.style.ERROR('No school found. Run load_demo_data first.'))
            return

        user, created = User.objects.get_or_create(
            email='scheduler@haileybury.kz',
            defaults={
                'first_name': 'Schedule',
                'last_name': 'Manager',
                'language_pref': 'ru',
                'linked_school': school,
            }
        )
        if created:
            user.set_password('scheduler123')
            user.save()
            self.stdout.write(self.style.SUCCESS('Created user scheduler@haileybury.kz'))
        else:
            self.stdout.write('User scheduler@haileybury.kz already exists.')

        _, role_created = UserRole.objects.get_or_create(
            user=user,
            school=school,
            role=Role.SCHEDULER,
        )
        if role_created:
            self.stdout.write(self.style.SUCCESS('Assigned role Scheduler to user.'))

        _, staff_created = Staff.objects.get_or_create(
            user=user,
            school=school,
            defaults={
                'position': Position.SCHEDULER,
                'employment_date': date(2023, 9, 1),
            }
        )
        if staff_created:
            self.stdout.write(self.style.SUCCESS('Created staff profile (Scheduler).'))

        self.stdout.write(self.style.SUCCESS('\nScheduler login: scheduler@haileybury.kz / scheduler123'))
