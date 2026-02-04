"""
Management command to create a SuperAdmin user in the database.
Creates user with is_staff=True, is_superuser=True and UserRole(SUPERADMIN) for the first school (if any).
"""
from django.core.management.base import BaseCommand
from users.models import User, UserRole, Role
from schools.models import School


class Command(BaseCommand):
    help = 'Create a SuperAdmin user (is_staff, is_superuser + role SuperAdmin for first school)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='SuperAdmin email (required if not using --noinput)',
        )
        parser.add_argument(
            '--password',
            type=str,
            help='SuperAdmin password (prompted if not set)',
        )
        parser.add_argument(
            '--noinput',
            action='store_true',
            help='Do not prompt for email/password; requires --email and --password',
        )

    def handle(self, *args, **options):
        noinput = options['noinput']
        email = options.get('email') or (None if noinput else input('Email: ').strip())
        password = options.get('password') or (None if noinput else None)

        if not email:
            self.stdout.write(self.style.ERROR('Email is required. Use --email or enter when prompted.'))
            return

        if password is None and not noinput:
            import getpass
            password = getpass.getpass('Password: ')
            password2 = getpass.getpass('Password (again): ')
            if password != password2:
                self.stdout.write(self.style.ERROR('Passwords do not match.'))
                return
        if not password and noinput:
            self.stdout.write(self.style.ERROR('Password is required when using --noinput. Use --password.'))
            return

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': 'Super',
                'last_name': 'Admin',
                'language_pref': 'ru',
            },
        )
        if created:
            user.set_password(password)
            user.is_staff = True
            user.is_superuser = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created superuser: {email}'))
        else:
            user.is_staff = True
            user.is_superuser = True
            user.save(update_fields=['is_staff', 'is_superuser'])
            if password:
                user.set_password(password)
                user.save(update_fields=['password'])
            self.stdout.write(self.style.WARNING(f'User {email} already exists; updated to superuser.'))

        school = School.objects.first()
        if school:
            _, role_created = UserRole.objects.get_or_create(
                user=user,
                school=school,
                defaults={'role': Role.SUPERADMIN},
            )
            if role_created:
                self.stdout.write(self.style.SUCCESS(f'Assigned role SuperAdmin for school: {school.name}'))
            if not user.linked_school_id:
                user.linked_school = school
                user.save(update_fields=['linked_school'])
                self.stdout.write(self.style.SUCCESS(f'Set linked_school to {school.name}'))
        else:
            self.stdout.write(self.style.WARNING('No school in DB. User has full rights; add a school to assign SuperAdmin role.'))

        self.stdout.write(self.style.SUCCESS(f'\nSuperAdmin login: {email}'))
