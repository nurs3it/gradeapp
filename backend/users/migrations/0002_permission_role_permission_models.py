# Generated manually for Permission and RolePermission models

import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Permission',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('code', models.CharField(db_index=True, max_length=80, unique=True)),
                ('name', models.CharField(max_length=150)),
                ('description', models.TextField(blank=True)),
                ('resource', models.CharField(blank=True, db_index=True, max_length=50)),
                ('action', models.CharField(blank=True, max_length=50)),
            ],
            options={
                'verbose_name': 'Permission',
                'verbose_name_plural': 'Permissions',
                'db_table': 'permissions',
                'ordering': ['resource', 'action', 'code'],
            },
        ),
        migrations.CreateModel(
            name='RolePermission',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('role', models.CharField(choices=[('superadmin', 'SuperAdmin'), ('schooladmin', 'SchoolAdmin'), ('director', 'Director'), ('teacher', 'Teacher'), ('student', 'Student'), ('parent', 'Parent'), ('registrar', 'Registrar'), ('scheduler', 'Scheduler')], db_index=True, max_length=20)),
                ('permission', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='role_permissions', to='users.permission')),
            ],
            options={
                'verbose_name': 'Role permission',
                'verbose_name_plural': 'Role permissions',
                'db_table': 'role_permissions',
                'unique_together': {('role', 'permission')},
            },
        ),
        migrations.AddIndex(
            model_name='rolepermission',
            index=models.Index(fields=['role'], name='role_permiss_role_9a1f0d_idx'),
        ),
    ]
