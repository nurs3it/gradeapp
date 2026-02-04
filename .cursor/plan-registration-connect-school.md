# План: flow регистрации и подключения к школе

## Исходные решения

- **Роли в селекте:** все кроме SuperAdmin (Teacher, Student, Parent, Director, SchoolAdmin, Registrar, Scheduler).
- **Код школы:** 6-значный, автогенерация при создании школы, только для чтения (не редактируется).
- **Регистрация:** отдельная страница регистрации + ссылка «Зарегистрироваться» на странице входа.

---

## Часть 1. Основной flow

### 1.1 Backend: School.connection_code

- В `backend/schools/models.py`: поле `connection_code` — CharField(max_length=6, unique=True, db_index=True). Генерация в `save()` при пустом значении (уникальный 6 символов). В API при update поле read_only.
- Миграция: добавить поле; для существующих школ заполнить в RunPython сгенерированными кодами.

### 1.2 Backend: модель SchoolJoinRequest

- Модель (users или schools): user (FK), school (FK), requested_role (CharField, Role.choices без SuperAdmin), status (pending/approved/rejected), created_at, reviewed_at (null), reviewed_by (FK User, null), rejection_reason (TextField, blank).
- Один активный pending на пару (user, school): проверка при создании заявки или unique_together + статус.
- Миграция.

### 1.3 Backend: API

