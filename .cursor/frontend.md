# Frontend GradeApp

## Стек

- **React 18**, **TypeScript**
- **Vite** — сборка и dev-сервер (порт 5173)
- **Bun** — менеджер пакетов (`bun install`, `bun run dev`)
- **Tailwind CSS** — стили, CSS-переменные для темы (см. branding.md)
- **React Router 6** — маршрутизация
- **TanStack Query (React Query)** — кэш и запросы к API
- **TanStack Table** — таблицы при необходимости
- **Axios** — HTTP-клиент (обёрнут в `shared/api/client.ts`)
- **i18next + react-i18next** — локализация (ru, kz, en), lazy-load по namespace
- **Zod** — валидация при необходимости
- **Lucide React** — иконки
- **clsx**, **tailwind-merge** — классы

## Структура `frontend/src`

```
src/
├── app/
│   ├── App.tsx              # Корень: провайдеры (Query, Auth, i18n), Router
│   ├── router.tsx           # Маршруты, ProtectedRoute, Layout
│   └── __tests__/
├── pages/
│   ├── auth/LoginPage.tsx
│   ├── dashboard/DashboardPage.tsx
│   ├── teacher/JournalPage, SchedulePage, AttendancePage
│   ├── parent/OverviewPage
│   ├── admin/SchoolsPage, SchoolSettingsPage, SchedulePage, ImportExportPage
│   └── certificates/CertificatesPage
├── widgets/
│   ├── layout/Layout.tsx
│   ├── header/Header.tsx
│   └── sidebar/Sidebar.tsx   # Навигация по ролям
├── shared/
│   ├── api/
│   │   ├── client.ts         # axios instance, interceptors (token, refresh)
│   │   ├── schools.ts, students.ts, classes.ts, courses.ts, schedule.ts,
│   │   ├── lessons.ts, grades.ts, attendance.ts, certificates.ts
│   ├── ui/
│   │   ├── Button, Card, Dialog, Input, Select, Toast
│   ├── lib/
│   │   ├── auth.tsx          # AuthProvider, useAuth
│   │   ├── i18n/             # config, hooks, I18nProvider, locales
│   │   ├── utils.ts, useDialog.tsx, ToastProvider.tsx
│   └── styles/index.css     # Tailwind, CSS vars, анимации
├── main.tsx
└── vite-env.d.ts
```

## Алиасы и импорты

- `@/` → `src/` (vite.config.ts, tsconfig.json)
- Примеры: `@/shared/api/client`, `@/pages/auth/LoginPage`, `@/shared/ui/Button`, `@/shared/lib/auth`

## Роутинг

- Файл: `app/router.tsx`
- Публичный: `/login`
- Защищённые маршруты обёрнуты в `<ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>`
- ProtectedRoute: проверка `useAuth().isAuthenticated`, при загрузке — спиннер, при неавторизованном — `<Navigate to="/login" />`
- Маршруты: `/dashboard`, `/teacher/journal`, `/teacher/schedule`, `/teacher/attendance`, `/parent/overview`, `/admin/schools`, `/admin/school-settings`, `/admin/schedule`, `/admin/import-export`, `/certificates`
- `/` → редирект на `/dashboard`

## API и авторизация

- Все запросы к API через **apiClient** из `shared/api/client.ts`
- baseURL из `import.meta.env.VITE_API_BASE_URL` или `http://localhost:8000/api`
- Request interceptor: добавляет `Authorization: Bearer <access_token>` из localStorage
- Response interceptor: при 401 пробует refresh (`/auth/refresh/`), при успехе повторяет запрос; при ошибке refresh — очистка токенов и редирект на /login
- Auth state: `AuthProvider` в App, `useAuth()` возвращает `{ isAuthenticated, user, isLoading, login, logout }`
- После логина вызывается GET `/users/me/`, результат сохраняется в state

## Локализация (i18n)

- Конфиг: `shared/lib/i18n/config.ts`
- Namespaces: common, app, auth, dashboard, teacher, parent, admin, certificates, language
- Языки: ru, kz, en. Хранение в localStorage (`i18nextLng`), fallback — en
- Хуки: `useTranslationWithNamespace(namespaces.<ns>)`, переводы из `shared/lib/i18n/locales/{lang}/{namespace}.json`
- В коде: не хардкодить строки для UI, использовать ключи перевода

## Стили и UI

- Tailwind + CSS-переменные в `shared/styles/index.css` (--background, --foreground, --primary, --radius и т.д.)
- Компоненты в `shared/ui/`: переиспользуемые, без привязки к домену
- Notion-style: скругления (--radius), анимации (fadeIn, slideUp) в index.css
- Подробнее: branding.md

## Тесты и линт

- Vitest + React Testing Library (см. vitest.config.ts)
- ESLint: `bun run lint` (в CI — frontend-lint)
- TypeScript: strict, noUnusedLocals, noUnusedParameters; избегать `any` (warn в eslint)

## Сборка и запуск

- `bun run dev` — dev-сервер
- `bun run build` — `tsc && vite build`
- Прокси в dev: `/api` → `http://localhost:8000` (vite.config.ts)

При добавлении новых страниц или API-модулей обновляй router и shared/api соответственно; для новых строк — локали в locales и namespace при необходимости.
