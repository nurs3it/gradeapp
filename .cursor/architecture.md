# Архитектура GradeApp

## Обзор

GradeApp — **монолитный репозиторий (monorepo)** с разделением на frontend и backend. Целевая аудитория: школы Казахстана (НИШ, КТЛ, Haileybury, ФМШ и др.). Платформа SaaS для управления школами: пользователи, школы, классы, расписание, журнал, посещаемость, сертификаты.

## Высокоуровневая схема

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React SPA)                      │
│  Vite, TypeScript, Tailwind, TanStack Query, React Router, i18next │
│  Port: 5173                                                        │
└───────────────────────────────┬─────────────────────────────────┘
                                 │ HTTP /api, JWT Bearer
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Django + DRF)                         │
│  Django 5, DRF, SimpleJWT, drf-spectacular, WeasyPrint            │
│  Port: 8000                                                        │
└───────────────────────────────┬─────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │    │ Tolgee (i18n)   │
│   Port: 5432    │    │   Port: 6379    │    │ (optional)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Backend (Django)

### Структура приложений

| Приложение | Назначение |
|------------|------------|
| **users** | Пользователи (Custom User), роли (UserRole), аутентификация (JWT), уведомления, аудит |
| **schools** | Школы (School), академические годы (AcademicYear), типы школ |
| **students** | Студенты (Student), классы (ClassGroup), связь студент–родитель (StudentParent) |
| **staff** | Персонал (Staff), предметы (Subject), должности, StaffSubject |
| **schedule** | Курсы (Course), слоты расписания (ScheduleSlot), уроки (Lesson) |
| **journal** | Оценки (Grade), фидбэк (Feedback), типы оценок |
| **attendance** | Посещаемость (Attendance), статусы (present/absent/tardy/excused) |
| **certificates** | Сертификаты (Certificate), шаблоны (CertificateTemplate), генерация PDF (WeasyPrint) |
| **i18n_integration** | Интеграция с Tolgee: middleware, сервис переводов, кэш Redis |

### Ключевые решения

- **Аутентификация**: JWT (access + refresh), SimpleJWT, ротация refresh, blacklist.
- **Авторизация**: RBAC через permission classes (`users.permissions`: IsSuperAdmin, IsSchoolAdmin, IsTeacher и т.д.). Роль привязана к школе (UserRole).
- **API**: REST, пагинация 20 элементов, OpenAPI (drf-spectacular), CORS для frontend.
- **БД**: PostgreSQL, UUID primary key для основных сущностей, индексы по полям фильтрации.
- **Кэш**: Redis для Tolgee и кэша Django.

### URL-префиксы API

- `/api/auth/` — login, refresh, register
- `/api/users/` — пользователи, me, roles
- `/api/schools/` — школы, academic-years
- `/api/classes/` — классы, студенты, родители (students app)
- `/api/students/` — студенты (students app)
- `/api/staff/` — персонал, предметы
- `/api/schedule/`, `/api/lessons/` — курсы, слоты, уроки
- `/api/journal/`, `/api/grades/`, `/api/feedback/` — журнал, оценки, фидбэк
- `/api/attendance/` — посещаемость
- `/api/certificates/` — сертификаты

## Frontend (React)

### Структура (упрощённая FSD)

- **app/** — инициализация, роутер (`App.tsx`, `router.tsx`)
- **pages/** — страницы по ролям: auth, dashboard, teacher, parent, admin, certificates
- **widgets/** — Layout, Header, Sidebar
- **shared/** — api (client + модули по доменам), ui (Button, Card, Dialog, Input, Select, Toast), lib (auth, i18n, utils), styles

### State и данные

- **Server state**: TanStack Query (React Query), запросы через `apiClient` из `shared/api/client.ts`
- **Auth**: React Context (`AuthProvider`, `useAuth`) + localStorage (access_token, refresh_token)
- **UI state**: локальный (useState, useReducer)

### Роутинг

- Публичный: `/login`
- Защищённые: все остальные через `ProtectedRoute` + `Layout` (sidebar по ролям)
- Редирект `/` → `/dashboard`

### Сборка и dev

- Vite, порт 5173, proxy `/api` → backend:8000
- Алиас `@/` → `src/`
- TypeScript strict, ESLint

## Потоки данных

### Вход (Login)

1. Пользователь вводит email/password → POST `/api/auth/login/`
2. Backend возвращает `access`, `refresh`
3. Frontend сохраняет в localStorage, запрашивает GET `/users/me/`, кладёт user в AuthContext
4. Далее все запросы: заголовок `Authorization: Bearer <access>`
5. При 401: refresh через POST `/api/auth/refresh/`, повтор запроса; при ошибке refresh — logout и редирект на /login

### Генерация сертификата

1. Frontend: POST `/api/certificates/generate/` (student_id, template_id, title, language, meta)
2. Backend: загрузка шаблона, подстановка данных студента, при необходимости Tolgee для перевода, WeasyPrint → PDF
3. Файл в `media/certificates/`, в модели записывается `pdf_file`, `pdf_url`
4. Frontend: скачивание по ссылке или GET download endpoint

## Безопасность

- JWT с ограниченным временем жизни access token
- RBAC на backend (permission classes)
- CORS: разрешены только указанные origins
- Валидация паролей (Django validators)
- AuditLog для критических действий
- React: данные от API не вставляются как raw HTML (XSS)

## Развёртывание

- **Development**: Docker Compose (db, redis, backend, frontend) или локально backend + frontend
- **Production**: Gunicorn + Nginx (backend), статика frontend, PostgreSQL, Redis, SSL

Подробнее: корневой `ARCHITECTURE.md`, `docker-compose.yml`, `backend/gradeapp_backend/settings.py`.
