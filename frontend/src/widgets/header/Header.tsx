import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { namespaces, languages, normalizeLanguage } from '@/shared/lib/i18n/config'
import { useTheme, Theme } from '@/shared/lib/ThemeProvider'
import { useAuth } from '@/shared/lib/auth'
import { usersApi, type UserSchool } from '@/shared/api/users'
import { Menu, Globe, Sun, ChevronDown, Check, School, User, LogOut } from 'lucide-react'
import { clsx } from 'clsx'

interface HeaderProps {
  onMenuClick?: () => void
  showMenuButton?: boolean
}

const languageList = [
  { code: languages.ru, name: 'Русский' },
  { code: languages.kz, name: 'Қазақша' },
  { code: languages.en, name: 'English' },
]

const themeList: { value: Theme; labelKey: string; icon: typeof Sun }[] = [
  { value: 'light', labelKey: 'theme_light', icon: Sun },
  { value: 'dark', labelKey: 'theme_dark', icon: Sun },
  { value: 'coffee', labelKey: 'theme_coffee', icon: Sun },
]

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [ref, onClose])
}

export function Header({ onMenuClick, showMenuButton = false }: HeaderProps) {
  const navigate = useNavigate()
  const { t, i18n, ready } = useTranslation([namespaces.app, namespaces.language, namespaces.common, namespaces.profile])
  const { theme, setTheme } = useTheme()
  const { user, setUser, logout } = useAuth()
  const [langOpen, setLangOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [schoolOpen, setSchoolOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [schoolSwitching, setSchoolSwitching] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const themeRef = useRef<HTMLDivElement>(null)
  const schoolRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useOutsideClick(langRef, () => setLangOpen(false))
  useOutsideClick(themeRef, () => setThemeOpen(false))
  useOutsideClick(schoolRef, () => setSchoolOpen(false))
  useOutsideClick(profileRef, () => setProfileOpen(false))

  const schools: UserSchool[] = user?.schools ?? []
  const hasMultipleSchools = schools.length > 1
  const currentSchool = schools.find((s: UserSchool) => s.id === (user?.linked_school ?? '')) ?? schools[0]

  const handleSchoolChange = async (schoolId: string) => {
    if (schoolId === user?.linked_school) {
      setSchoolOpen(false)
      return
    }
    setSchoolSwitching(true)
    try {
      const updated = await usersApi.updateMe({ linked_school: schoolId })
      setUser(updated)
      setSchoolOpen(false)
    } finally {
      setSchoolSwitching(false)
    }
  }

  const currentLanguage = normalizeLanguage(i18n.language) || languages.en
  const currentLangName = languageList.find((l) => l.code === currentLanguage)?.name ?? currentLanguage

  const languageNamesI18n: Record<string, string> = {
    [languages.ru]: ready ? t('russian', { ns: namespaces.language }) : 'Русский',
    [languages.kz]: ready ? t('kazakh', { ns: namespaces.language }) : 'Қазақша',
    [languages.en]: ready ? t('english', { ns: namespaces.language }) : 'English',
  }

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode).then(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('i18nextLng', langCode)
      }
    })
    setLangOpen(false)
  }

  const appName = ready ? t('name', { ns: namespaces.app }) : 'GradeApp'
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || ''
  const isAuthenticated = !!user?.id

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-xl safe-area-top">
      <div className="w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {showMenuButton && (
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden shrink-0 p-2 -ml-2 rounded-xl text-foreground hover:bg-accent active:opacity-80"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
            {appName}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* School switcher (when user has multiple schools) */}
          {hasMultipleSchools && (
            <div className="relative" ref={schoolRef}>
              <button
                type="button"
                onClick={() => { setSchoolOpen((o) => !o); setLangOpen(false); setThemeOpen(false) }}
                disabled={schoolSwitching}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-[15px] transition-colors max-w-[180px] truncate',
                  'hover:bg-accent text-foreground',
                  schoolOpen && 'bg-accent'
                )}
                aria-expanded={schoolOpen}
                aria-haspopup="listbox"
              >
                <School className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{currentSchool?.name ?? t('current_school', { ns: namespaces.app })}</span>
                <ChevronDown className={clsx('w-4 h-4 text-muted-foreground shrink-0 transition-transform', schoolOpen && 'rotate-180')} />
              </button>
              {schoolOpen && (
                <div
                  className="absolute right-0 top-full mt-1 py-2 min-w-[200px] max-w-[280px] rounded-xl border border-border bg-card shadow-lg z-30"
                  role="listbox"
                >
                  {schools.map((s: UserSchool) => (
                    <button
                      key={s.id}
                      type="button"
                      role="option"
                      aria-selected={user?.linked_school === s.id}
                      onClick={() => handleSchoolChange(s.id)}
                      className={clsx(
                        'w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-[15px] rounded-lg mx-1 transition-colors truncate',
                        user?.linked_school === s.id
                          ? 'bg-primary/12 text-primary font-medium'
                          : 'hover:bg-accent text-foreground'
                      )}
                    >
                      <span className="truncate">{s.name}</span>
                      {user?.linked_school === s.id && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Language dropdown */}
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => { setLangOpen((o) => !o); setThemeOpen(false) }}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-[15px] transition-colors',
                'hover:bg-accent text-foreground',
                langOpen && 'bg-accent'
              )}
              aria-expanded={langOpen}
              aria-haspopup="listbox"
            >
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span>{languageNamesI18n[currentLanguage] ?? currentLangName}</span>
              <ChevronDown className={clsx('w-4 h-4 text-muted-foreground transition-transform', langOpen && 'rotate-180')} />
            </button>
            {langOpen && (
              <div
                className="absolute right-0 top-full mt-1 py-2 min-w-[150px] rounded-xl border border-border bg-card shadow-lg z-30"
                role="listbox"
              >
                {languageList.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    role="option"
                    aria-selected={currentLanguage === lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={clsx(
                      'w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-[15px] rounded-lg mx-1 transition-colors',
                      currentLanguage === lang.code
                        ? 'bg-primary/12 text-primary font-medium'
                        : 'hover:bg-accent text-foreground'
                    )}
                  >
                    <span>{languageNamesI18n[lang.code] ?? lang.name}</span>
                    {currentLanguage === lang.code && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Theme dropdown */}
          <div className="relative" ref={themeRef}>
            <button
              type="button"
              onClick={() => { setThemeOpen((o) => !o); setLangOpen(false) }}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-[15px] transition-colors',
                'hover:bg-accent text-foreground',
                themeOpen && 'bg-accent'
              )}
              aria-expanded={themeOpen}
              aria-haspopup="listbox"
            >
              <Sun className="w-4 h-4 text-muted-foreground" />
              <span>
                {theme === 'light' && t('theme_light', { ns: namespaces.app })}
                {theme === 'dark' && t('theme_dark', { ns: namespaces.app })}
                {theme === 'coffee' && t('theme_coffee', { ns: namespaces.app })}
              </span>
              <ChevronDown className={clsx('w-4 h-4 text-muted-foreground transition-transform', themeOpen && 'rotate-180')} />
            </button>
            {themeOpen && (
              <div
                className="absolute right-0 top-full mt-1 py-1 min-w-[180px] rounded-xl border border-border bg-card shadow-lg z-30"
                role="listbox"
              >
                {themeList.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={theme === opt.value}
                    onClick={() => { setTheme(opt.value); setThemeOpen(false) }}
                    className={clsx(
                      'w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-[15px] rounded-lg mx-1 transition-colors',
                      theme === opt.value
                        ? 'bg-primary/12 text-primary font-medium'
                        : 'hover:bg-accent text-foreground'
                    )}
                  >
                    <span>{t(opt.labelKey, { ns: namespaces.app })}</span>
                    {theme === opt.value && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Profile dropdown (when authenticated) */}
          {isAuthenticated && (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((o) => !o)
                  setLangOpen(false)
                  setThemeOpen(false)
                }}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-[15px] transition-colors max-w-[200px] truncate',
                  'hover:bg-accent text-foreground',
                  profileOpen && 'bg-accent'
                )}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{displayName || t('user', { ns: namespaces.common })}</span>
                <ChevronDown className={clsx('w-4 h-4 text-muted-foreground shrink-0 transition-transform', profileOpen && 'rotate-180')} />
              </button>
              {profileOpen && (
                <div
                  className="absolute right-0 top-full mt-1 py-2 min-w-[180px] rounded-xl border border-border bg-card shadow-lg z-30"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileOpen(false)
                      navigate('/profile')
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[15px] rounded-lg mx-1 transition-colors hover:bg-accent text-foreground"
                  >
                    <User className="w-4 h-4 shrink-0 text-muted-foreground" />
                    {t('title', { ns: namespaces.profile, defaultValue: 'Profile' })}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileOpen(false)
                      logout()
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[15px] rounded-lg mx-1 transition-colors hover:bg-destructive/10 text-destructive"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {t('logout', { ns: namespaces.common, defaultValue: 'Logout' })}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
