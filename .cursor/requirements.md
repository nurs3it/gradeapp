# Требования и окружение GradeApp

## Окружение и зависимости

### Backend

- **Python**: 3.11+
- **Зависимости**: `backend/requirements.txt`
  - Django==5.0.1, djangorestframework, djangorestframework-simplejwt, django-cors-headers, psycopg2-binary, python-dotenv, drf-spectacular, weasyprint, Pillow, django-extensions, django-redis, pytest, pytest-django, pytest-cov, black, flake8, requests
- **БД**: PostgreSQL 15 (локально или Docker)
- **Кэш**: Redis (для Tolgee и Django cache)
- **Переменные**: см. .env.example и раздел «Переменные окружения» ниже

### Frontend

- **Node**: для Bun совместимая версия (рекомендуется LTS)
- **Менеджер пакетов**: Bun (`bun install`, `bun run dev`)
- **Зависимости**: `frontend/package.json` (React 18, TypeScript, Vite, Tailwind, TanStack Query, React Router, axios, i18next, lucide-react, zod и др.)
- **Переменные**: VITE_API_BASE_URL, при необходимости VITE_TOLGEE_* (см. .env.example)

### Инфраструктура

- **Docker & Docker Compose** — для запуска всех сервисов (db, redis, backend, frontend)
- **Git** — репозиторий

## Переменные окружения

Копировать из `.env.example` в `.env` в корне проекта.

### Backend / общие

- **SECRET_KEY** — секрет Django (обязательно сменить в production)
- **DEBUG** — True/False
- **ALLOWED_HOSTS** — через запятую (localhost, 127.0.0.1 и т.д.)
- **DB_NAME**, **DB_USER**, **DB_PASSWORD**, **DB_HOST**, **DB_PORT** — подключение к PostgreSQL
- **REDIS_URL** — redis://redis:6379/0 (в Docker) или redis://localhost:6379/0
- **TOLGEE_API_URL**, **TOLGEE_API_KEY** — для Tolgee (i18n); можно оставить пустым для локальной разработки
- **CORS_ALLOWED_ORIGINS** — http://localhost:5173,http://localhost:3000

### Frontend (Vite)

- **VITE_API_BASE_URL** — http://localhost:8000/api
- **VITE_TOLGEE_API_URL**, **VITE_TOLGEE_API_KEY** — при использовании Tolgee на frontend

## Установка и запуск

### Через Docker Compose (рекомендуется)

1. Клонировать репозиторий, перейти в корень проекта
2. `cp .env.example .env` и при необходимости отредактировать .env
3. `docker-compose up --build`
4. В другом терминале: миграции и демо-данные  
   `docker-compose exec backend python manage.py migrate`  
   `docker-compose exec backend python manage.py load_demo_data`
5. Frontend: http://localhost:5173  
   Backend API: http://localhost:8000  
   API Docs: http://localhost:8000/api/docs/

### Локально (без Docker)

1. Установить PostgreSQL и Redis, создать БД gradeapp_db
2. Backend:  
   `cd backend`  
   `pip install -r requirements.txt`  
   Настроить .env (DB_HOST=localhost и т.д.)  
   `python manage.py migrate`  
   `python manage.py load_demo_data`  
   `python manage.py runserver`
3. Frontend:  
   `cd frontend`  
   `bun install`  
   Убедиться, что VITE_API_BASE_URL указывает на backend (http://localhost:8000/api)  
   `bun run dev`
4. Открыть http://localhost:5173

## Демо-аккаунты (после load_demo_data)

| Роль        | Email                     | Пароль     |
|-------------|---------------------------|------------|
| SuperAdmin  | superadmin@haileybury.kz  | admin123   |
| SchoolAdmin | admin@haileybury.kz       | admin123   |
| Director    | director@haileybury.kz    | director123|
| Teacher     | ivanov@haileybury.kz      | teacher123 |
| Student     | student1@haileybury.kz    | student123 |
| Parent      | parent1@haileybury.kz     | parent123  |

Также создаются: petrova@haileybury.kz, nurmagambetov@haileybury.kz (учителя), student2…30, parent2.

## CI (GitHub Actions)

- **backend-lint**: Black check + Flake8 (E9, F63, F7, F82)
- **backend-test**: PostgreSQL сервис, migrate, `python manage.py test`
- **frontend-lint**: `bun run lint`
- **frontend-build**: `bun run build`

Ветки: main, develop (см. .github/workflows/ci.yml).

## Production

- DEBUG=False, надёжный SECRET_KEY, ALLOWED_HOSTS с реальными доменами
- БД и Redis — production-ready настройки, бэкапы
- Backend: Gunicorn + Nginx (или аналог), статика и media
- Frontend: собранный build (vite build) раздаётся через Nginx/CDN
- SSL/TLS для HTTPS
- Переменные окружения и секреты не коммитить в репозиторий

Подробнее: корневой README.md, ARCHITECTURE.md, docker-compose.yml.
