import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/lib/auth'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  School,
  Award,
  GraduationCap,
  LogOut,
  FileSpreadsheet,
  UserCheck,
  User,
  MoreHorizontal,
  X,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '@/shared/ui/Button'

const NAV_ITEMS: { path: string; labelKey: string; namespace: string; icon: React.ComponentType<{ className?: string }>; requiredPermissions: string[]; roles: string[] }[] = [
  { path: '/dashboard', labelKey: 'title', namespace: 'dashboard', icon: LayoutDashboard, requiredPermissions: ['nav.dashboard'], roles: ['superadmin', 'schooladmin', 'director', 'teacher', 'student', 'parent'] },
  { path: '/profile', labelKey: 'title', namespace: 'profile', icon: User, requiredPermissions: ['nav.profile'], roles: ['superadmin', 'schooladmin', 'director', 'teacher', 'student', 'parent'] },
  { path: '/teacher/journal', labelKey: 'journal.title', namespace: 'teacher', icon: BookOpen, requiredPermissions: ['nav.journal'], roles: ['teacher'] },
  { path: '/teacher/schedule', labelKey: 'schedule.title', namespace: 'teacher', icon: Calendar, requiredPermissions: ['nav.schedule_teacher'], roles: ['teacher'] },
  { path: '/teacher/attendance', labelKey: 'attendance.title', namespace: 'teacher', icon: UserCheck, requiredPermissions: ['nav.attendance_teacher'], roles: ['teacher'] },
  { path: '/admin/schools', labelKey: 'schools.title', namespace: 'admin', icon: School, requiredPermissions: ['nav.schools'], roles: ['superadmin', 'schooladmin'] },
  { path: '/admin/school-settings', labelKey: 'schools.settings', namespace: 'admin', icon: School, requiredPermissions: ['nav.school_settings'], roles: ['director'] },
  { path: '/admin/schedule', labelKey: 'schedule.title', namespace: 'admin', icon: Calendar, requiredPermissions: ['nav.schedule_admin'], roles: ['superadmin', 'schooladmin', 'director', 'registrar', 'scheduler'] },
  { path: '/admin/import-export', labelKey: 'import_export.title', namespace: 'admin', icon: FileSpreadsheet, requiredPermissions: ['nav.import_export'], roles: ['superadmin', 'schooladmin', 'director'] },
  { path: '/parent/overview', labelKey: 'overview.title', namespace: 'parent', icon: GraduationCap, requiredPermissions: ['nav.parent_overview'], roles: ['parent'] },
  { path: '/certificates', labelKey: 'title', namespace: 'certificates', icon: Award, requiredPermissions: ['nav.certificates'], roles: ['superadmin', 'schooladmin', 'director', 'teacher'] },
  { path: '/admin/permissions', labelKey: 'permissions.title', namespace: 'admin', icon: ShieldCheck, requiredPermissions: ['permissions.manage'], roles: ['superadmin'] },
  { path: '/admin/join-requests', labelKey: 'join_requests.title', namespace: 'admin', icon: UserPlus, requiredPermissions: [], roles: ['schooladmin', 'director'] },
]

const MAIN_NAV_COUNT = 3

interface BottomNavProps {
  className?: string
}

export function BottomNav({ className }: BottomNavProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [moreOpen, setMoreOpen] = useState(false)

  const userPermissions: string[] = Array.isArray(user?.permissions) ? user.permissions : []
  const userRoles: string[] = Array.isArray(user?.roles) ? user.roles : []
  const effectiveRoles =
    user?.is_superuser === true ? [...new Set([...userRoles, 'superadmin'])] : userRoles
  const usePermissions = userPermissions.length > 0
  const isGuest = !effectiveRoles.length
  const filtered = NAV_ITEMS.filter((item) => {
    if (isGuest) return item.path === '/dashboard' || item.path === '/profile'
    if (usePermissions && item.requiredPermissions.length > 0) {
      return item.requiredPermissions.every((p) => userPermissions.includes(p))
    }
    return item.roles.some((role) => effectiveRoles.includes(role))
  })
  const mainItems = filtered.slice(0, MAIN_NAV_COUNT)
  const moreItems = filtered.slice(MAIN_NAV_COUNT)

  const handleLogout = () => {
    setMoreOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <>
      <nav
        className={clsx(
          'fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around',
          'bg-card border-t border-border safe-area-bottom',
          'px-2 py-2 gap-1',
          className
        )}
      >
        {mainItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          const label = t(item.labelKey, { ns: item.namespace, defaultValue: item.path })
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-1.5 px-2 rounded-xl transition-colors active:scale-95',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-6 h-6 shrink-0" />
              <span className="text-[10px] font-medium truncate max-w-full">{label}</span>
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={clsx(
            'flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-1.5 px-2 rounded-xl',
            'text-muted-foreground hover:text-foreground transition-colors active:scale-95'
          )}
          aria-label="More menu"
        >
          <MoreHorizontal className="w-6 h-6 shrink-0" />
          <span className="text-[10px] font-medium">{t('more', { ns: 'common', defaultValue: 'Ещё' })}</span>
        </button>
      </nav>

      {moreOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
            aria-hidden
          />
          <div
            className="relative w-full max-h-[85vh] overflow-hidden bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl sm:max-w-sm flex flex-col"
            style={{ animation: 'slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">{t('more', { ns: 'common', defaultValue: 'Ещё' })}</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-0.5 p-3 overflow-y-auto">
              {moreItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                const label = t(item.labelKey, { ns: item.namespace, defaultValue: item.path })
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMoreOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] transition-colors',
                      isActive ? 'bg-primary/12 text-primary font-medium' : 'hover:bg-accent'
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{label}</span>
                  </Link>
                )
              })}
              <div className="border-t border-border mt-2 pt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-3 shrink-0" />
                  {t('logout', { ns: 'common', defaultValue: 'Logout' })}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
