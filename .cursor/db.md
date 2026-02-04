# База данных GradeApp

## СУБД и настройки

- **PostgreSQL 15** (Docker: сервис `db`, порт 5432)
- Переменные: `DB_NAME` (gradeapp_db), `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- Django: `backend/gradeapp_backend/settings.py` — `DATABASES['default']`

## Модели и таблицы

### users (приложение users)

| Модель | Таблица | Описание |
|--------|---------|----------|
| **User** | `users` | Кастомная модель пользователя (email как USERNAME_FIELD). Поля: id (UUID), email, first_name, last_name, middle_name, phone, language_pref, profile (JSON), linked_school (FK School), is_active, is_staff, date_joined |
| **UserRole** | `user_roles` | Роль пользователя в школе: user (FK), school (FK), role (superadmin/schooladmin/director/teacher/student/parent/registrar/scheduler). unique_together (user, school, role) |
| **Notification** | `notifications` | to_user, type, payload (JSON), read_flag |
| **AuditLog** | `audit_logs` | actor (FK User), action, target, target_id, payload (JSON), timestamp |

### schools

| Модель | Таблица | Описание |
|--------|---------|----------|
| **City** | `cities` | Справочник городов: id (UUID), name (unique), name_ru |
| **School** | `schools` | id (UUID), name, city (FK City), address, grading_system (JSON), languages_supported (JSON). Тип школы убран. |
| **AcademicYear** | `academic_years` | school (FK), name (e.g. 2024-2025), start_date, end_date, is_current. unique_together (school, name) |

### students

| Модель | Таблица | Описание |
|--------|---------|----------|
| **Student** | `students` | user (OneToOne), school (FK), student_number (unique), class_group (FK, nullable), enrollment_date, graduation_date, birth_date, gender |
| **ClassGroup** | `class_groups` | school, name (10A, 11B), grade_level, homeroom_teacher (FK Staff), academic_year. unique_together (school, name, academic_year) |
| **StudentParent** | `student_parents` | student (FK), parent (FK User), relationship. unique_together (student, parent) |

### staff

| Модель | Таблица | Описание |
|--------|---------|----------|
| **Staff** | `staff` | user (OneToOne), school, position (teacher/director/admin/registrar/scheduler), employment_date, load_limit_hours |
| **Subject** | `subjects` | school, name, code, description, default_credits. unique_together (school, code) |
| **StaffSubject** | `staff_subjects` | staff (FK), subject (FK). unique_together (staff, subject) |

### schedule

| Модель | Таблица | Описание |
|--------|---------|----------|
| **Course** | `courses` | school, name, subject (FK), teacher (FK Staff), class_group (FK), academic_year (FK), is_optional, schedule_rules (JSON) |
| **ScheduleSlot** | `schedule_slots` | course (FK), day_of_week (0–6), start_time, end_time, classroom |
| **Lesson** | `lessons` | course (FK), date, start_time, end_time, classroom, teacher (FK Staff), attendance_open_flag, notes |

### journal

| Модель | Таблица | Описание |
|--------|---------|----------|
| **Grade** | `grades` | student (FK), lesson (FK, null), course (FK), value, scale, type (quiz/homework/exam/project/participation/final), comment, recorded_by (FK User), date |
| **Feedback** | `feedback` | from_user (FK), to_student (FK), text, tags (JSON), date |

### attendance

| Модель | Таблица | Описание |
|--------|---------|----------|
| **Attendance** | `attendance` | lesson (FK), student (FK), status (present/absent/tardy/excused), reason, recorded_by (FK User). unique_together (lesson, student) |

### certificates

| Модель | Таблица | Описание |
|--------|---------|----------|
| **Certificate** | `certificates` | student (FK), title, issue_date, expires, pdf_url, pdf_file (FileField), template_id, language, meta (JSON) |
| **CertificateTemplate** | `certificate_templates` | school (FK), name, html_template (HTML с плейсхолдерами), is_active |

## Связи (кратко)

- **User** — центральная сущность: OneToOne → Staff или Student; UserRole → School + Role; linked_school → School (опционально).
- **School** — корень для фильтрации: academic_years, class_groups, students, staff, subjects, courses, certificate_templates.
- **Course** связывает subject, teacher (Staff), class_group, academic_year; Lesson — экземпляр урока по дате; Grade и Attendance привязаны к Lesson/Student.

## Миграции

- Расположение: `backend/<app>/migrations/`
- Команды: `python manage.py makemigrations`, `python manage.py migrate`
- В CI: миграции применяются перед тестами (см. `.github/workflows/ci.yml`)

## Демо-данные

- Команда: `python manage.py load_demo_data`
- Создаётся школа Haileybury Almaty, академический год, пользователи (SuperAdmin, SchoolAdmin, Director, учителя, студенты, родители), классы, предметы, курсы, слоты, уроки, оценки, посещаемость, шаблон и примеры сертификатов.
- Аккаунты для входа — в корневом README и в `requirements.md` в .cursor.
