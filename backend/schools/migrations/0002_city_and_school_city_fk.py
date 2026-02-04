# Generated manually for City reference and School.city FK

import uuid
import django.db.models.deletion
from django.db import migrations, models


def create_cities_and_assign(apps, schema_editor):
    School = apps.get_model('schools', 'School')
    City = apps.get_model('schools', 'City')
    for school in School.objects.all():
        city_name = (getattr(school, 'city_old', None) or 'Other').strip() or 'Other'
        city, _ = City.objects.get_or_create(
            name=city_name,
            defaults={'name_ru': city_name},
        )
        school.city_fk_id = city.id
        school.save(update_fields=['city_fk_id'])


def noop_reverse(apps, schema_editor):
    pass


def seed_default_cities(apps, schema_editor):
    City = apps.get_model('schools', 'City')
    if City.objects.exists():
        return
    defaults = [
        ('Almaty', 'Алматы'),
        ('Astana', 'Астана'),
        ('Shymkent', 'Шымкент'),
        ('Karaganda', 'Караганда'),
        ('Aktobe', 'Актобе'),
        ('Taraz', 'Тараз'),
        ('Pavlodar', 'Павлодар'),
        ('Other', 'Другое'),
    ]
    for name, name_ru in defaults:
        City.objects.get_or_create(name=name, defaults={'name_ru': name_ru})


class Migration(migrations.Migration):

    dependencies = [
        ('schools', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='City',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=150, unique=True)),
                ('name_ru', models.CharField(blank=True, max_length=150)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'cities',
                'ordering': ['name'],
                'verbose_name': 'City',
                'verbose_name_plural': 'Cities',
            },
        ),
        migrations.AddField(
            model_name='school',
            name='city_fk',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='schools', to='schools.city'),
        ),
        migrations.RenameField(
            model_name='school',
            old_name='city',
            new_name='city_old',
        ),
        migrations.RunPython(create_cities_and_assign, noop_reverse),
        migrations.RunPython(seed_default_cities, noop_reverse),
        migrations.RemoveField(model_name='school', name='city_old'),
        migrations.RemoveField(model_name='school', name='type'),
        migrations.RenameField(model_name='school', old_name='city_fk', new_name='city'),
        migrations.AddIndex(
            model_name='school',
            index=models.Index(fields=['city'], name='schools_city_id_idx'),
        ),
    ]
