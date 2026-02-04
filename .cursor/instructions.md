# Инструкции для Cursor (GradeApp)

Используй этот файл как чек-лист при работе с проектом GradeApp в Cursor.

## Перед началом работы

1. **Контекст проекта**: GradeApp — монолит (backend Django + frontend React). Целевая аудитория: школы Казахстана (НИШ, КТЛ, Haileybury, ФМШ). Языки: ru, kz, en (Tolgee/i18next).
2. **Читай смежные документы**: при изменении API — `api.md` и `backend.md`; при изменении UI — `frontend.md` и `branding.md`; при изменении данных — `db.md` и `business-logic.md`.

## При изменении кода

### Backend (Django)

- Путь: `backend/`. Приложения: `users`, `schools`, `students`, `staff`, `schedule`, `journal`, `attendance`, `certificates`, `i18n_integration`.
- Модели: UUID primary key, таблицы в `db_table` (см. `db.md`). Не меняй имена полей без миграции.
- API: JWT (SimpleJWT), permission classes из `users.permissions`. Новые эндпоинты регистрируй в `gradeapp_backend/urls.py` и в соответствующем `*/urls.py`.
- Стиль: Black (форматирование), Flake8 (E9, F63, F7, F82). Запуск: `black .`, `flake8 .`.
- Тесты: `python manage.py test` или pytest. Не ломай существующие тесты.

### Frontend (React)

- Путь: `frontend/src/`. Структура: `app/`, `pages/`, `shared/` (api, ui, lib, styles), `widgets/`.
- Алиас: `@/` → `src/`. Импорты через `@/shared/...`, `@/pages/...`.
- API: только через `shared/api/client.ts` (axios). Токен в localStorage, refresh при 401.
- Роуты: `app/router.tsx`. Защищённые маршруты обёрнуты в `ProtectedRoute` + `Layout`.
- Стили: Tailwind + CSS-переменные из `shared/styles/index.css`. Компоненты в `shared/ui/`. UI/UX ориентирован на Apple HIG (iOS/iPadOS/macOS): ясность, сдержанность, глубина; скругления 12px/16px, системный шрифт, primary #007AFF; адаптив (сайдбар → drawer на мобильных), полная ширина контента без max-w контейнера. Подробнее: `branding.md`.
- Стиль: ESLint, TypeScript strict. Избегай `any` (есть warn в eslint).
- i18n: `useTranslationWithNamespace(namespaces.*)`, файлы в `shared/lib/i18n/locales/`.

### База данных

- Миграции: только через `python manage.py makemigrations` и `migrate`. Не правь миграции вручную после применения.
- Связи: User → Staff/Student (OneToOne). UserRole — связь User–School–Role. Школа — центральная сущность для фильтрации.

### Бизнес-логика

- Роли: SuperAdmin, SchoolAdmin, Director, Teacher, Student, Parent, Registrar, Scheduler. Проверка: `user.has_role(Role.*)` и permission classes в backend.
- Фильтрация по школе: у большинства списков есть `school_id` или контекст `linked_school` пользователя.
- Демо-данные: `load_demo_data` создаёт школу Haileybury Almaty и аккаунты (см. `requirements.md` или корневой README).

## Чего избегать

- Не добавляй новые глобальные зависимости без обновления `requirements.txt` (backend) или `package.json` (frontend).
- Не меняй контракт API (поля, коды ответов) без обновления `api.md` и при необходимости фронтовых типов/вызовов.
- Не хардкодь строки для UI: используй i18n (namespace + key).
- Не отключай линтеры/тесты в CI без явной причины.

## Полезные команды

- Backend: `cd backend && python manage.py runserver`, `python manage.py test`, `python manage.py load_demo_data`
- Frontend: `cd frontend && bun run dev`, `bun run build`, `bun run lint`
- Всё: `docker-compose up --build` (из корня), затем миграции и load_demo_data в контейнере backend

Если сомневаешься в формате ответа API или структуре данных — смотри `api.md` и `db.md`.
