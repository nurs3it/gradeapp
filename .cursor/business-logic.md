# Бизнес-логика GradeApp

## Целевая аудитория

- Школы Казахстана: НИШ, КТЛ, Haileybury, ФМШ и другие престижные школы
- Мульти-школьность: одна платформа может обслуживать несколько школ; пользователь привязан к школе через роли и linked_school

## Роли и права

Роли заданы в `users.models.Role` и привязаны к **школе** через модель **UserRole** (user + school + role). Дополнительно Django-пользователи с `is_superuser=True` приравниваются к SuperAdmin на backend (создание/редактирование школ и т.д.).

### Таблица ролей и разрешений

| Разрешение / Ресурс | SuperAdmin | SchoolAdmin | Director | Teacher | Student | Parent | Registrar | Scheduler |
|---------------------|:----------:|:-----------:|:--------:|:-------:|:-------:|:------:|:---------:|:---------:|
| **Школы** |
| Просмотр списка школ | все | своя | своя | — | — | — | — | — |
| Создание / редактирование / удаление школы | ✓ | ✓ | — | — | — | — | — | — |
| Настройки школы (страница директора) | — | — | ✓ | — | — | — | — | — |
| **Учебные годы** |
| CRUD учебных годов | ✓ | ✓ | ✓* | — | — | — | — | — |
| **Персонал (Staff)** |
| Просмотр / создание / редактирование | ✓ | ✓ | — | — | — | — | — | — |
| **Ученики (Students)** |
| Список учеников (все / по школе) | ✓ | ✓ | — | свои курсы | — | — | — | — |
| Создание / импорт / экспорт учеников | ✓ | ✓ | — | — | — | — | — | — |
| **Расписание** |
| Админ: построитель расписания, конфликты | ✓ | ✓ | ✓ | — | — | — | ✓ | ✓ |
| Учитель: просмотр своего расписания | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| **Журнал / Оценки** |
| Выставление оценок, фидбэк | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| Просмотр своих оценок | — | — | — | — | ✓ | — | — | — |
| **Посещаемость** |
| Открытие/закрытие урока, отметка посещаемости | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| Просмотр своей посещаемости | — | — | — | — | ✓ | — | — | — |
| Просмотр посещаемости детей | — | — | — | — | — | ✓ | — | — |
| **Сертификаты** |
| Шаблоны сертификатов (CRUD) | ✓ | ✓ | — | — | — | — | — | — |
| Выдача сертификатов | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| Просмотр своих сертификатов | — | — | — | — | ✓ | ✓ | — | — |
| **Пользователи (Users)** |
| Список / редактирование пользователей и ролей | ✓ | ✓ | — | — | — | — | — | — |
| **Прочее** |
| Дашборд, профиль (редактирование себя) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| Импорт/экспорт студентов | ✓ | ✓ | ✓ | — | — | — | — | — |

\* Учебные годы: доступ на backend через `HasPermission('academic_years.crud')`. Ограничение по «своей» школе задаётся в `get_queryset`.

### Навигация (Frontend, сайдбар)

| Раздел | Роли, видящие пункт меню | Разрешение (код) |
|--------|---------------------------|------------------|
| Дашборд | superadmin, schooladmin, director, teacher, student, parent | nav.dashboard |
| Профиль | superadmin, schooladmin, director, teacher, student, parent | nav.profile |
| Журнал (учитель) | teacher | nav.journal |
| Расписание (учитель) | teacher | nav.schedule_teacher |
| Посещаемость (учитель) | teacher | nav.attendance_teacher |
| Школы (список, создание) | superadmin, schooladmin | nav.schools |
| Настройки школы | director | nav.school_settings |
| Расписание (админ) | superadmin, schooladmin, director, registrar, scheduler | nav.schedule_admin |
| Импорт/экспорт | superadmin, schooladmin, director | nav.import_export |
| Обзор (родитель) | parent | nav.parent_overview |
| Сертификаты | superadmin, schooladmin, director, teacher | nav.certificates |
| Разрешения ролей | superadmin | permissions.manage |

### Динамические разрешения (роли и разрешения)

- Модели **Permission** (код, название, resource, action) и **RolePermission** (роль + разрешение) хранят матрицу «роль → разрешения».
- Начальная матрица задаётся миграцией `users.0003_seed_permissions` и может быть изменена через страницу **Управление разрешениями** (только SuperAdmin): `/admin/permissions`.
- API: `GET /api/permissions/` — список разрешений; `GET/PUT /api/roles/<role>/permissions/` — разрешения роли. Доступ только при наличии разрешения `permissions.manage` (или `is_superuser`).
- Ответ `GET /users/me/` включает поле **permissions** — список кодов эффективных разрешений пользователя (по ролям из UserRole и RolePermission; при `is_superuser` — все коды).

