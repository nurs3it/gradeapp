import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Select, SelectOption } from '@/shared/ui/Select'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'
import { useAuth } from '@/shared/lib/auth'
import { gradesApi, Grade } from '@/shared/api/grades'
import { attendanceApi } from '@/shared/api/attendance'
import { studentsApi, Student } from '@/shared/api/students'
import { TrendingUp, Calendar, BookOpen, Users } from 'lucide-react'
import { format } from 'date-fns'

export function ParentOverviewPage() {
  const { t } = useTranslationWithNamespace(namespaces.parent)
  const { user } = useAuth()

  const [selectedStudentId, setSelectedStudentId] = useState<string>('')

  // Get children (students) for parent
  // Note: This would need an API endpoint to get parent's children
  // For now, we'll use the students API with parent filtering
  const { data: studentsData } = useQuery({
    queryKey: ['parent-children', user?.id],
    queryFn: async () => {
      // In a real implementation, there should be an endpoint like /api/users/me/children/
      // For now, we'll fetch all students and filter (not ideal, but works for demo)
      const response = await studentsApi.list()
      // Filter would be done on backend, but for now return all
      return response
    },
    enabled: !!user,
  })

  // Get grades for selected student
  const { data: gradesData } = useQuery({
    queryKey: ['student-grades', selectedStudentId],
    queryFn: () => gradesApi.list({ student_id: selectedStudentId }),
    enabled: !!selectedStudentId,
  })

  // Get grade statistics
  const { data: gradeStats } = useQuery({
    queryKey: ['student-grade-stats', selectedStudentId],
    queryFn: () => gradesApi.statistics({ student_id: selectedStudentId }),
    enabled: !!selectedStudentId,
  })

  // Get attendance statistics
  const { data: attendanceStats } = useQuery({
    queryKey: ['student-attendance-stats', selectedStudentId],
    queryFn: () => attendanceApi.statistics({ student_id: selectedStudentId }),
    enabled: !!selectedStudentId,
  })

  // Get recent attendance
  const { data: attendanceData } = useQuery({
    queryKey: ['student-attendance', selectedStudentId],
    queryFn: () => attendanceApi.list({ student_id: selectedStudentId }),
    enabled: !!selectedStudentId,
  })

  const children = studentsData?.results || []
  const recentGrades = gradesData?.results?.slice(0, 10) || []
  const recentAttendance = attendanceData?.results?.slice(0, 10) || []

  const studentOptions: SelectOption[] = children.map((child: Student) => ({
    value: child.id,
    label: `${child.user?.first_name || ''} ${child.user?.last_name || ''} (${child.class_group_name || 'N/A'})`,
  }))

  // Auto-select first child if available
  useEffect(() => {
    if (children.length > 0 && !selectedStudentId) {
      setSelectedStudentId(children[0].id)
    }
  }, [children, selectedStudentId])

  return (
    <div className="w-full">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('overview.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {children.length > 0 ? (
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('overview.select_child', { defaultValue: 'Выберите ребенка' })}
              </label>
              <Select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                options={studentOptions}
                placeholder={t('overview.select_child_placeholder', { defaultValue: 'Выберите ребенка' })}
              />
            </div>
          ) : (
            <p className="text-gray-600">
              {t('overview.no_children', { defaultValue: 'У вас нет привязанных детей' })}
            </p>
          )}
        </CardContent>
      </Card>

      {selectedStudentId && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('overview.average_grade', { defaultValue: 'Средний балл' })}
                    </p>
                    <p className="text-3xl font-bold">
                      {gradeStats?.average ? gradeStats.average.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('overview.total_grades', { defaultValue: 'Всего оценок' })}
                    </p>
                    <p className="text-3xl font-bold">
                      {gradeStats?.total || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                    <BookOpen className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('overview.attendance_rate', { defaultValue: 'Посещаемость' })}
                    </p>
                    <p className="text-3xl font-bold">
                      {attendanceStats?.attendance_rate
                        ? `${(attendanceStats.attendance_rate * 100).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 text-green-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('overview.class', { defaultValue: 'Класс' })}
                    </p>
                    <p className="text-3xl font-bold">
                      {children.find((c: Student) => c.id === selectedStudentId)?.class_group_name || 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Grades */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('overview.recent_grades', { defaultValue: 'Последние оценки' })}</CardTitle>
            </CardHeader>
            <CardContent>
              {recentGrades.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">
                          {t('overview.course', { defaultValue: 'Предмет' })}
                        </th>
                        <th className="text-left p-3 font-medium">
                          {t('overview.grade', { defaultValue: 'Оценка' })}
                        </th>
                        <th className="text-left p-3 font-medium">
                          {t('overview.date', { defaultValue: 'Дата' })}
                        </th>
                        <th className="text-left p-3 font-medium">
                          {t('overview.comment', { defaultValue: 'Комментарий' })}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentGrades.map((grade: Grade) => (
                        <tr key={grade.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{grade.course_name || grade.course}</td>
                          <td className="p-3">
                            <span className="font-medium">{grade.value}</span>
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {grade.date ? format(new Date(grade.date), 'dd.MM.yyyy') : '-'}
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {grade.comment || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  {t('overview.no_grades', { defaultValue: 'Нет оценок' })}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>{t('overview.recent_attendance', { defaultValue: 'Последняя посещаемость' })}</CardTitle>
            </CardHeader>
            <CardContent>
              {recentAttendance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">
                          {t('overview.date', { defaultValue: 'Дата' })}
                        </th>
                        <th className="text-left p-3 font-medium">
                          {t('overview.course', { defaultValue: 'Предмет' })}
                        </th>
                        <th className="text-left p-3 font-medium">
                          {t('overview.status', { defaultValue: 'Статус' })}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAttendance.map((attendance: any) => (
                        <tr key={attendance.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-sm">
                            {attendance.lesson?.date
                              ? format(new Date(attendance.lesson.date), 'dd.MM.yyyy')
                              : '-'}
                          </td>
                          <td className="p-3">
                            {attendance.lesson?.course_name || attendance.lesson?.course || '-'}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                attendance.status === 'present'
                                  ? 'bg-green-100 text-green-800'
                                  : attendance.status === 'absent'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {attendance.status === 'present'
                                ? t('overview.present', { defaultValue: 'Присутствовал' })
                                : attendance.status === 'absent'
                                ? t('overview.absent', { defaultValue: 'Отсутствовал' })
                                : t('overview.late', { defaultValue: 'Опоздал' })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  {t('overview.no_attendance', { defaultValue: 'Нет данных о посещаемости' })}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
