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
  PanelLeftClose,
  PanelLeft,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '@/shared/ui/Button'

type SidebarSection = 'main' | 'teacher' | 'school' | 'admin' | 'parent' | 'certificates' | 'system'

interface NavItem {
  path: string
  labelKey: string
  namespace: string
  icon: React.ComponentType<{ className?: string }>
  section: SidebarSection
  requiredPermissions: string[]
  roles: string[]
}

interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { t, ready } = useTranslation()

  const userPermissions: string[] = Array.isArray(user?.permissions) ? user.permissions : []
  const userRoles: string[] = Array.isArray(user?.roles) ? user.roles : []
  const effectiveRoles =
    user?.is_superuser === true ? [...new Set([...userRoles, 'superadmin'])] : userRoles
  const usePermissions = userPermissions.length > 0

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems: NavItem[] = [
    { path: '/dashboard', labelKey: 'title', namespace: 'dashboard', icon: LayoutDashboard, section: 'main', requiredPermissions: ['nav.dashboard'], roles: ['superadmin', 'schooladmin', 'director', 'teacher', 'student', 'parent'] },
    { path: '/teacher/journal', labelKey: 'journal.title', namespace: 'teacher', icon: BookOpen, section: 'teacher', requiredPermissions: ['nav.journal'], roles: ['teacher'] },
    { path: '/teacher/schedule', labelKey: 'schedule.title', namespace: 'teacher', icon: Calendar, section: 'teacher', requiredPermissions: ['nav.schedule_teacher'], roles: ['teacher'] },
    { path: '/teacher/attendance', labelKey: 'attendance.title', namespace: 'teacher', icon: UserCheck, section: 'teacher', requiredPermissions: ['nav.attendance_teacher'], roles: ['teacher'] },
    { path: '/admin/schools', labelKey: 'schools.title', namespace: 'admin', icon: School, section: 'school', requiredPermissions: ['nav.schools'], roles: ['superadmin', 'schooladmin'] },
    { path: '/admin/school-settings', labelKey: 'schools.settings', namespace: 'admin', icon: School, section: 'school', requiredPermissions: ['nav.school_settings'], roles: ['director'] },
    { path: '/admin/schedule', labelKey: 'schedule.title', namespace: 'admin', icon: Calendar, section: 'admin', requiredPermissions: ['nav.schedule_admin'], roles: ['superadmin', 'schooladmin', 'director', 'registrar', 'scheduler'] },
    { path: '/admin/import-export', labelKey: 'import_export.title', namespace: 'admin', icon: FileSpreadsheet, section: 'admin', requiredPermissions: ['nav.import_export'], roles: ['superadmin', 'schooladmin', 'director'] },
    { path: '/admin/subjects', labelKey: 'subjects.title', namespace: 'admin', icon: BookOpen, section: 'admin', requiredPermissions: [], roles: ['superadmin', 'schooladmin', 'director'] },
    { path: '/admin/join-requests', labelKey: 'join_requests.title', namespace: 'admin', icon: UserPlus, section: 'admin', requiredPermissions: [], roles: ['schooladmin', 'director'] },
    { path: '/parent/overview', labelKey: 'overview.title', namespace: 'parent', icon: GraduationCap, section: 'parent', requiredPermissions: ['nav.parent_overview'], roles: ['parent'] },
    { path: '/certificates', labelKey: 'title', namespace: 'certificates', icon: Award, section: 'certificates', requiredPermissions: ['nav.certificates'], roles: ['superadmin', 'schooladmin', 'director', 'teacher'] },
    { path: '/admin/permissions', labelKey: 'permissions.title', namespace: 'admin', icon: ShieldCheck, section: 'system', requiredPermissions: ['permissions.manage'], roles: ['superadmin'] },
  ]

  const isGuest = !effectiveRoles.length
  const filteredNavItems = navItems.filter((item) => {
    if (isGuest) return item.path === '/dashboard'
    if (usePermissions && item.requiredPermissions.length > 0) {
      return item.requiredPermissions.every((p) => userPermissions.includes(p))
    }
    return item.roles.some((role) => effectiveRoles.includes(role))
  })

  const sectionOrder: SidebarSection[] = ['main', 'teacher', 'school', 'admin', 'parent', 'certificates', 'system']
  const sectionLabelKey: Record<SidebarSection, string> = {
    main: 'sidebar.main',
    teacher: 'sidebar.teacher',
    school: 'sidebar.school',
    admin: 'sidebar.admin',
    parent: 'sidebar.parent',
    certificates: 'sidebar.certificates',
    system: 'sidebar.system',
  }
  const itemsBySection = sectionOrder.map((section) => ({
    section,
    items: filteredNavItems.filter((item) => item.section === section),
  })).filter((g) => g.items.length > 0)

  const sidebarContent = (
    <>
      <div className={clsx('flex items-center border-b border-border lg:border-0', collapsed ? 'justify-center p-3 lg:pb-3' : 'justify-between p-4 lg:pb-4')}>
        {!collapsed && <span className="font-semibold text-foreground truncate">Menu</span>}
        {onCollapsedChange && (
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            className="p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground active:opacity-80"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        )}
      </div>
      <nav className={clsx('flex-1 overflow-y-auto', collapsed ? 'p-2 space-y-0.5' : 'p-4 lg:px-3')}>
        {!ready ? (
          filteredNavItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.path} className={clsx('flex items-center rounded-xl', collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5')}>
                <Icon className="w-5 h-5 text-muted-foreground animate-pulse shrink-0" />
                {!collapsed && <span className="h-4 w-24 bg-muted rounded-lg animate-pulse" />}
              </div>
            )
          })
        ) : (
          itemsBySection.map(({ section, items }) => (
            <div key={section} className={clsx(collapsed ? 'space-y-0.5' : 'mb-4 last:mb-0')}>
              {!collapsed && (
                <div className="px-3 py-1.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground truncate block">
                    {t(sectionLabelKey[section], { ns: 'common', defaultValue: section })}
                  </span>
                </div>
              )}
              <div className={clsx(collapsed ? 'space-y-0.5' : 'space-y-0.5')}>
                {items.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  const label = t(item.labelKey, { ns: item.namespace, defaultValue: item.labelKey })
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={clsx(
                        'flex items-center rounded-xl text-[15px] transition-colors active:scale-[0.98] min-w-0',
                        collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                        isActive
                          ? 'bg-primary/12 text-primary font-medium'
                          : 'text-foreground/90 hover:bg-accent'
                      )}
                      title={label}
                    >
                      <Icon className="w-5 h-5 shrink-0 text-inherit" />
                      {!collapsed && (
                        <span className="truncate block min-w-0" title={label}>
                          {label}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </nav>
      <div className={clsx('border-t border-border', collapsed ? 'p-2' : 'p-4')}>
        <Button
          variant="ghost"
          className={clsx(
            'w-full text-foreground/90 hover:bg-destructive/10 hover:text-destructive',
            collapsed ? 'justify-center p-2.5' : 'justify-start'
          )}
          onClick={handleLogout}
        >
          <LogOut className={clsx('w-5 h-5 shrink-0', !collapsed && 'mr-3')} />
          {!collapsed && <span className="truncate block min-w-0">{t('logout', { ns: 'common', defaultValue: 'Logout' })}</span>}
        </Button>
      </div>
    </>
  )

  return (
    <aside
      className={clsx(
        'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:transition-[width] duration-200',
        'bg-card border-r border-border min-h-screen',
        collapsed ? 'lg:w-16' : 'lg:w-64'
      )}
    >
      {sidebarContent}
    </aside>
  )
}
