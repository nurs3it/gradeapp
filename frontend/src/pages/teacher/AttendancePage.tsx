import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { Select, SelectOption } from '@/shared/ui/Select'
import { Input } from '@/shared/ui/Input'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'
import { useAuth } from '@/shared/lib/auth'
import { useToast } from '@/shared/lib/ToastProvider'
import { attendanceApi, Attendance } from '@/shared/api/attendance'
import { lessonsApi, Lesson } from '@/shared/api/lessons'
import { coursesApi, Course } from '@/shared/api/courses'
import { classesApi, ClassGroup } from '@/shared/api/classes'
import { studentsApi, Student } from '@/shared/api/students'
import { 
  Calendar, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Save,
  TrendingUp,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'

type AttendanceStatus = 'present' | 'absent' | 'tardy' | 'excused'

export function TeacherAttendancePage() {
  const { t } = useTranslationWithNamespace(namespaces.teacher)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [selectedLesson, setSelectedLesson] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))

  // Attendance records state
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, {
    status: AttendanceStatus
    reason?: string
  }>>({})

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes', user?.linked_school],
    queryFn: () => classesApi.list({ school_id: user?.linked_school }),
    enabled: !!user?.linked_school,
  })

  // Fetch courses for selected class
  const { data: coursesData } = useQuery({
    queryKey: ['courses', selectedClass, user?.staff_profile?.id],
    queryFn: () => coursesApi.list({
      school_id: user?.linked_school,
      class_group_id: selectedClass,
      teacher_id: user?.staff_profile?.id,
    }),
    enabled: !!selectedClass && !!user?.staff_profile?.id,
  })

  // Fetch students for selected class
  const { data: studentsData } = useQuery({
    queryKey: ['students', selectedClass],
    queryFn: () => selectedClass ? classesApi.retrieveStudents(selectedClass) : Promise.resolve({ results: [] }),
    enabled: !!selectedClass,
  })

  // Fetch lessons for selected course and date
  const { data: lessonsData } = useQuery({
    queryKey: ['lessons', selectedCourse, selectedDate],
    queryFn: () => lessonsApi.list({
      course_id: selectedCourse,
      date: selectedDate,
    }),
    enabled: !!selectedCourse && !!selectedDate,
  })

  // Fetch existing attendance for selected lesson
  const { data: attendanceData } = useQuery({
    queryKey: ['attendance', selectedLesson],
    queryFn: () => attendanceApi.list({ lesson_id: selectedLesson }),
    enabled: !!selectedLesson,
    onSuccess: (data) => {
      const records: Record<string, { status: AttendanceStatus; reason?: string }> = {}
      const results = data?.results || data || []
      results.forEach((att: Attendance) => {
        records[att.student_id] = {
          status: att.status as AttendanceStatus,
          reason: att.reason,
        }
      })
      setAttendanceRecords(records)
    },
  })

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: (data: {
      lesson_id: string
      records: Array<{
        student_id: string
        status: string
        reason?: string
      }>
    }) => attendanceApi.mark(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] })
      success(t('attendance.saved', { defaultValue: 'Посещаемость сохранена' }))
    },
    onError: () => {
      showError(t('attendance.save_error', { defaultValue: 'Ошибка при сохранении посещаемости' }))
    },
  })

  // Get attendance statistics (aggregate for all students in class)
  const { data: statsData } = useQuery({
    queryKey: ['attendance-stats', selectedClass, selectedDate],
    queryFn: () => {
      if (!selectedClass) return Promise.resolve(null)
      return attendanceApi.statistics({
        date_from: selectedDate,
        date_to: selectedDate,
      })
    },
    enabled: !!selectedClass && !!selectedDate,
  })

  const classes: ClassGroup[] = Array.isArray(classesData?.results) ? classesData.results : Array.isArray(classesData) ? classesData : []
  const courses: Course[] = Array.isArray(coursesData?.results) ? coursesData.results : Array.isArray(coursesData) ? coursesData : []
  const students: Student[] = Array.isArray(studentsData?.results) ? studentsData.results : Array.isArray(studentsData) ? studentsData : []
  const lessons: Lesson[] = Array.isArray(lessonsData?.results) ? lessonsData.results : Array.isArray(lessonsData) ? lessonsData : []

  // Auto-select first lesson if available
  useMemo(() => {
    if (lessons.length > 0 && !selectedLesson) {
      setSelectedLesson(lessons[0].id)
    }
  }, [lessons, selectedLesson])

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords({
      ...attendanceRecords,
      [studentId]: {
        ...attendanceRecords[studentId],
        status,
      },
    })
  }

  const handleReasonChange = (studentId: string, reason: string) => {
    setAttendanceRecords({
      ...attendanceRecords,
      [studentId]: {
        ...attendanceRecords[studentId],
        reason,
      },
    })
  }

  const handleSave = () => {
    if (!selectedLesson) return

    const records = students.map((student: Student) => ({
      student_id: student.id,
      status: attendanceRecords[student.id]?.status || 'present',
      reason: attendanceRecords[student.id]?.reason || '',
    }))

    markAttendanceMutation.mutate({
      lesson_id: selectedLesson,
      records,
    })
  }

  const handleMarkAll = (status: AttendanceStatus) => {
    const newRecords: Record<string, { status: AttendanceStatus; reason?: string }> = {}
    students.forEach((student: Student) => {
      newRecords[student.id] = {
        status,
        reason: attendanceRecords[student.id]?.reason,
      }
    })
    setAttendanceRecords(newRecords)
  }

  const classOptions: SelectOption[] = classes.map((classGroup: ClassGroup) => ({
    value: classGroup.id,
    label: classGroup.name,
  }))

  const courseOptions: SelectOption[] = courses.map((course: Course) => ({
    value: course.id,
    label: course.name,
  }))

  const lessonOptions: SelectOption[] = lessons.map((lesson: Lesson) => ({
    value: lesson.id,
    label: `${lesson.course_name} - ${format(new Date(lesson.date), 'dd.MM.yyyy')} ${lesson.start_time}-${lesson.end_time}`,
  }))

  const selectedLessonData = lessons.find((l: Lesson) => l.id === selectedLesson)

  // Calculate statistics from current records
  const currentStats = useMemo(() => {
    const total = students.length
    const present = Object.values(attendanceRecords).filter(r => r.status === 'present').length
    const absent = Object.values(attendanceRecords).filter(r => r.status === 'absent').length
    const tardy = Object.values(attendanceRecords).filter(r => r.status === 'tardy').length
    const excused = Object.values(attendanceRecords).filter(r => r.status === 'excused').length

    return {
      total,
      present,
      absent,
      tardy,
      excused,
      attendance_rate: total > 0 ? (present / total) * 100 : 0,
    }
  }, [attendanceRecords, students])

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('attendance.title', { defaultValue: 'Посещаемость' })}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('attendance.description', { defaultValue: 'Отметьте посещаемость студентов' })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('attendance.select_class', { defaultValue: 'Класс' })}
              </label>
              <Select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value)
                  setSelectedCourse('')
                  setSelectedLesson('')
                }}
                options={classOptions}
                placeholder={t('attendance.select_class_placeholder', { defaultValue: 'Выберите класс' })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('attendance.select_course', { defaultValue: 'Предмет' })}
              </label>
              <Select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value)
                  setSelectedLesson('')
                }}
                options={courseOptions}
                placeholder={t('attendance.select_course_placeholder', { defaultValue: 'Выберите предмет' })}
                disabled={!selectedClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('attendance.date', { defaultValue: 'Дата' })}
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setSelectedLesson('')
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('attendance.select_lesson', { defaultValue: 'Урок' })}
              </label>
              <Select
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                options={lessonOptions}
                placeholder={t('attendance.select_lesson_placeholder', { defaultValue: 'Выберите урок' })}
                disabled={!selectedCourse || !selectedDate}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {selectedLesson && students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    {t('attendance.total', { defaultValue: 'Всего' })}
                  </p>
                  <p className="text-2xl font-bold">{currentStats.total}</p>
                </div>
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    {t('attendance.present', { defaultValue: 'Присутствуют' })}
                  </p>
                  <p className="text-2xl font-bold text-green-600">{currentStats.present}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    {t('attendance.absent', { defaultValue: 'Отсутствуют' })}
                  </p>
                  <p className="text-2xl font-bold text-red-600">{currentStats.absent}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    {t('attendance.late', { defaultValue: 'Опоздали' })}
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">{currentStats.tardy}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    {t('attendance.rate', { defaultValue: 'Посещаемость' })}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {currentStats.attendance_rate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance Table */}
      {selectedLesson && students.length > 0 ? (
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {selectedLessonData?.course_name} - {selectedLessonData?.date && format(new Date(selectedLessonData.date), 'dd.MM.yyyy')}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkAll('present')}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {t('attendance.mark_all_present', { defaultValue: 'Все присутствуют' })}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkAll('absent')}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {t('attendance.mark_all_absent', { defaultValue: 'Все отсутствуют' })}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={markAttendanceMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t('attendance.save', { defaultValue: 'Сохранить' })}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      {t('attendance.student', { defaultValue: 'Студент' })}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      {t('attendance.status', { defaultValue: 'Статус' })}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      {t('attendance.reason', { defaultValue: 'Причина' })}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((student: Student) => {
                    const record = attendanceRecords[student.id] || { status: 'present' as AttendanceStatus }
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {student.user?.get_full_name || student.student_number}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleStatusChange(student.id, 'present')}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                                record.status === 'present'
                                  ? 'bg-green-100 text-green-700 border-2 border-green-400'
                                  : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4 inline mr-1" />
                              {t('attendance.present', { defaultValue: 'Присутствует' })}
                            </button>
                            <button
                              onClick={() => handleStatusChange(student.id, 'absent')}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                                record.status === 'absent'
                                  ? 'bg-red-100 text-red-700 border-2 border-red-400'
                                  : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                              }`}
                            >
                              <XCircle className="w-4 h-4 inline mr-1" />
                              {t('attendance.absent', { defaultValue: 'Отсутствует' })}
                            </button>
                            <button
                              onClick={() => handleStatusChange(student.id, 'tardy')}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                                record.status === 'tardy'
                                  ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400'
                                  : 'bg-gray-100 text-gray-600 hover:bg-yellow-50'
                              }`}
                            >
                              <Clock className="w-4 h-4 inline mr-1" />
                              {t('attendance.late', { defaultValue: 'Опоздал' })}
                            </button>
                            <button
                              onClick={() => handleStatusChange(student.id, 'excused')}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                                record.status === 'excused'
                                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-400'
                                  : 'bg-gray-100 text-gray-600 hover:bg-blue-50'
                              }`}
                            >
                              <FileText className="w-4 h-4 inline mr-1" />
                              {t('attendance.excused', { defaultValue: 'Уважительная' })}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={record.reason || ''}
                            onChange={(e) => handleReasonChange(student.id, e.target.value)}
                            placeholder={t('attendance.reason_placeholder', { defaultValue: 'Причина отсутствия' })}
                            className="max-w-xs"
                            disabled={record.status === 'present'}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            {t('attendance.select_lesson_first', { defaultValue: 'Выберите класс, предмет и урок для отметки посещаемости' })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

