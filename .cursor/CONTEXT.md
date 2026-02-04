# Контекст проекта GradeApp (краткая справка)

Используй этот файл как быструю подсказку при работе в Cursor. Подробности — в соответствующих .md в этой папке.

## Что это за проект

- **GradeApp** — SaaS-платформа для управления школами в Казахстане (НИШ, КТЛ, Haileybury, ФМШ).
- **Монолит**: backend Django + DRF (Python 3.11), frontend React + TypeScript (Vite, Bun).
- **БД**: PostgreSQL. **Кэш**: Redis. **i18n**: Tolgee (backend), i18next (frontend). Языки: ru, kz, en.

## Структура репозитория

- `backend/` — Django приложения: users, schools, students, staff, schedule, journal, attendance, certificates, i18n_integration.
- `frontend/src/` — app (роутер), pages (auth, dashboard, teacher, parent, admin, certificates), widgets (Layout, Header, Sidebar), shared (api, ui, lib, styles).
- `.cursor/` — документация для Cursor (architecture, api, db, frontend, backend, code-style, business-logic, branding, requirements, instructions).

## Ключевые пути и файлы

| Назначение | Путь |
|------------|------|
| Backend URL-маршруты | `backend/gradeapp_backend/urls.py` |
| Backend настройки | `backend/gradeapp_backend/settings.py` |
| Роли и права | `backend/users/permissions.py`, `backend/users/models.py` (Role, UserRole) |
| Frontend роутинг | `frontend/src/app/router.tsx` |
| API-клиент и auth | `frontend/src/shared/api/client.ts`, `frontend/src/shared/lib/auth.tsx` |
| Стили и тема | `frontend/src/shared/styles/index.css`, `frontend/tailwind.config.js` |
| Демо-данные | `backend/users/management/commands/load_demo_data.py` |

## API

- Base: `http://localhost:8000/api`. Auth: JWT в заголовке `Authorization: Bearer <access>`.
- Логин: POST `/api/auth/login/`. Текущий пользователь: GET `/api/users/me/`.
- Основные префиксы: `/api/schools/`, `/api/classes/`, `/api/students/`, `/api/staff/`, `/api/schedule/`, `/api/lessons/`, `/api/grades/`, `/api/feedback/`, `/api/attendance/`, `/api/certificates/`.
- Документация: http://localhost:8000/api/docs/

## Роли

SuperAdmin, SchoolAdmin, Director, Teacher, Student, Parent, Registrar, Scheduler. Роль привязана к школе (UserRole). Проверка на backend: permission classes в `users.permissions`; на frontend — навигация по ролям в Sidebar.

## Стиль кода

- Backend: Black (форматирование), Flake8 (E9, F63, F7, F82). Команды: `black .`, `flake8 .`
- Frontend: ESLint, TypeScript strict. Команда: `bun run lint`. Избегать `any`.

## Запуск

- Docker: `docker-compose up --build`, затем `docker-compose exec backend python manage.py migrate` и `load_demo_data`.
- Локально: backend — `cd backend && python manage.py runserver`; frontend — `cd frontend && bun run dev`.
- Демо-логин: superadmin@haileybury.kz / admin123.

## При правках

1. Backend: не менять имена полей моделей без миграций; новые эндпоинты — в urls приложения и в gradeapp_backend/urls.py; использовать permission classes.
2. Frontend: API только через shared/api/client; строки для UI — через i18n; алиас `@/` для импортов.
3. Общее: не хардкодить секреты и URL продакшена; обновлять документацию в .cursor при изменении API/моделей/ролей.

Полная документация: см. README.md в .cursor и остальные .md в этой папке.
