import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { Select, SelectOption } from '@/shared/ui/Select'
import { Input } from '@/shared/ui/Input'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'
import { useAuth } from '@/shared/lib/auth'
import { useToast } from '@/shared/lib/ToastProvider'
import { useDialog } from '@/shared/lib/useDialog'
import { coursesApi, Course } from '@/shared/api/courses'
import { classesApi, ClassGroup } from '@/shared/api/classes'
import { studentsApi, Student } from '@/shared/api/students'
import { gradesApi, Grade } from '@/shared/api/grades'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { format } from 'date-fns'

interface GradeRow {
  student: Student
  grades: Record<string, Grade | null> // course_id -> Grade
}

export function TeacherJournalPage() {
  const { t } = useTranslationWithNamespace(namespaces.teacher)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { confirm, DialogComponent } = useDialog()
  const { success, error: showError } = useToast()

  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [editingGrade, setEditingGrade] = useState<{ studentId: string; courseId: string } | null>(null)
  const [gradeValue, setGradeValue] = useState<string>('')
  const [gradeComment, setGradeComment] = useState<string>('')

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesApi.list(),
  })

  // Fetch courses for teacher
  const { data: coursesData } = useQuery({
    queryKey: ['courses', user?.id],
    queryFn: () => coursesApi.list({ teacher_id: user?.id }),
    enabled: !!user,
  })

  // Fetch students for selected class
  const { data: studentsData } = useQuery({
    queryKey: ['class-students', selectedClassId],
    queryFn: () => classesApi.getStudents(selectedClassId),
    enabled: !!selectedClassId,
  })

  // Fetch grades for selected course and class
  const { data: gradesData } = useQuery({
    queryKey: ['grades', selectedCourseId, selectedClassId],
    queryFn: () => {
      if (!selectedCourseId || !selectedClassId) return { results: [] }
      // Fetch all grades for this course
      return gradesApi.list({ course_id: selectedCourseId })
    },
    enabled: !!selectedCourseId && !!selectedClassId,
  })

  // Create grade mutation
  const createGradeMutation = useMutation({
    mutationFn: (data: Partial<Grade>) => gradesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] })
      setEditingGrade(null)
      setGradeValue('')
      setGradeComment('')
      success(t('journal.grade_created', { defaultValue: 'Оценка добавлена' }))
    },
    onError: () => {
      showError(t('journal.grade_create_error', { defaultValue: 'Ошибка при добавлении оценки' }))
    },
  })

  // Update grade mutation
  const updateGradeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Grade> }) =>
      gradesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] })
      setEditingGrade(null)
      setGradeValue('')
      setGradeComment('')
      success(t('journal.grade_updated', { defaultValue: 'Оценка обновлена' }))
    },
    onError: () => {
      showError(t('journal.grade_update_error', { defaultValue: 'Ошибка при обновлении оценки' }))
    },
  })

  // Delete grade mutation
  const deleteGradeMutation = useMutation({
    mutationFn: (id: string) => gradesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] })
      success(t('journal.grade_deleted', { defaultValue: 'Оценка удалена' }))
    },
    onError: () => {
      showError(t('journal.grade_delete_error', { defaultValue: 'Ошибка при удалении оценки' }))
    },
  })

  // Build grade rows - filter students by selected class
  const filteredStudents = studentsData?.filter(
    (s: Student) => !selectedClassId || s.class_group === selectedClassId
  ) || []

  const gradeRows: GradeRow[] = filteredStudents.map((student: Student) => {
    const studentGrades: Record<string, Grade | null> = {}
    if (selectedCourseId && gradesData?.results) {
      // Find grade for this student and course
      const grade = gradesData.results.find(
        (g: Grade) => (g.student === student.id || g.student_id === student.id) && 
                      (g.course === selectedCourseId || g.course_id === selectedCourseId)
      )
      studentGrades[selectedCourseId] = grade || null
    }
    return { student, grades: studentGrades }
  })

  const handleEditGrade = (studentId: string, courseId: string) => {
    const existingGrade = gradeRows
      .find((r) => r.student.id === studentId)
      ?.grades[courseId]
    setEditingGrade({ studentId, courseId })
    setGradeValue(existingGrade?.value?.toString() || '')
    setGradeComment(existingGrade?.comment || '')
  }

  const handleSaveGrade = () => {
    if (!editingGrade || !gradeValue || !selectedCourseId) return

    const gradeData: Partial<Grade> = {
      student: editingGrade.studentId,
      course: selectedCourseId,
      value: parseFloat(gradeValue),
      scale: '10-point',
      type: 'homework',
      comment: gradeComment || undefined,
      date: new Date().toISOString().split('T')[0],
    }

    const existingGrade = gradeRows
      .find((r) => r.student.id === editingGrade.studentId)
      ?.grades[selectedCourseId]

    if (existingGrade) {
      updateGradeMutation.mutate({ id: existingGrade.id, data: gradeData })
    } else {
      createGradeMutation.mutate(gradeData)
    }
  }

  const handleDeleteGrade = async (gradeId: string) => {
    const confirmed = await confirm(
      t('journal.confirm_delete_grade', { defaultValue: 'Удалить оценку?' }),
      {
        title: t('journal.delete_grade', { defaultValue: 'Удаление оценки' }),
        confirmText: t('journal.delete', { defaultValue: 'Удалить' }),
        cancelText: t('journal.cancel', { defaultValue: 'Отмена' }),
        variant: 'destructive',
      }
    )
    if (confirmed) {
      deleteGradeMutation.mutate(gradeId)
    }
  }

  const classOptions: SelectOption[] =
    classesData?.results?.map((c: ClassGroup) => ({
      value: c.id,
      label: c.name,
    })) || []

  const courseOptions: SelectOption[] =
    coursesData?.results
      ?.filter((c: Course) => !selectedClassId || c.class_group_id === selectedClassId)
      .map((c: Course) => ({
        value: c.id,
        label: c.name,
      })) || []
  
  return (
      <div className="w-full">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('journal.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('journal.select_class', { defaultValue: 'Выберите класс' })}
              </label>
              <Select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value)
                  setSelectedCourseId('')
                }}
                options={classOptions}
                placeholder={t('journal.select_class_placeholder', { defaultValue: 'Выберите класс' })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('journal.select_course', { defaultValue: 'Выберите предмет' })}
              </label>
              <Select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                options={courseOptions}
                placeholder={t('journal.select_course_placeholder', { defaultValue: 'Выберите предмет' })}
                disabled={!selectedClassId}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClassId && selectedCourseId && gradeRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t('journal.grades_table', { defaultValue: 'Оценки' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">
                      {t('journal.student', { defaultValue: 'Студент' })}
                    </th>
                    <th className="text-left p-3 font-medium">
                      {t('journal.grade', { defaultValue: 'Оценка' })}
                    </th>
                    <th className="text-left p-3 font-medium">
                      {t('journal.comment', { defaultValue: 'Комментарий' })}
                    </th>
                    <th className="text-left p-3 font-medium">
                      {t('journal.date', { defaultValue: 'Дата' })}
                    </th>
                    <th className="text-left p-3 font-medium">
                      {t('journal.actions', { defaultValue: 'Действия' })}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gradeRows.map((row) => {
                    const grade = row.grades[selectedCourseId]
                    const isEditing =
                      editingGrade?.studentId === row.student.id &&
                      editingGrade?.courseId === selectedCourseId

                    return (
                      <tr key={row.student.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          {row.student.user?.first_name || ''} {row.student.user?.last_name || ''}
                          {!row.student.user && (
                            <span className="text-gray-400">({row.student.student_number})</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={gradeValue}
                              onChange={(e) => setGradeValue(e.target.value)}
                              className="w-20"
                              min="0"
                              max="10"
                              step="0.1"
                            />
                          ) : (
                            <span className="font-medium">
                              {grade?.value || '-'}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input
                              value={gradeComment}
                              onChange={(e) => setGradeComment(e.target.value)}
                              placeholder={t('journal.comment_placeholder', {
                                defaultValue: 'Комментарий',
                              })}
                            />
                          ) : (
                            <span className="text-sm text-gray-600">
                              {grade?.comment || '-'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {grade?.date
                            ? format(new Date(grade.date), 'dd.MM.yyyy')
                            : '-'}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={handleSaveGrade}
                                  disabled={
                                    createGradeMutation.isPending ||
                                    updateGradeMutation.isPending
                                  }
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingGrade(null)
                                    setGradeValue('')
                                    setGradeComment('')
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleEditGrade(row.student.id, selectedCourseId)
                                  }
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                {grade && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteGrade(grade.id)}
                                    disabled={deleteGradeMutation.isPending}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClassId && selectedCourseId && gradeRows.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            {t('journal.no_students', {
              defaultValue: 'В этом классе нет студентов',
            })}
          </CardContent>
        </Card>
      )}

      {!selectedClassId && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            {t('journal.select_class_first', {
              defaultValue: 'Выберите класс и предмет для просмотра журнала',
            })}
          </CardContent>
        </Card>
      )}

      <DialogComponent />
    </div>
  )
}
