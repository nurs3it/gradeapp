# Migration: add SchoolJoinRequest model

import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('schools', '0003_school_connection_code'),
        ('users', '0003_seed_permissions'),
    ]

    operations = [
        migrations.CreateModel(
            name='SchoolJoinRequest',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('requested_role', models.CharField(choices=[('superadmin', 'SuperAdmin'), ('schooladmin', 'SchoolAdmin'), ('director', 'Director'), ('teacher', 'Teacher'), ('student', 'Student'), ('parent', 'Parent'), ('registrar', 'Registrar'), ('scheduler', 'Scheduler')], max_length=20)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], db_index=True, default='pending', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('rejection_reason', models.TextField(blank=True)),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_join_requests', to='users.user')),
                ('school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='join_requests', to='schools.school')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='school_join_requests', to='users.user')),
            ],
            options={
                'verbose_name': 'School join request',
                'verbose_name_plural': 'School join requests',
                'db_table': 'school_join_requests',
            },
        ),
        migrations.AddIndex(
            model_name='schooljoinrequest',
            index=models.Index(fields=['school', 'status'], name='school_join_school__a1b2c3_idx'),
        ),
        migrations.AddIndex(
            model_name='schooljoinrequest',
            index=models.Index(fields=['user', 'school'], name='school_join_user_id_d4e5f6_idx'),
        ),
        migrations.AddConstraint(
            model_name='schooljoinrequest',
            constraint=models.UniqueConstraint(condition=models.Q(('status', 'pending')), fields=('user', 'school'), name='unique_pending_user_school'),
        ),
    ]
