# i18n Architecture

Архитектура локализации построена на основе **i18next** с поддержкой **namespaces** и **lazy loading**.

## Структура

```
i18n/
├── config.ts          # Конфигурация i18next
├── hooks.ts           # Кастомные хуки для работы с namespaces
└── locales/           # Файлы переводов
    ├── ru/           # Русский язык
    │   ├── common.json
    │   ├── app.json
    │   ├── auth.json
    │   ├── dashboard.json
    │   ├── teacher.json
    │   ├── parent.json
    │   ├── admin.json
    │   ├── certificates.json
    │   └── language.json
    ├── kz/           # Казахский язык
    │   └── ...
    └── en/           # Английский язык
        └── ...
```

## Namespaces

Переводы разделены на логические namespaces:

- **common** - общие переводы (loading, logout, user)
- **app** - название приложения
- **auth** - авторизация
- **dashboard** - панель управления
- **teacher** - функционал учителя
- **parent** - функционал родителя
- **admin** - административный функционал
- **certificates** - сертификаты
- **language** - названия языков

## Lazy Loading

Переводы загружаются **только когда они нужны**:

1. При инициализации загружаются только общие namespaces: `common`, `app`, `language`
2. Остальные namespaces загружаются динамически при первом использовании
3. Каждый компонент загружает только те namespaces, которые он использует

## Использование

### Базовое использование (один namespace)

```tsx
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'

function MyComponent() {
  const { t } = useTranslationWithNamespace(namespaces.dashboard)
  
  return <h1>{t('title')}</h1>
}
```

### Использование нескольких namespaces

```tsx
import { useTranslationWithNamespaces } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'

function MyComponent() {
  const { t } = useTranslationWithNamespaces([namespaces.dashboard, namespaces.common])
  
  return (
    <>
      <h1>{t('title', { ns: namespaces.dashboard })}</h1>
      <button>{t('logout', { ns: namespaces.common })}</button>
    </>
  )
}
```

### Параметры в переводах

```tsx
// В JSON файле:
{
  "welcome": "Добро пожаловать, {{name}}"
}

// В компоненте:
t('welcome', { name: 'Иван' })
```

## Добавление новых переводов

1. Добавьте ключ в соответствующий namespace файл для всех языков
2. Используйте `useTranslationWithNamespace` или `useTranslationWithNamespaces` в компоненте
3. Переводы загрузятся автоматически при первом использовании

## Преимущества архитектуры

✅ **Lazy Loading** - загружаются только используемые переводы  
✅ **Разделение по domains** - логическая организация переводов  
✅ **Type Safety** - типизированные namespaces  
✅ **Производительность** - меньше начальной загрузки  
✅ **Масштабируемость** - легко добавлять новые namespaces

