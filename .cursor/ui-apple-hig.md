# UI/UX по Apple Human Interface Guidelines (GradeApp)

Краткая шпаргалка для соблюдения стиля iOS/iPadOS/macOS в проекте.

## Источники

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) (официально)
- [iOS Design Themes](https://developer.apple.com/design/human-interface-guidelines/design-principles): Clarity, Deference, Depth
- [Typography](https://developer.apple.com/design/human-interface-guidelines/typography) — SF Pro, текстовые стили
- [Color](https://developer.apple.com/design/human-interface-guidelines/color) — системные цвета, акценты

## Что применено в GradeApp

| Принцип | Реализация |
|--------|------------|
| **Clarity** | Чёткая иерархия заголовков, читаемые размеры (15px тело), понятные иконки и подписи |
| **Deference** | Контент на первом плане; сайдбар и хедер минималистичны; карточки без лишнего декора |
| **Depth** | Backdrop blur в хедере и модалках; лёгкие тени у карточек; слои (фон → карточка → модалка) |
| **Typography** | `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text"` в body; semibold для заголовков |
| **Color** | Primary = системный синий (HSL 211 100% 50%); фон — светло-серый; карточки — белые |
| **Corners** | 12px (--radius), 8px (sm), 16px (lg); кнопки и инпуты rounded-xl |
| **Touch** | Кнопки/инпуты min h-10/h-11; отступы в списках (py-2.5, px-3) |
| **Motion** | 0.2–0.35s, cubic-bezier(0.32, 0.72, 0, 1); без резких движений |
| **Safe area** | Классы .safe-area-top, .safe-area-bottom для устройств с вырезами |
| **Layout** | Полная ширина контента (w-full); сайдбар фиксирован слева на lg; на мобильных — drawer |

## Компоненты

- **Кнопки**: rounded-xl, варианты default (primary), outline, ghost, destructive; active:scale-[0.98].
- **Поля ввода**: h-11, rounded-xl, border, focus ring 2px.
- **Карточки**: rounded-2xl, border, shadow-sm.
- **Модалки**: backdrop-blur, rounded-2xl; на мобильных — снизу (sheet-style).
- **Список навигации**: скруглённые пункты (rounded-xl), активный — bg-primary/12 text-primary.

## Чего избегать

- Жёсткие тени и границы; перегруженный декор.
- Мелкие кликабельные области на мобильных (< 44px).
- Длинные анимации (> 0.5s) и резкие переходы.
- Контейнеры с max-w для основного контента — контент на всю доступную ширину.

При добавлении новых страниц или компонентов сверяйся с `branding.md` и этим файлом.
