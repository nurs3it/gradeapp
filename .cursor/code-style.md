# Стиль кода GradeApp

## Backend (Python / Django)

### Форматирование: Black

- Версия в requirements: black==24.1.1
- Применение: `cd backend && black .`
- В CI: `black --check .` (без изменений файлов)
- Настройки по умолчанию Black (длина строки 88 и т.д.)

### Линтер: Flake8

- Версия: flake8==7.0.0
- В CI проверяются только критические ошибки: **E9, F63, F7, F82**
  - E9: синтаксические ошибки / неопределённые имена
  - F63: неправильное использование assert
  - F7: синтаксическая ошибка в объявлении
  - F82: неопределённое имя
- Команда в CI: `flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics`
- Рекомендуется запускать локально перед коммитом

### Соглашения

- Имена моделей: PascalCase (User, ClassGroup, AcademicYear)
- Имена полей и переменных: snake_case
- Имена классов ViewSet/Serializer: сущность + ViewSet/Serializer
- Импорты: стандартная библиотека → сторонние → локальные; группировать и сортировать
- Docstrings: для публичных функций и классов модулей API/сервисов
- Не оставлять закомментированный код и лишние print без необходимости

## Frontend (TypeScript / React)

### Линтер: ESLint

- Конфиг: `frontend/.eslintrc.cjs`
- Расширения: eslint:recommended, @typescript-eslint/recommended, react-hooks/recommended
- Плагин: react-refresh (only-export-components — warn)
- Правило: `@typescript-eslint/no-explicit-any` — **warn** (избегать any)
- Команда: `bun run lint` (из папки frontend)
- В CI: `bun run lint` в job frontend-lint

### TypeScript

- tsconfig: **strict: true**, noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch
- Предпочтительно явные типы для аргументов и возвращаемых значений публичных функций
- Для API-ответов — интерфейсы или типы в shared или в модулях api
- Не использовать `any` без веской причины (есть warn в eslint)

### React

- Функциональные компоненты и хуки
- Имена компонентов: PascalCase; файлы компонентов: PascalCase.tsx (например Button.tsx)
- Имена хуков: camelCase, с префиксом use (useAuth, useDialog)
- Зависимости в useEffect/useCallback/useMemo указывать явно

### Импорты и алиасы

- Использовать алиас `@/` для импортов из src: `@/shared/api/client`, `@/pages/auth/LoginPage`
- Порядок: внешние пакеты → внутренние (алиасы); группировать по смыслу

### Имена

- Компоненты и типы: PascalCase
- Функции, переменные, хуки: camelCase
- Константы: UPPER_SNAKE или camelCase в зависимости от контекста
- Файлы: PascalCase для компонентов (Button.tsx), camelCase для утилит/хуков (auth.tsx, useDialog.tsx)

## CI

- **backend-lint**: Black check + Flake8 (E9, F63, F7, F82)
- **frontend-lint**: ESLint по .ts/.tsx
- Перед пушем желательно запускать те же команды локально

## Общее

- Единый стиль переносов строк (LF)
- Не коммитить закомментированный код и отладочные выводы без необходимости
- Сообщения коммитов — осмысленные, по возможности на английском или в принятой в проекте форме

При добавлении новых правил или инструментов обновляй этот файл и при необходимости .eslintrc.cjs, pytest.ini, .github/workflows/ci.yml.
