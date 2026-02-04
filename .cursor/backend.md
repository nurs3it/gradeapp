# Backend GradeApp

## Стек

- **Python 3.11+**
- **Django 5.0**
- **Django REST Framework** — API
- **djangorestframework-simplejwt** — JWT (access + refresh, blacklist после ротации)
- **PostgreSQL** — БД (psycopg2-binary)
- **drf-spectacular** — OpenAPI schema, Swagger/ReDoc
- **django-cors-headers** — CORS
- **python-dotenv** — переменные окружения
- **WeasyPrint** — генерация PDF сертификатов
- **django-redis** — кэш (Tolgee, общий кэш)
- **requests** — вызовы Tolgee API
- **pytest, pytest-django, pytest-cov** — тесты
- **black, flake8** — форматирование и линт (см. code-style.md)

## Структура `backend/`

```
backend/
├── gradeapp_backend/        # Проект Django
│   ├── settings.py
│   ├── urls.py              # Подключение api/schema, api/docs, api/* приложений
│   ├── wsgi.py, asgi.py
├── users/                   # Пользователи, роли, auth
│   ├── models.py            # User, UserRole, Notification, AuditLog
│   ├── permissions.py       # IsSuperAdmin, IsSchoolAdmin, IsTeacher, ...
│   ├── views.py, serializers.py, urls.py, admin.py
│   └── management/commands/load_demo_data.py
├── schools/
├── students/
├── staff/
├── schedule/
├── journal/
├── attendance/
├── certificates/            # + services.py (WeasyPrint)
├── i18n_integration/         # Tolgee middleware, services
├── manage.py
├── requirements.txt
├── pytest.ini
└── Dockerfile
```

## Настройки (settings.py)

- **AUTH_USER_MODEL**: `'users.User'`
- **REST_FRAMEWORK**: JWT auth, IsAuthenticated по умолчанию, PageNumberPagination 20, drf-spectacular schema
- **SIMPLE_JWT**: access 1h, refresh 7d, ROTATE_REFRESH_TOKENS, BLACKLIST_AFTER_ROTATION
- **CORS_ALLOWED_ORIGINS**: из env (localhost:5173, 3000)
- **DATABASES**: PostgreSQL из env (DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT)
- **CACHES**: Redis из REDIS_URL
- **TOLGEE_API_URL**, **TOLGEE_API_KEY** — для i18n_integration
- **LANGUAGE_CODE**: ru-ru, **TIME_ZONE**: Asia/Almaty

## URL-маршруты (gradeapp_backend/urls.py)

- `admin/` — Django admin
- `api/schema/`, `api/docs/`, `api/redoc/` — OpenAPI
- `api/auth/` — users.urls (login, refresh, register, me, users CRUD, roles)
- `api/schools/` — schools
- `api/users/` — users (тот же users.urls)
- `api/staff/` — staff
- `api/classes/` — students (classes, students, parents)
- `api/students/` — students
- `api/schedule/`, `api/lessons/` — schedule
- `api/journal/`, `api/grades/`, `api/feedback/` — journal
- `api/attendance/` — attendance
- `api/certificates/` — certificates

## Permission classes (users.permissions)

- **IsSuperAdmin** — только SuperAdmin
- **IsSchoolAdmin** — SchoolAdmin или Director или SuperAdmin
- **IsTeacher** — Teacher или SchoolAdmin/Director/SuperAdmin
- **IsStudent** — Student
- **IsParent** — Parent
- **IsTeacherOrStudent** — Teacher/Student или админские роли
- **IsSuperAdminOrSchoolAdmin** — SuperAdmin или SchoolAdmin или Director

Роль проверяется через `request.user.has_role(Role.*)` (UserRole по текущей школе).

## Модели и миграции

- Основные сущности с UUID primary key, таблицы заданы в Meta.db_table (см. db.md)
- Миграции: `makemigrations`, `migrate`; не редактировать применённые миграции вручную

## Демо-данные

- `python manage.py load_demo_data` — создаёт школу Haileybury Almaty, пользователей всех ролей, классы, предметы, курсы, уроки, оценки, посещаемость, шаблон и примеры сертификатов
- Учётные записи — в README и requirements.md в .cursor

## Тесты и линт

- Тесты: `python manage.py test` или pytest (pytest.ini в backend)
- Black: `black .` (проверка в CI: black --check .)
- Flake8: только критические коды E9, F63, F7, F82 (см. code-style.md и ci.yml)

## Запуск

- Локально: `python manage.py runserver` (нужна БД и миграции)
- Docker: сервис `backend` в docker-compose, команда `python manage.py runserver 0.0.0.0:8000`

При добавлении новых эндпоинтов регистрируй их в urls приложения и при необходимости в gradeapp_backend/urls.py; для новых моделей — миграции и при необходимости обновление db.md.
