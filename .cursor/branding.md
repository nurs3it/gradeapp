# Брендинг и UI GradeApp (Apple HIG–style)

## Стиль интерфейса

- **iOS / iPadOS / macOS–like**: Apple Human Interface Guidelines — ясность (clarity), сдержанность (deference), глубина (depth).
- **Tailwind CSS** + CSS-переменные в `frontend/src/shared/styles/index.css`.
- Компоненты в `frontend/src/shared/ui/`: Button, Card, Dialog, Input, Select, Toast — скругления 12px/16px, системный шрифт, акцент #007AFF.

## Apple HIG принципы (применяем в проекте)

1. **Clarity** — текст читаемый, иконки и кнопки понятные, иерархия ясная.
2. **Deference** — контент на первом плане; навигация и UI не перегружают, поддерживают контент.
3. **Depth** — визуальная иерархия через тонкие тени, размытие (backdrop-blur), слои (карточки, модалки).
4. **Typography** — системный шрифт: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial`. Размеры: 15px для тела, заголовки — semibold/bold.
5. **Touch targets** — минимум 44px по высоте для интерактивных элементов на мобильных/планшетах.
6. **Safe areas** — учёт safe-area-inset для устройств с вырезами (классы .safe-area-top, .safe-area-bottom в index.css).
7. **Motion** — короткие, плавные анимации (0.2–0.35s), кривая cubic-bezier(0.32, 0.72, 0, 1) для модалок/панелей.

## Цвета и тема

### Светлая тема (:root)

- **background** — светло-серый фон (220 14% 96%), как групповой фон в iOS.
- **card** — белый (0 0% 100%) для карточек и панелей.
- **primary** — системный синий #007AFF (211 100% 50%) для кнопок и ссылок.
- **border**, **input** — светло-серые границы.
- **--radius** — 12px; **--radius-sm** — 8px; **--radius-lg** — 16px.

### Тёмная тема (.dark)

- Те же имена переменных, значения под тёмный фон (см. index.css).
- Переключение через класс `dark` на корне (darkMode: ["class"] в tailwind.config.js).

## Компоненты UI

- **Button** — rounded-xl, primary/outline/ghost/destructive; активное состояние active:scale-[0.98].
- **Input** — h-11, rounded-xl, border, focus ring.
- **Card** — rounded-2xl, border, лёгкая тень (shadow-sm).
- **Select** — нативный select, стилизованный под форму (rounded-xl, h-11).
- **Dialog** — backdrop-blur, rounded-2xl; на мобильных — снизу (items-end), на десктопе — по центру.
- **Toast** — через ToastProvider.

Все компоненты используют CSS-переменные и утилиты Tailwind (bg-background, text-foreground, border-border, rounded-xl и т.д.).

## Адаптивность

- **Desktop (lg: 1024px+)** — фиксированный сайдбар слева, контент справа на всю ширину (без max-w контейнера).
- **Планшет / мобильный** — сайдбар в виде выезжающей панели (drawer), кнопка меню в Header; контент на всю ширину, отступы p-4 sm:p-6.
- Safe area — для нижней/верхней полосы на устройствах с вырезами.

## Анимации

- **fadeIn** — появление по opacity.
- **slideUp** — появление снизу (модалки, панели).
- **slide-in-from-right** — выезд справа (при необходимости).
- Длительность 0.2–0.35s, кривая cubic-bezier(0.32, 0.72, 0, 1) для «пружинящего» ощущения.

## Иконки

- **Lucide React** — единая библиотека (LayoutDashboard, BookOpen, Calendar, School, Award, LogOut и др.).
- Размеры: w-5 h-5 для списков/меню, w-6 h-6 для заголовков/акцентов.
- Цвет: text-foreground, text-muted-foreground, text-primary по контексту.

## Локализация

- Все строки для пользователя — через i18n (namespace + key), не хардкод.
- Языки: ru, kz, en.

При добавлении новых экранов или компонентов сохраняй единый стиль: скругления 12px/16px, системный шрифт, primary для акцентов, учёт safe area и touch targets на мобильных.
