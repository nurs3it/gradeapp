# Migration: add School.connection_code and fill existing schools

import secrets
import string
from django.db import migrations, models


def generate_code():
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(6))


def fill_connection_codes(apps, schema_editor):
    School = apps.get_model('schools', 'School')
    used = set()
    for school in School.objects.all():
        for _ in range(20):
            code = generate_code()
            if code not in used and not School.objects.filter(connection_code=code).exists():
                school.connection_code = code
                school.save(update_fields=['connection_code'])
                used.add(code)
                break
        else:
            raise ValueError(f"Could not generate unique connection_code for school {school.id}")


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('schools', '0002_city_and_school_city_fk'),
    ]

    operations = [
        migrations.AddField(
            model_name='school',
            name='connection_code',
            field=models.CharField(
                blank=True,
                db_index=True,
                editable=False,
                help_text='6-значный код для подключения к школе (генерируется автоматически)',
                max_length=6,
                null=True,
                unique=True,
            ),
        ),
        migrations.RunPython(fill_connection_codes, noop_reverse),
        migrations.AlterField(
            model_name='school',
            name='connection_code',
            field=models.CharField(
                blank=True,
                db_index=True,
                editable=False,
                help_text='6-значный код для подключения к школе (генерируется автоматически)',
                max_length=6,
                unique=True,
            ),
        ),
    ]
