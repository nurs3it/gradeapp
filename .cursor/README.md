# GradeApp — документация для Cursor

Эта папка содержит контекстную документацию проекта **GradeApp** (SaaS-платформа для управления школами в Казахстане). Документы предназначены для того, чтобы Cursor и другие AI-инструменты имели полный контекст проекта и не пропускали важные детали.

## Назначение

- **Контекст для AI**: при работе с кодом Cursor может опираться на архитектуру, API, БД, стиль кода и бизнес-логику.
- **Единый источник правды**: описание стека, соглашений и требований в одном месте.
- **Онбординг**: быстрый вход в проект для новых разработчиков и для AI.

## Содержимое папки

| Файл | Описание |
|------|----------|
| [instructions.md](./instructions.md) | **Начни отсюда.** Инструкции для Cursor: как использовать контекст, что учитывать при правках. |
| [architecture.md](./architecture.md) | Общая архитектура: монолит, backend/frontend, потоки данных, безопасность. |
| [api.md](./api.md) | REST API: base URL, аутентификация, эндпоинты, коды ответов. |
| [db.md](./db.md) | База данных: модели, связи, таблицы, миграции, индексы. |
| [frontend.md](./frontend.md) | Frontend: React, Vite, структура, роутинг, API-клиент, UI. |
| [backend.md](./backend.md) | Backend: Django, приложения, настройки, тесты. |
| [code-style.md](./code-style.md) | Стиль кода: Black, Flake8 (backend), ESLint (frontend), TypeScript. |
| [business-logic.md](./business-logic.md) | Бизнес-логика: роли, права, сценарии, правила. |
| [branding.md](./branding.md) | Брендинг и UI: Apple HIG–style (iOS/iPadOS/macOS), цвета, компоненты. |
| [ui-apple-hig.md](./ui-apple-hig.md) | Шпаргалка по Apple HIG для UI/UX в проекте. |
| [requirements.md](./requirements.md) | Требования: окружение, зависимости, env, запуск, CI. |

## Как использовать

1. **Перед правками**: при необходимости открой `instructions.md` и релевантные разделы (api, db, frontend, backend, business-logic).
2. **Новые фичи**: сверяйся с `architecture.md`, `api.md`, `business-logic.md`.
3. **Рефакторинг**: учитывай `code-style.md`, `frontend.md`, `backend.md`.
4. **UI/стили**: используй `branding.md`, `ui-apple-hig.md` и `frontend.md`.

Корневая документация проекта: `README.md`, `ARCHITECTURE.md`, `API_SPEC.md` в корне репозитория.