### Проверка прав на backend

- **users.permissions**: IsSuperAdmin, IsSchoolAdmin, IsTeacher, IsStudent, IsParent, IsTeacherOrStudent, IsSuperAdminOrSchoolAdmin, IsScheduleAdmin, **HasPermission(permission_code)**
- **HasPermission(permission_code)** — проверка по динамической матрице: разрешено, если `request.user.is_superuser` или у пользователя есть данное разрешение через одну из его ролей (RolePermission).
- Часть viewset’ов использует HasPermission (школы, учебные годы, расписание админ, API разрешений); остальные — классы по ролям (IsSchoolAdmin, IsTeacher и т.д.).
- Роль проверяется через `request.user.has_role(Role.*)`; эффективные разрешения — через `request.user.get_effective_permission_codes()`.

### Проверка на frontend

- Sidebar и BottomNav фильтруют пункты по **user.permissions**: пункт показывается, если у пользователя есть все коды из `navItem.requiredPermissions`. При отсутствии `user.permissions` используется fallback по `navItem.roles`.
- Навигация задана в `widgets/sidebar/Sidebar.tsx` и `widgets/bottom-nav/BottomNav.tsx` (requiredPermissions + roles).
- Маршрут `/admin/permissions` — страница управления разрешениями ролей (только при наличии `permissions.manage` или is_superuser).
- Защита маршрутов: `ProtectedRoute` (isAuthenticated); разграничение — через отображение пунктов меню по разрешениям/ролям и проверку на странице при необходимости.

## Ключевые сценарии

### Школа и академический год

- Школа — корневая сущность; привязана к справочнику городов (City) через ForeignKey
- Академический год привязан к школе (start_date, end_date, is_current)
- Классы (ClassGroup) привязаны к школе и к академическому году; у класса есть homeroom_teacher (Staff)

### Ученики и классы

- Студент привязан к User (OneToOne), к школе и к классу (ClassGroup)
- StudentParent связывает студента и родителя (User); один родитель может быть привязан к нескольким детям
- При фильтрации списков студентов обычно используется school_id и при необходимости class_group_id

### Расписание

- **Course** — курс (предмет + учитель + класс + академический год)
- **ScheduleSlot** — повторяющийся слот по дням недели (day_of_week 0–6, start_time, end_time, classroom)
- **Lesson** — конкретный урок по дате (course, date, teacher, attendance_open_flag)
- Конфликты расписания проверяются через эндпоинт resolve-conflicts (учитель/аудитория/время)

### Журнал и оценки

- **Grade** привязана к student, course, опционально к lesson; есть type (quiz, homework, exam, project, participation, final), value, scale (например 10-point), recorded_by (User)
- **Feedback** — от учителя (from_user) к студенту (to_student), текст и теги
- Шкала оценок школы хранится в School.grading_system (JSON)

### Посещаемость

- **Attendance** — одна запись на пару (lesson, student); статусы: present, absent, tardy, excused; recorded_by — кто отметил
- Урок может быть открыт/закрыт для отметки (Lesson.attendance_open_flag); эндпоинты open_attendance/close_attendance
- Массовая отметка: POST /api/attendance/mark/ с lesson_id и массивом records (student_id, status, reason)

### Сертификаты

- **CertificateTemplate** — HTML-шаблон с плейсхолдерами ({{student_name}}, {{title}}, {{issue_date}}, {{school_name}} и т.д.)
- **Certificate** — экземпляр: студент, название, дата выдачи, язык, meta (JSON); после генерации — pdf_file, pdf_url
- Генерация: WeasyPrint + подстановка данных студента и при необходимости перевод заголовка через Tolgee

## Правила и ограничения

- **Фильтрация по школе**: при отображении списков (школы, классы, студенты, персонал, курсы и т.д.) учитывать school_id или linked_school пользователя; SuperAdmin видит все школы
- **Языки**: ru, kz, en — в настройках школы (languages_supported), у пользователя (language_pref), в сертификатах и в i18n
- **Часовой пояс**: Asia/Almaty в Django; даты и время хранить в UTC, отображать с учётом таймзоны при необходимости
- **Демо-данные**: создают одну школу (Haileybury Almaty) и набор пользователей всех ролей; не изменять логику загрузки без необходимости, при добавлении новых полей/сущностей — дополнять load_demo_data

При добавлении новых ролей или сценариев обновлять permissions на backend и навигацию/проверки на frontend; при изменении правил доступа — описать здесь.
