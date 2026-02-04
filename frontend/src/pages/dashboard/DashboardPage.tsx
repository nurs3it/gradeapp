import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/lib/auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { useTranslationWithNamespaces } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gradesApi } from '@/shared/api/grades'
import { attendanceApi } from '@/shared/api/attendance'
import { coursesApi } from '@/shared/api/courses'
import { studentsApi } from '@/shared/api/students'
import { schoolsApi } from '@/shared/api/schools'
import { notificationsApi } from '@/shared/api/notifications'
import { useToast } from '@/shared/lib/ToastProvider'
import { TrendingUp, Users, BookOpen, Calendar, School, Plus, Link2 } from 'lucide-react'
import { ConnectToSchoolWidget } from '@/widgets/connect-to-school/ConnectToSchoolWidget'

export function DashboardPage() {
  const { t } = useTranslationWithNamespaces([namespaces.dashboard, namespaces.common])
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()
  const userRole = user?.roles?.[0]
  const isGuest = !user?.roles?.length
  const shownNotificationIds = useRef<Set<string>>(new Set())

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationsApi.list(),
    enabled: !!user?.id,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    const unread = (notifications as { id: string; type: string; read_flag: boolean; payload?: Record<string, unknown> }[]).filter(
      (n) => !n.read_flag && (n.type === 'school_join_approved' || n.type === 'school_join_rejected')
    )
    unread.forEach((n) => {
      if (shownNotificationIds.current.has(n.id)) return
      shownNotificationIds.current.add(n.id)
      const schoolName = (n.payload?.school_name as string) || ''
      if (n.type === 'school_join_approved') {
        toastSuccess(
          t('dashboard.notification_approved', { ns: namespaces.dashboard, school: schoolName, defaultValue: `Request to join ${schoolName} was approved.` })
        )
      } else {
        const reason = (n.payload?.rejection_reason as string) || ''
        toastError(
          t('dashboard.notification_rejected', { ns: namespaces.dashboard, school: schoolName, reason, defaultValue: `Request to join ${schoolName} was rejected.${reason ? ` ${reason}` : ''}` })
        )
      }
      markReadMutation.mutate(n.id)
    })
  }, [notifications, t, toastSuccess, toastError, markReadMutation])

  const { data: linkedSchoolData } = useQuery({
    queryKey: ['school', user?.linked_school],
    queryFn: () => (user?.linked_school ? schoolsApi.get(user.linked_school) : null),
    enabled: !!user?.linked_school && !isGuest,
  })

  const canCreateSchool =
    user?.is_superuser === true ||
    user?.roles?.includes('superadmin') ||
    user?.roles?.includes('schooladmin')
  const { data: schoolsData, isLoading: schoolsLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolsApi.list(),
    enabled: !!user && canCreateSchool,
  })
  const schools = Array.isArray(schoolsData) ? schoolsData : (schoolsData?.results ?? [])
  const hasNoSchools = schools.length === 0
  const showCreateSchoolWidget = canCreateSchool && (schoolsLoading || hasNoSchools)

  // Fetch statistics based on user role
  const { data: gradeStats } = useQuery({
    queryKey: ['grade-statistics', user?.id],
    queryFn: () => gradesApi.statistics(
      userRole === 'student' ? { student_id: user?.id } : undefined
    ),
    enabled: !!user && (userRole === 'teacher' || userRole === 'student'),
  })

  const { data: attendanceStats } = useQuery({
    queryKey: ['attendance-statistics', user?.id],
    queryFn: () => attendanceApi.statistics(
      userRole === 'student' ? { student_id: user?.id } : undefined
    ),
    enabled: !!user && (userRole === 'teacher' || userRole === 'student'),
  })

  const { data: coursesData } = useQuery({
    queryKey: ['courses', user?.id],
    queryFn: () => coursesApi.list(
      userRole === 'teacher' ? { teacher_id: user?.id } : undefined
    ),
    enabled: !!user && userRole === 'teacher',
  })

  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsApi.list(),
    enabled: !!user && (userRole === 'teacher' || userRole === 'schooladmin' || userRole === 'superadmin'),
  })

  const kpiCards = []

  if (userRole === 'teacher') {
    kpiCards.push(
      {
        title: t('kpi.courses', { ns: namespaces.dashboard, defaultValue: 'Courses' }),
        value: coursesData?.results?.length || 0,
        icon: BookOpen,
        color: 'blue',
      },
      {
        title: t('kpi.students', { ns: namespaces.dashboard, defaultValue: 'Students' }),
        value: studentsData?.results?.length || 0,
        icon: Users,
        color: 'green',
      },
      {
        title: t('kpi.average_grade', { ns: namespaces.dashboard, defaultValue: 'Average Grade' }),
        value: gradeStats?.average ? gradeStats.average.toFixed(1) : 'N/A',
        icon: TrendingUp,
        color: 'purple',
      },
      {
        title: t('kpi.attendance_rate', { ns: namespaces.dashboard, defaultValue: 'Attendance Rate' }),
        value: attendanceStats?.attendance_rate 
          ? `${(attendanceStats.attendance_rate * 100).toFixed(1)}%` 
          : 'N/A',
        icon: Calendar,
        color: 'orange',
      }
    )
  } else if (userRole === 'student') {
    kpiCards.push(
      {
        title: t('kpi.average_grade', { ns: namespaces.dashboard, defaultValue: 'Average Grade' }),
        value: gradeStats?.average ? gradeStats.average.toFixed(1) : 'N/A',
        icon: TrendingUp,
        color: 'blue',
      },
      {
        title: t('kpi.attendance_rate', { ns: namespaces.dashboard, defaultValue: 'Attendance Rate' }),
        value: attendanceStats?.attendance_rate 
          ? `${(attendanceStats.attendance_rate * 100).toFixed(1)}%` 
          : 'N/A',
        icon: Calendar,
        color: 'green',
      },
      {
        title: t('kpi.total_grades', { ns: namespaces.dashboard, defaultValue: 'Total Grades' }),
        value: gradeStats?.total || 0,
        icon: BookOpen,
        color: 'purple',
      }
    )
  }

  const isSuperadmin = user?.roles?.includes('superadmin') || user?.is_superuser === true
  const showConnectToSchool = isGuest && !isSuperadmin

  return (
    <div className="w-full">
      {/* Hide "Connect to school" for superadmin — they have access to all schools */}
      {showConnectToSchool && <ConnectToSchoolWidget />}
      {!isGuest && linkedSchoolData && (
        <Card className="mb-8 overflow-hidden border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link2 className="w-5 h-5 text-primary shrink-0" />
              <span className="text-foreground">
                {t('dashboard.connected_to_school', { ns: namespaces.dashboard, school: linkedSchoolData.name, defaultValue: `Connected to ${linkedSchoolData.name}` })}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(
                  userRole === 'director' ? '/admin/school-settings' : '/admin/schools'
                )
              }
            >
              {t('dashboard.go_to_school', { ns: namespaces.dashboard, defaultValue: 'School settings' })}
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {t('welcome', { 
            ns: namespaces.dashboard,
            name: user?.first_name || user?.email || t('user', { ns: namespaces.common })
          })}
        </h1>
        <p className="text-gray-600">
          {t('role', { 
            ns: namespaces.dashboard,
            role: user?.roles?.[0] || t('user', { ns: namespaces.common })
          })}
        </p>
      </div>

      {showCreateSchoolWidget && (
        <Card className="mb-8 overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-primary/8 to-transparent">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-primary/12 text-primary shrink-0">
                  <School className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">
                    {t('create_school_title', { ns: namespaces.dashboard, defaultValue: 'Создайте первую школу' })}
                  </h2>
                  <p className="text-muted-foreground text-[15px]">
                    {schoolsLoading
                      ? t('loading', { ns: namespaces.common, defaultValue: 'Загрузка...' })
                      : t('create_school_description', { ns: namespaces.dashboard, defaultValue: 'Добавьте школу, чтобы начать управление учебными годами, классами и данными.' })}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/admin/schools/new')}
                disabled={schoolsLoading}
                className="w-full sm:w-auto shrink-0 rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                {t('create_school_action', { ns: namespaces.dashboard, defaultValue: 'Создать школу' })}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {canCreateSchool && !showCreateSchoolWidget && (
        <div className="mb-6 flex justify-end">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/schools/new')}
            className="rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('create_school_action', { ns: namespaces.dashboard, defaultValue: 'Создать школу' })}
          </Button>
        </div>
      )}

      {kpiCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((kpi, index) => {
            const Icon = kpi.icon
            const colorClasses = {
              blue: 'bg-blue-50 text-blue-600',
              green: 'bg-green-50 text-green-600',
              purple: 'bg-purple-50 text-purple-600',
              orange: 'bg-orange-50 text-orange-600',
            }
            
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{kpi.title}</p>
                      <p className="text-3xl font-bold">{kpi.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${colorClasses[kpi.color as keyof typeof colorClasses]}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('title', { ns: namespaces.dashboard })}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {t('description', { 
              ns: namespaces.dashboard, 
              defaultValue: 'Welcome to your dashboard. Use the sidebar to navigate to different sections.' 
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

