# Архитектура GradeApp

## Обзор

GradeApp построен как монолитный репозиторий (monorepo) с разделением на frontend и backend части. Архитектура следует принципам модульности, масштабируемости и поддерживаемости.

## Архитектурные решения

### Backend (Django + DRF)

#### Структура приложений

Backend организован в виде Django приложений, каждое из которых отвечает за определенную доменную область:

- **users** - Управление пользователями, ролями, аутентификация
- **schools** - Школы, академические годы, настройки
- **students** - Студенты, классы, связь с родителями
- **staff** - Персонал, предметы, назначения
- **schedule** - Расписание, курсы, уроки
- **journal** - Журнал, оценки, фидбэк
- **attendance** - Посещаемость
- **certificates** - Генерация PDF сертификатов
- **i18n_integration** - Интеграция с Tolgee для локализации

#### Модели данных

Основные сущности:

```
User (Custom User Model)
├── UserRole (M2M через промежуточную модель)
├── Staff (OneToOne)
├── Student (OneToOne)
└── Notification

School
├── AcademicYear
├── Subject
├── ClassGroup
└── CertificateTemplate

Course
├── ScheduleSlot
└── Lesson
    ├── Attendance
    └── Grade

Student
├── StudentParent (M2M)
├── Grade
├── Feedback
└── Certificate
```

#### API Архитектура

- RESTful API через Django REST Framework
- JWT аутентификация (access + refresh tokens)
- RBAC через permission classes
- Пагинация по умолчанию (20 элементов на страницу)
- OpenAPI schema через drf-spectacular

#### Безопасность

- JWT токены с ротацией refresh токенов
- RBAC на уровне permission classes
- CORS настройки для frontend
- Audit logging для критических действий
- Валидация паролей через Django validators

### Frontend (React + TypeScript)

#### Архитектура FSD (Feature-Sliced Design)

```
src/
├── app/          # Инициализация приложения
│   ├── App.tsx   # Корневой компонент
│   └── router.tsx # Роутинг
├── pages/        # Страницы приложения
│   ├── auth/
│   ├── dashboard/
│   ├── teacher/
│   ├── parent/
│   ├── admin/
│   └── certificates/
├── entities/     # Бизнес-сущности
│   ├── user/
│   ├── student/
│   ├── class/
│   ├── schedule/
│   └── grade/
├── features/     # Функциональные фичи
│   ├── scheduleBuilder/
│   ├── journalEditor/
│   ├── attendanceMarking/
│   └── certificateGenerator/
├── widgets/      # Сложные UI компоненты
│   ├── header/
│   ├── sidebar/
│   └── notifications/
└── shared/       # Переиспользуемый код
    ├── ui/       # UI компоненты (shadcn/ui)
    ├── api/      # API клиент (axios)
    ├── lib/      # Утилиты
    └── styles/   # Глобальные стили
```

#### State Management

- **TanStack Query** - для server state (кэширование, синхронизация)
- **React Context** - для auth state
- **Local State** - для UI состояния (useState, useReducer)

#### UI/UX

- **Notion-style дизайн** - мягкие скругления, просторные отступы
- **Tailwind CSS** - utility-first CSS framework
- **shadcn/ui** - переиспользуемые компоненты
- **Responsive** - desktop-first подход

### Интеграции

#### Tolgee (i18n)

- **Backend**: Django middleware для получения переводов через Tolgee API
- **Frontend**: TolgeeProvider для загрузки и переключения языков
- **Сертификаты**: Локализация шаблонов через Tolgee при генерации PDF

#### PDF Generation

- **WeasyPrint** - генерация PDF из HTML шаблонов
- Поддержка локализации через Tolgee
- Placeholders для динамических данных ({{student_name}}, {{grade}})

## Потоки данных

### Аутентификация

```
1. User вводит email/password
2. Frontend отправляет POST /api/auth/login/
3. Backend валидирует и возвращает access + refresh tokens
4. Frontend сохраняет tokens в localStorage
5. Axios interceptor добавляет Bearer token в заголовки
6. При 401 - автоматический refresh через /api/auth/refresh/
```

### Загрузка данных

```
1. Component использует TanStack Query hook
2. Query отправляет запрос через apiClient (axios)
3. Axios interceptor добавляет Bearer token
4. Backend проверяет JWT и permissions
5. Возвращает данные
6. TanStack Query кэширует результат
```

### Генерация сертификата

```
1. Teacher/Admin выбирает студента и шаблон
2. Frontend отправляет POST /api/certificates/generate/
3. Backend получает шаблон из БД
4. Backend запрашивает переводы через Tolgee API
5. Заменяет placeholders данными студента
6. Генерирует PDF через WeasyPrint
7. Сохраняет файл в media/certificates/
8. Возвращает URL для скачивания
```

## Масштабируемость

### Горизонтальное масштабирование

- Backend: можно запускать несколько инстансов Django за load balancer
- Frontend: статические файлы через CDN
- Database: PostgreSQL с репликацией
- Redis: для кэширования и сессий

### Вертикальное масштабирование

- Оптимизация запросов через select_related/prefetch_related
- Индексы в БД для частых запросов
- Кэширование через Redis
- Пагинация для больших списков

## Безопасность

1. **Аутентификация**: JWT с коротким временем жизни access token
2. **Авторизация**: RBAC на уровне permission classes
3. **CORS**: Настроен для разрешенных origins
4. **CSRF**: Защита через Django middleware
5. **SQL Injection**: Защита через Django ORM
6. **XSS**: React автоматически экранирует данные
7. **Audit Logging**: Логирование критических действий

## Мониторинг и логирование

- Django logging для backend
- Console logging для frontend (в dev режиме)
- AuditLog модель для отслеживания действий пользователей
- Health checks в docker-compose

## Развертывание

### Development

- Docker Compose для локальной разработки
- Hot reload для frontend (Vite)
- Django runserver для backend

### Production

- Gunicorn + Nginx для backend
- Nginx для статических файлов frontend
- PostgreSQL с настройками для production
- Redis для кэширования
- SSL/TLS сертификаты
- Мониторинг и логирование

