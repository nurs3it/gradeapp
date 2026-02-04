# API GradeApp

## Base URL

- Локально: `http://localhost:8000/api`
- Переменная frontend: `VITE_API_BASE_URL` (по умолчанию `http://localhost:8000/api`)

## Аутентификация

Все запросы, кроме входа и регистрации, требуют JWT в заголовке:

```
Authorization: Bearer <access_token>
```

- **Логин**: POST `/api/auth/login/` — тело `{ "email": "...", "password": "..." }` → `{ "access", "refresh" }`
- **Обновление токена**: POST `/api/auth/refresh/` — тело `{ "refresh": "..." }` → `{ "access" }`
- **Регистрация**: POST `/api/auth/register/` — тело с email, password, password_confirm, first_name, last_name, role, school_id

Токены хранятся на frontend в localStorage (`access_token`, `refresh_token`). При 401 клиент пробует refresh и повторяет запрос; при неудаче — logout и редирект на /login.

## Основные эндпоинты

### Users

- GET `/api/users/me/` — текущий пользователь (после логина)
- GET `/api/users/` — список пользователей (фильтры: school_id, role)
- POST `/api/users/register/` — регистрация (см. выше)

### Schools & Cities

- GET `/api/schools/cities/` — справочник городов (для селекта при создании/редактировании школы)
- GET `/api/schools/` — список школ
- POST `/api/schools/` — создание (SuperAdmin/SchoolAdmin), тело: name, city (id), address, …
- GET `/api/schools/{id}/`, PATCH `/api/schools/{id}/` — детали и обновление школы (в ответе school: city_detail с name, name_ru)
- GET `/api/schools/academic-years/` — академические годы (query: school_id)

### Classes & Students

- GET `/api/classes/` — классы (school_id, academic_year_id)
- GET `/api/classes/classes/`, `/api/classes/students/`, `/api/classes/parents/` — через students app
- GET `/api/students/` — студенты (school_id, class_group_id)
- POST `/api/students/bulk_import/` — массовый импорт (stub)

### Staff

- GET/POST `/api/staff/` — персонал
- Предметы и связи — через тот же app (см. `backend/staff/urls.py`)

### Schedule & Lessons

- GET `/api/schedule/courses/` — курсы (school_id, teacher_id, class_group_id)
- GET `/api/schedule/slots/` — слоты (course_id)
- POST `/api/schedule/resolve-conflicts/` — проверка конфликтов
- GET `/api/lessons/` или `/api/schedule/lessons/` — уроки (date, week, course_id, teacher_id)
- POST `/api/schedule/lessons/{id}/open_attendance/`, `close_attendance/` — открыть/закрыть посещаемость

### Attendance

- GET `/api/attendance/` — записи (student_id, lesson_id, date_from, date_to)
- POST `/api/attendance/mark/` — массовая отметка: `{ "lesson_id", "records": [{ "student_id", "status", "reason" }] }`
- GET `/api/attendance/statistics/` — статистика (student_id, date_from, date_to)

### Grades & Feedback

- GET `/api/grades/` — оценки (student_id, course_id, period)
- POST `/api/grades/` — создание оценки (student_id, course_id, lesson_id, value, scale, type, comment, date)
- GET `/api/grades/statistics/`
- GET `/api/feedback/` — фидбэк (student_id)
- POST `/api/feedback/` — создание: `{ "to_student", "text", "tags", "date" }`

### Certificates

- GET `/api/certificates/` — список (student_id, school_id)
- POST `/api/certificates/generate/` — генерация: `{ "student_id", "template_id", "title", "language", "meta" }`
- GET `/api/certificates/{id}/download/` — скачивание PDF

## Ответы и ошибки

- Успех: 200, 201
- Ошибки: 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500
- Тело ошибки: `{ "detail": "..." }` или по полям: `{ "field_name": ["..."] }`

## Документация и схема

- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- OpenAPI Schema: `http://localhost:8000/api/schema/`

Полная спецификация с типами запросов/ответов — в корневом `API_SPEC.md` и в drf-spectacular (backend).