- **GET /api/schools/by_code/<code>/** — школа по коду (id, name, city). IsAuthenticated. Rate limit: 5 запросов/мин с аккаунта (throttling).
- **POST /api/school-join-requests/** — body: school_id, requested_role. Только IsAuthenticated. Запрет requested_role=superadmin. Не создавать, если уже есть pending (user, school) — 400.
- **GET /api/school-join-requests/** — свои заявки (все статусы) или для Director/SchoolAdmin/SuperAdmin — pending по школам, где есть право одобрять. Параметры: status, school_id.
- **PATCH /api/school-join-requests/<id>/** — status=approved|rejected, опционально rejection_reason. Только тот, кто может одобрять по этой школе. При approved: UserRole создаётся, linked_school ставится если null, reviewed_at/reviewed_by, запись в AuditLog. При rejected: rejection_reason сохранить.
- Регистрация гостя: текущий POST /api/auth/register/ без role/school_id — без изменений.

### 1.4 Frontend: регистрация и дашборд гостя

- Страница `/register`: форма (email, password, password_confirm, first_name, last_name). POST register без role/school_id → логин → redirect /dashboard. Ссылка «Зарегистрироваться» на странице входа.
- Дашборд для гостя (нет ролей): виджет «Подключение к школе» — инпут кода 6 символов, кнопка «Проверить» → GET by_code. При успехе: название школы + селект роли (все кроме superadmin) + «Подать заявку» → POST school-join-requests. Блок «Мои заявки»: список (школа, роль, статус; при rejected — причина отклонения если есть).
- Повторная заявка: если уже есть заявка по этой школе — не показывать форму подачи, а показывать статус («На рассмотрении» / «Подключены» / «Отклонено» + причина). При отклонении — возможность подать заявку снова.
- Навигация гостя: только Дашборд и Профиль (по факту отсутствия ролей).

### 1.5 Frontend: страница одобрения заявок

- Страница `/admin/join-requests`: доступ Director/SchoolAdmin/SuperAdmin. Таблица заявок (pending по своим школам): пользователь (email, имя), школа, роль, дата. Действия: Одобрить / Отклонить (с опциональным полем «Причина отклонения»). Фильтр по школе (для SuperAdmin), сортировка по дате. Массовое одобрение: чекбоксы + кнопка «Одобрить выбранные».

---

## Часть 2. UX и обратная связь

- **Уведомления:** при одобрении/отклонении создавать Notification для пользователя-заявителя («Заявка в школу X одобрена» / «Отклонена: <причина>»). На фронте показывать в виде тоста или блока «У вас новое уведомление».
- **После одобрения:** на дашборде краткое сообщение «Вы подключены к школе X» и кнопка перейти в раздел школы (или выбор текущей школы, если их несколько).
- **Ограничение запросов по коду:** throttle на GET /schools/by_code/ (например 5 запросов в минуту с одного пользователя). При превышении — 429 и сообщение «Слишком много попыток, попробуйте позже».
- **Подсказка после регистрации:** один раз показать тултип/блок рядом с полем кода: «Подключитесь к школе по коду, который дал администратор».

---

## Часть 3. Безопасность и валидация

- **Код только для чтения:** в сериализаторе школы при update поле connection_code не принимается (read_only). В админке — только отображение, без редактирования.
- **SuperAdmin в заявках:** на бэкенде явно отклонять requested_role=superadmin (400). На фронте не показывать в селекте.
- **Один pending на (user, school):** при POST заявки проверять отсутствие другой заявки в статусе pending для этой пары; иначе 400 «Заявка уже подана».
- **Права на одобрение:** проверять, что одобряющий имеет роль Director/SchoolAdmin/SuperAdmin именно для этой школы (по UserRole), а не только глобально.

---

## Часть 4. Удобство для школы и админов

- **Где взять код:** на странице настроек школы (для директора/админа) крупно показывать код подключения + кнопка «Скопировать» (clipboard). Так можно раздавать код учителям/родителям.
- **Заявки:** фильтр по школе, сортировка по дате, поиск по email/имени (если объём заявок вырастет).
- **Причина отклонения:** поле rejection_reason в модели и в PATCH; отображать в «Мои заявки» и в уведомлении.

---

## Часть 5. Гость и мульти-школа

- **Единый дашборд:** гостю тот же дашборд с виджетом «Подключение к школе» и пунктами Дашборд + Профиль — без отдельной «страницы гостя».
- **Переключатель текущей школы:** если у пользователя несколько школ (несколько ролей в разных школах) — в хедере или сайдбаре селект «Текущая школа» (меняет linked_school через PATCH /users/me/ или отдельный эндпоинт), чтобы контент и меню соответствовали выбранной школе.

---

## Часть 6. Данные и аудит

- **Заявки не удалять:** хранить все заявки со статусами (pending/approved/rejected) для аудита и поддержки.
- **AuditLog:** при одобрении/отклонении писать запись: actor (кто одобрил/отклонил), action (approve/reject), target=SchoolJoinRequest, target_id, school, payload (user, requested_role, rejection_reason при отклонении).

---

## Часть 7. Порядок внедрения

1. Backend: School.connection_code + миграция (включая заполнение для существующих школ).
2. Backend: модель SchoolJoinRequest (с полем rejection_reason) + миграция.
3. Backend: API by_code (с throttle), CRUD заявок, логика одобрения (UserRole, linked_school, AuditLog, Notification).
4. Frontend: страница регистрации + маршрут + ссылка на логине.
5. Frontend: виджет «Подключение к школе» + «Мои заявки» (с учётом дубликата заявки и причины отклонения) + API-клиент.
6. Frontend: страница «Заявки на подключение» (фильтр, сортировка, массовое одобрение, причина отклонения).
7. Frontend: отображение кода в настройках школы + «Скопировать».
8. Frontend: уведомления при одобрении/отклонении (тост или блок); сообщение после одобрения на дашборде.
9. Frontend: подсказка после регистрации (один раз); переключатель текущей школы при нескольких школах.
10. Локализация: ключи для регистрации, виджета, заявок, настроек школы (ru/en/kz).

---

## Схема flow

```mermaid
sequenceDiagram
  participant User
  participant Frontend
  participant Backend
  participant DB

  User->>Frontend: Регистрация (email, пароль, имя)
  Frontend->>Backend: POST /register (без role/school)
  Backend->>DB: User без ролей
  Backend->>Frontend: tokens + user
  User->>Frontend: Дашборд (гость)
  Frontend->>User: Виджет «Подключение к школе»
  User->>Frontend: Ввод 6-значного кода
  Frontend->>Backend: GET /schools/by_code/{code} (throttle)
  Backend->>DB: School по connection_code
  Backend->>Frontend: school (id, name, city)
  User->>Frontend: Выбор роли + «Подать заявку»
  Frontend->>Backend: POST /school-join-requests (school_id, role)
  Backend->>DB: SchoolJoinRequest pending
  Note over User,DB: Админ/директор: «Заявки на подключение»
  Frontend->>Backend: GET /school-join-requests (pending)
  User->>Frontend: «Одобрить» / «Отклонить» (+ причина)
  Frontend->>Backend: PATCH .../status=approved|rejected
  Backend->>DB: UserRole, linked_school, Notification, AuditLog
  Backend->>Frontend: OK
  Frontend->>User: Уведомление; «Вы подключены к школе X»
```

Все перечисленные доработки (уведомления, причина отклонения, код в настройках, переключатель школы, throttle, аудит) подключены к плану и учтены в порядке внедрения.
