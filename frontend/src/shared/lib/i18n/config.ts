import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Available namespaces
export const namespaces = {
  common: 'common',
  app: 'app',
  auth: 'auth',
  dashboard: 'dashboard',
  teacher: 'teacher',
  parent: 'parent',
  admin: 'admin',
  certificates: 'certificates',
  language: 'language',
  profile: 'profile',
} as const

export type Namespace = typeof namespaces[keyof typeof namespaces]

// Available languages
export const languages = {
  ru: 'ru',
  kz: 'kz',
  en: 'en',
} as const

export type Language = typeof languages[keyof typeof languages]

// Language display names
export const languageNames: Record<Language, string> = {
  ru: 'Русский',
  kz: 'Қазақша',
  en: 'English',
}

// Lazy load translation resources
export const loadResource = async (language: Language, namespace: Namespace) => {
  try {
    const module = await import(`./locales/${language}/${namespace}.json`)
    return module.default
  } catch (error) {
    console.warn(`Failed to load ${namespace} for ${language}:`, error)
    return {}
  }
}

const allNamespaces = Object.values(namespaces) as Namespace[]

/** Normalize i18n language code to our Language (ru, kz, en). Export for Header etc. */
export function normalizeLanguage(lng: string | undefined): Language {
  const code = (lng || '').split('-')[0].toLowerCase()
  if (code === 'ru' || code === 'kz' || code === 'en') return code as Language
  return languages.en
}

/** Preload all namespaces for a language so keys never show as raw key */
async function preloadAllNamespaces(language: Language) {
  const loadPromises = allNamespaces.map(async (ns) => {
    try {
      const resource = await loadResource(language, ns)
      i18n.addResourceBundle(language, ns, resource, true, true)
    } catch {
      i18n.addResourceBundle(language, ns, {}, true, true)
    }
  })
  await Promise.all(loadPromises)
}

// Initialize i18n: do NOT set lng so detector runs first (localStorage → navigator)
const initPromise = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: [languages.en, languages.ru],
    defaultNS: namespaces.common,
    ns: allNamespaces,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    resources: {},
  })
  .then(async () => {
    const raw = i18n.language
    const currentLanguage = normalizeLanguage(raw)
    if (raw !== currentLanguage) {
      i18n.changeLanguage(currentLanguage)
    }
    await preloadAllNamespaces(currentLanguage)
    i18n.on('languageChanged', async (lng) => {
      const next = normalizeLanguage(lng)
      await preloadAllNamespaces(next)
    })
    return i18n
  })

// Export promise for components that need to wait
export const i18nReady = initPromise

export default i18n

