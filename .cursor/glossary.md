# Глоссарий GradeApp

Термины и сущности проекта для единообразного понимания в коде и документации.

## Роли и пользователи

- **SuperAdmin** — глобальный администратор платформы, доступ ко всем школам.
- **SchoolAdmin** — администратор конкретной школы (управление штатом, классами, настройками).
- **Director** — директор школы (в правах часто объединяют с SchoolAdmin).
- **Teacher** — учитель (журнал, оценки, посещаемость, расписание своих курсов).
- **Student** — ученик (профиль, свои оценки и расписание).
- **Parent** — родитель (просмотр успеваемости привязанных детей).
- **Registrar** — секретарь (учёт, расписание).
- **Scheduler** — ответственный за построение расписания.
- **User** — учётная запись (email, имя, linked_school); может иметь роли в разных школах через **UserRole**.

## Школа и учёба

- **School** — школа (название, тип: НИШ/КТЛ/Haileybury/ФМШ/другие, город, шкала оценок, языки).
- **AcademicYear** — учебный год школы (start_date, end_date, is_current).
- **ClassGroup** — класс (например 10A, 11B): школа, академический год, grade_level, homeroom_teacher.
- **Student** — ученик: привязка к User, школа, класс, student_number, даты поступления/окончания.
- **StudentParent** — связь ученик–родитель (relationship: parent, mother, father, guardian и т.д.).

## Персонал и предметы

- **Staff** — сотрудник школы: привязка к User, должность (teacher, director, admin, registrar, scheduler), нагрузка (load_limit_hours).
- **Subject** — предмет (название, code, default_credits).
- **StaffSubject** — связь сотрудник–предмет (кто какой предмет ведёт).
- **Position** — должность (teacher, director, admin, registrar, scheduler).

## Расписание и уроки

- **Course** — курс: предмет + учитель + класс + академический год (один курс = один предмет в одном классе у одного учителя).
- **ScheduleSlot** — повторяющийся слот в расписании (день недели 0–6, start_time, end_time, classroom).
- **Lesson** — конкретный урок по дате (course, date, teacher, classroom, attendance_open_flag).

## Журнал и оценки

- **Grade** — оценка: студент, курс, опционально урок, value, scale (например 10-point), type (quiz, homework, exam, project, participation, final), recorded_by, date.
- **Feedback** — фидбэк от учителя студенту (text, tags, date).
- **GradeType** — тип оценки (quiz, homework, exam, project, participation, final).

## Посещаемость

- **Attendance** — запись посещаемости: урок, студент, статус (present, absent, tardy, excused), reason, recorded_by.
- **AttendanceStatus** — present, absent, tardy, excused.

## Сертификаты

- **CertificateTemplate** — шаблон сертификата (HTML с плейсхолдерами: {{student_name}}, {{title}}, {{issue_date}}, {{school_name}} и т.д.).
- **Certificate** — выданный сертификат: студент, title, issue_date, язык, meta (JSON), после генерации — pdf_file, pdf_url.

## Технические термины

- **JWT** — access + refresh токены (SimpleJWT), хранение на frontend в localStorage.
- **RBAC** — разграничение доступа по ролям (permission classes в backend).
- **Tolgee** — сервис/API для переводов на backend (сертификаты, при необходимости другие строки).
- **i18next** — библиотека локализации на frontend (ru, kz, en, namespaces).
- **linked_school** — школа, с которой ассоциирован пользователь (для фильтрации и контекста ролей).

Использование этих терминов в коде и в .cursor-документации помогает сохранять консистентность и облегчает поиск по проекту.
