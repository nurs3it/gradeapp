# Data migration: add Permission classes.crud and assign to superadmin, schooladmin, director

from django.db import migrations


def add_classes_permission(apps, schema_editor):
    Permission = apps.get_model('users', 'Permission')
    RolePermission = apps.get_model('users', 'RolePermission')

    perm, _ = Permission.objects.get_or_create(
        code='classes.crud',
        defaults={
            'name': 'CRUD классов в школе',
            'resource': 'classes',
            'action': 'crud',
        },
    )

    for role in ('superadmin', 'schooladmin', 'director'):
        RolePermission.objects.get_or_create(role=role, permission=perm)


def reverse_add_classes_permission(apps, schema_editor):
    Permission = apps.get_model('users', 'Permission')
    RolePermission = apps.get_model('users', 'RolePermission')
    perm = Permission.objects.filter(code='classes.crud').first()
    if perm:
        RolePermission.objects.filter(permission=perm).delete()
        perm.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_school_join_request'),
    ]

    operations = [
        migrations.RunPython(add_classes_permission, reverse_add_classes_permission),
    ]
