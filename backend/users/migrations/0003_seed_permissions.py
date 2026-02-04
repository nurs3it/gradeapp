# Data migration: seed Permission and RolePermission from business-logic matrix

from django.db import migrations


def seed_permissions(apps, schema_editor):
    Permission = apps.get_model('users', 'Permission')
    RolePermission = apps.get_model('users', 'RolePermission')

    # (code, name, resource, action)
    perms_data = [
        ('schools.view_list', 'Просмотр списка школ', 'schools', 'view_list'),
        ('schools.create_edit_delete', 'Создание/редактирование/удаление школы', 'schools', 'create_edit_delete'),
        ('schools.settings', 'Настройки школы (страница директора)', 'schools', 'settings'),
        ('academic_years.crud', 'CRUD учебных годов', 'academic_years', 'crud'),
        ('staff.view_create_edit', 'Просмотр/создание/редактирование персонала', 'staff', 'view_create_edit'),
        ('students.view_list', 'Список учеников', 'students', 'view_list'),
        ('students.create_import_export', 'Создание/импорт/экспорт учеников', 'students', 'create_import_export'),
        ('schedule.admin_manage', 'Админ: построитель расписания, конфликты', 'schedule', 'admin_manage'),
        ('schedule.teacher_view', 'Учитель: просмотр своего расписания', 'schedule', 'teacher_view'),
        ('journal.grades_feedback', 'Выставление оценок, фидбэк', 'journal', 'grades_feedback'),
        ('grades.view_own', 'Просмотр своих оценок', 'grades', 'view_own'),
        ('attendance.open_close_mark', 'Открытие/закрытие урока, отметка посещаемости', 'attendance', 'open_close_mark'),
        ('attendance.view_own', 'Просмотр своей посещаемости', 'attendance', 'view_own'),
        ('attendance.view_children', 'Просмотр посещаемости детей', 'attendance', 'view_children'),
        ('certificates.templates_crud', 'Шаблоны сертификатов (CRUD)', 'certificates', 'templates_crud'),
        ('certificates.issue', 'Выдача сертификатов', 'certificates', 'issue'),
        ('certificates.view_own', 'Просмотр своих сертификатов', 'certificates', 'view_own'),
        ('users.list_edit_roles', 'Список/редактирование пользователей и ролей', 'users', 'list_edit_roles'),
        ('nav.dashboard', 'Дашборд', 'nav', 'dashboard'),
        ('nav.profile', 'Профиль (редактирование себя)', 'nav', 'profile'),
        ('nav.journal', 'Журнал (учитель)', 'nav', 'journal'),
        ('nav.schedule_teacher', 'Расписание (учитель)', 'nav', 'schedule_teacher'),
        ('nav.attendance_teacher', 'Посещаемость (учитель)', 'nav', 'attendance_teacher'),
        ('nav.schools', 'Школы (список, создание)', 'nav', 'schools'),
        ('nav.school_settings', 'Настройки школы', 'nav', 'school_settings'),
        ('nav.schedule_admin', 'Расписание (админ)', 'nav', 'schedule_admin'),
        ('nav.import_export', 'Импорт/экспорт', 'nav', 'import_export'),
        ('nav.parent_overview', 'Обзор (родитель)', 'nav', 'parent_overview'),
        ('nav.certificates', 'Сертификаты', 'nav', 'certificates'),
        ('permissions.manage', 'Управление разрешениями ролей', 'permissions', 'manage'),
        ('import_export.students', 'Импорт/экспорт студентов', 'import_export', 'students'),
    ]

    created = {}
    for code, name, resource, action in perms_data:
        perm, _ = Permission.objects.get_or_create(
            code=code,
            defaults={'name': name, 'resource': resource, 'action': action}
        )
        created[code] = perm

    # role -> list of permission codes (from business-logic table)
    role_permissions = {
        'superadmin': [
            'schools.view_list', 'schools.create_edit_delete', 'academic_years.crud', 'staff.view_create_edit',
            'students.view_list', 'students.create_import_export', 'schedule.admin_manage', 'schedule.teacher_view',
            'journal.grades_feedback', 'attendance.open_close_mark', 'certificates.templates_crud', 'certificates.issue',
            'users.list_edit_roles', 'nav.dashboard', 'nav.profile', 'nav.schools', 'nav.schedule_admin',
            'nav.import_export', 'nav.certificates', 'permissions.manage', 'import_export.students',
        ],
        'schooladmin': [
            'schools.view_list', 'schools.create_edit_delete', 'academic_years.crud', 'staff.view_create_edit',
            'students.view_list', 'students.create_import_export', 'schedule.admin_manage', 'schedule.teacher_view',
            'journal.grades_feedback', 'attendance.open_close_mark', 'certificates.templates_crud', 'certificates.issue',
            'users.list_edit_roles', 'nav.dashboard', 'nav.profile', 'nav.schools', 'nav.schedule_admin',
            'nav.import_export', 'nav.certificates', 'import_export.students',
        ],
        'director': [
            'schools.view_list', 'schools.settings', 'academic_years.crud', 'schedule.admin_manage', 'schedule.teacher_view',
            'journal.grades_feedback', 'attendance.open_close_mark', 'certificates.issue',
            'nav.dashboard', 'nav.profile', 'nav.school_settings', 'nav.schedule_admin', 'nav.import_export',
            'nav.certificates', 'import_export.students',
        ],
        'teacher': [
            'schedule.teacher_view', 'journal.grades_feedback', 'attendance.open_close_mark', 'certificates.issue',
            'nav.dashboard', 'nav.profile', 'nav.journal', 'nav.schedule_teacher', 'nav.attendance_teacher', 'nav.certificates',
        ],
        'student': [
            'grades.view_own', 'attendance.view_own', 'certificates.view_own',
            'nav.dashboard', 'nav.profile',
        ],
        'parent': [
            'attendance.view_children', 'certificates.view_own',
            'nav.dashboard', 'nav.profile', 'nav.parent_overview',
        ],
        'registrar': [
            'schedule.admin_manage',
            'nav.dashboard', 'nav.profile', 'nav.schedule_admin',
        ],
        'scheduler': [
            'schedule.admin_manage',
            'nav.dashboard', 'nav.profile', 'nav.schedule_admin',
        ],
    }

    for role, codes in role_permissions.items():
        for code in codes:
            perm = created.get(code)
            if perm:
                RolePermission.objects.get_or_create(role=role, permission=perm)


def reverse_seed(apps, schema_editor):
    RolePermission = apps.get_model('users', 'RolePermission')
    Permission = apps.get_model('users', 'Permission')
    RolePermission.objects.all().delete()
    Permission.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_permission_role_permission_models'),
    ]

    operations = [
        migrations.RunPython(seed_permissions, reverse_seed),
    ]
