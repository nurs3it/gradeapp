import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'
import { useAuth } from '@/shared/lib/auth'
import { useTranslation } from 'react-i18next'
import { lessonsApi, Lesson } from '@/shared/api/lessons'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, startOfWeek, addWeeks, subWeeks, eachDayOfInterval, getWeek } from 'date-fns'
import { ru, kk, enUS } from 'date-fns/locale'

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
]

const getLocale = (lang: string) => {
  switch (lang) {
    case 'ru': return ru
    case 'kz': return kk
    default: return enUS
  }
}

export function TeacherSchedulePage() {
  const { t } = useTranslationWithNamespace(namespaces.teacher)
  const { i18n } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const locale = getLocale(i18n.language || 'ru')

  const [currentWeek, setCurrentWeek] = useState(new Date())

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Monday
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const weekNumber = getWeek(currentWeek, { weekStartsOn: 1 })
  const weekKey = `${currentWeek.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`

  // Fetch lessons for the week
  const { data: lessonsData } = useQuery({
    queryKey: ['lessons', user?.id, weekKey],
    queryFn: () => lessonsApi.list({ 
      teacher_id: user?.id,
      week: weekKey 
    }),
    enabled: !!user,
  })

  const openAttendanceMutation = useMutation({
    mutationFn: (lessonId: string) => lessonsApi.openAttendance(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] })
    },
  })

  const closeAttendanceMutation = useMutation({
    mutationFn: (lessonId: string) => lessonsApi.closeAttendance(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] })
    },
  })

  // Group lessons by day and time
  const lessonsByDay: Record<string, Lesson[]> = {}
  weekDays.forEach((day) => {
    const dayKey = format(day, 'yyyy-MM-dd')
    lessonsByDay[dayKey] = []
  })

  lessonsData?.results?.forEach((lesson: Lesson) => {
    const dayKey = lesson.date
    if (lessonsByDay[dayKey]) {
      lessonsByDay[dayKey].push(lesson)
    }
  })

  // Sort lessons by time within each day
  Object.keys(lessonsByDay).forEach((day) => {
    lessonsByDay[day].sort((a, b) => a.start_time.localeCompare(b.start_time))
  })

  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1))
  }

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1))
  }

  const handleToday = () => {
    setCurrentWeek(new Date())
  }

  return (
    <div className="w-full">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('schedule.title')}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                <Calendar className="w-4 h-4 mr-2" />
                {t('schedule.today', { defaultValue: 'Сегодня' })}
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {format(weekStart, 'd MMM', { locale })} - {format(weekEnd, 'd MMM yyyy', { locale })}
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 text-left font-medium min-w-[100px]">
                    {t('schedule.time', { defaultValue: 'Время' })}
                  </th>
                  {weekDays.map((day) => (
                    <th key={day.toISOString()} className="border p-2 text-center font-medium min-w-[150px]">
                      <div className="font-semibold">
                        {format(day, 'EEEE', { locale })}
                      </div>
                      <div className="text-sm text-gray-600 font-normal">
                        {format(day, 'd MMM', { locale })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((timeSlot) => {
                  const [hour] = timeSlot.split(':')
                  const nextHour = `${(parseInt(hour) + 1).toString().padStart(2, '0')}:00`
                  
                  return (
                    <tr key={timeSlot}>
                      <td className="border p-2 text-center text-sm font-medium bg-gray-50">
                        {timeSlot} - {nextHour}
                      </td>
                      {weekDays.map((day) => {
                        const dayKey = format(day, 'yyyy-MM-dd')
                        const lessonsInSlot = lessonsByDay[dayKey]?.filter(
                          (lesson) => {
                            const lessonStart = lesson.start_time.substring(0, 5)
                            return lessonStart >= timeSlot && lessonStart < nextHour
                          }
                        ) || []

                        return (
                          <td key={day.toISOString()} className="border p-2 align-top">
                            {lessonsInSlot.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="mb-2 p-2 bg-blue-50 rounded border border-blue-200"
                              >
                                <div className="font-medium text-sm">
                                  {lesson.course_name || lesson.course}
                                </div>
                                {lesson.classroom && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {t('schedule.classroom', { defaultValue: 'Аудитория' })}: {lesson.classroom}
                                  </div>
                                )}
                                <div className="text-xs text-gray-600">
                                  {lesson.start_time.substring(0, 5)} - {lesson.end_time.substring(0, 5)}
                                </div>
                                {lesson.attendance_open_flag && (
                                  <div className="mt-1">
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                      {t('schedule.attendance_open', { defaultValue: 'Посещаемость открыта' })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {(!lessonsData?.results || lessonsData.results.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              {t('schedule.no_lessons', {
                defaultValue: 'На эту неделю нет уроков',
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
