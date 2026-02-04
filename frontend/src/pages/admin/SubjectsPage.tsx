import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Select, SelectOption } from '@/shared/ui/Select'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'
import { useAuth } from '@/shared/lib/auth'
import { useDialog } from '@/shared/lib/useDialog'
import { useToast } from '@/shared/lib/ToastProvider'
import { subjectsApi, staffApi, staffSubjectsApi, Subject, StaffSubject, Staff } from '@/shared/api/subjects'
import { schoolsApi } from '@/shared/api/schools'
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  UserPlus,
  Users,
} from 'lucide-react'

export function SubjectsPage() {
  const { t } = useTranslationWithNamespace(namespaces.admin)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { confirm, DialogComponent } = useDialog()
  const { success, error: showError } = useToast()

  const schoolId = user?.linked_school ?? ''
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const [subjectForm, setSubjectForm] = useState<Partial<Subject>>({
    name: '',
    code: '',
    description: '',
    default_credits: 1,
    school: '',
  })
  const [isCreatingSubject, setIsCreatingSubject] = useState(false)
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null)
  const [addTeacherSubjectId, setAddTeacherSubjectId] = useState<string | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState('')

  const { data: schoolsData } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolsApi.list(),
    enabled: !!user?.is_superuser || !!user?.roles?.includes('superadmin'),
  })
  const schoolsList = Array.isArray(schoolsData?.results) ? schoolsData.results : Array.isArray(schoolsData) ? schoolsData : []
  const effectiveSchoolId = schoolId || selectedSchoolId || (schoolsList[0]?.id ?? '')

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', effectiveSchoolId],
    queryFn: () => subjectsApi.list({ school_id: effectiveSchoolId || undefined }),
    enabled: !!effectiveSchoolId,
  })
  const subjectsList: Subject[] = Array.isArray(subjectsData?.results) ? subjectsData.results : Array.isArray(subjectsData) ? subjectsData : []

  const { data: staffData } = useQuery({
    queryKey: ['staff', effectiveSchoolId],
    queryFn: () => staffApi.list({ school_id: effectiveSchoolId || undefined }),
    enabled: !!effectiveSchoolId,
  })
  const staffList: Staff[] = Array.isArray(staffData?.results) ? staffData.results : Array.isArray(staffData) ? staffData : []

  const { data: staffSubjectsData } = useQuery({
    queryKey: ['staff-subjects', addTeacherSubjectId, expandedSubjectId],
    queryFn: async () => {
      const id = addTeacherSubjectId || expandedSubjectId
      if (!id) return { results: [] }
      return staffSubjectsApi.list({ subject_id: id })
    },
    enabled: !!(addTeacherSubjectId || expandedSubjectId),
  })
  const staffSubjectsList: StaffSubject[] = Array.isArray(staffSubjectsData?.results) ? staffSubjectsData.results : Array.isArray(staffSubjectsData) ? staffSubjectsData : []

  const createSubjectMutation = useMutation({
    mutationFn: (data: Partial<Subject>) => subjectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      setIsCreatingSubject(false)
      setSubjectForm({ name: '', code: '', description: '', default_credits: 1, school: effectiveSchoolId })
      success(t('subjects.created', { defaultValue: 'Предмет создан' }))
    },
    onError: () => {
      showError(t('subjects.create_error', { defaultValue: 'Ошибка при создании предмета' }))
    },
  })

  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Subject> }) => subjectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      setEditingSubjectId(null)
      success(t('subjects.updated', { defaultValue: 'Предмет обновлён' }))
    },
    onError: () => {
      showError(t('subjects.update_error', { defaultValue: 'Ошибка при обновлении предмета' }))
    },
  })

  const deleteSubjectMutation = useMutation({
    mutationFn: (id: string) => subjectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      success(t('subjects.deleted', { defaultValue: 'Предмет удалён' }))
    },
    onError: () => {
      showError(t('subjects.delete_error', { defaultValue: 'Ошибка при удалении предмета' }))
    },
  })

  const createStaffSubjectMutation = useMutation({
    mutationFn: (data: { staff: string; subject: string }) => staffSubjectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-subjects'] })
      setAddTeacherSubjectId(null)
      setSelectedStaffId('')
      success(t('subjects.teacher_added', { defaultValue: 'Учитель добавлен к предмету' }))
    },
    onError: () => {
      showError(t('subjects.teacher_add_error', { defaultValue: 'Ошибка при добавлении учителя' }))
    },
  })

  const deleteStaffSubjectMutation = useMutation({
    mutationFn: (id: string) => staffSubjectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-subjects'] })
      success(t('subjects.teacher_removed', { defaultValue: 'Учитель отвязан от предмета' }))
    },
    onError: () => {
      showError(t('subjects.teacher_remove_error', { defaultValue: 'Ошибка при отвязке учителя' }))
    },
  })

  const handleSaveSubject = () => {
    if (!subjectForm.name || !effectiveSchoolId) return
    const payload = {
      school: effectiveSchoolId,
      name: subjectForm.name,
      code: subjectForm.code || undefined,
      description: subjectForm.description || undefined,
      default_credits: subjectForm.default_credits ?? 1,
    }
    if (editingSubjectId) {
      updateSubjectMutation.mutate({ id: editingSubjectId, data: payload })
    } else {
      createSubjectMutation.mutate(payload)
    }
  }

  const handleAddTeacher = () => {
    if (!addTeacherSubjectId || !selectedStaffId) return
    createStaffSubjectMutation.mutate({ staff: selectedStaffId, subject: addTeacherSubjectId })
  }

  const staffOptions: SelectOption[] = staffList.map((s: Staff) => ({
    value: s.id,
    label: [s.user?.first_name, s.user?.last_name].filter(Boolean).join(' ') || s.user?.email || s.id,
  }))

  const staffAlreadyAssigned = new Set(
    staffSubjectsList.map((ss: StaffSubject) => ss.staff)
  )
  const staffOptionsAvailable = staffOptions.filter((o) => !staffAlreadyAssigned.has(o.value))

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {t('subjects.title', { defaultValue: 'Предметы' })}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('subjects.description', { defaultValue: 'Предметы школы и привязка учителей' })}
        </p>
      </div>

      {!user?.linked_school && schoolsList.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('subjects.school', { defaultValue: 'Школа' })}
          </label>
          <Select
            value={effectiveSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            options={[
              { value: '', label: t('subjects.select_school', { defaultValue: 'Выберите школу' }) },
              ...schoolsList.map((s: { id: string; name: string }) => ({ value: s.id, label: s.name })),
            ]}
          />
        </div>
      )}

      <Card>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-xl">
                {t('subjects.list_title', { defaultValue: 'Список предметов' })}
              </CardTitle>
            </div>
            {!isCreatingSubject && !editingSubjectId && effectiveSchoolId && (
              <Button
                size="sm"
                onClick={() => {
                  setIsCreatingSubject(true)
                  setEditingSubjectId(null)
                  setSubjectForm({
                    name: '',
                    code: '',
                    description: '',
                    default_credits: 1,
                    school: effectiveSchoolId,
                  })
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('subjects.add', { defaultValue: 'Добавить предмет' })}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {(isCreatingSubject || editingSubjectId) && (
            <div className="mb-6 p-5 bg-muted/30 rounded-xl border">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {editingSubjectId
                  ? t('subjects.edit', { defaultValue: 'Редактировать предмет' })
                  : t('subjects.add', { defaultValue: 'Добавить предмет' })}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-foreground">
                    {t('subjects.name', { defaultValue: 'Название' })} *
                  </label>
                  <Input
                    value={subjectForm.name ?? ''}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    placeholder={t('subjects.name_placeholder', { defaultValue: 'Математика' })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    {t('subjects.code', { defaultValue: 'Код' })}
                  </label>
                  <Input
                    value={subjectForm.code ?? ''}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    placeholder="MATH"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    {t('subjects.default_credits', { defaultValue: 'Зачётные единицы' })}
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={subjectForm.default_credits ?? 1}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, default_credits: parseInt(e.target.value, 10) || 1 })
                    }
                    className="h-10"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-foreground">
                    {t('subjects.description', { defaultValue: 'Описание' })}
                  </label>
                  <Input
                    value={subjectForm.description ?? ''}
                    onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                    placeholder={t('subjects.description_placeholder', { defaultValue: 'Описание (необязательно)' })}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button
                  size="sm"
                  onClick={handleSaveSubject}
                  disabled={createSubjectMutation.isPending || updateSubjectMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t('subjects.save', { defaultValue: 'Сохранить' })}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreatingSubject(false)
                    setEditingSubjectId(null)
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('subjects.cancel', { defaultValue: 'Отмена' })}
                </Button>
              </div>
            </div>
          )}

          {subjectsList.length === 0 && !isCreatingSubject ? (
            <p className="text-muted-foreground text-center py-8">
              {t('subjects.empty', { defaultValue: 'Нет предметов. Добавьте первый предмет.' })}
            </p>
          ) : (
            <ul className="space-y-3">
              {subjectsList.map((subject: Subject) => {
                const isExpanded = expandedSubjectId === subject.id
                const isAddingTeacher = addTeacherSubjectId === subject.id
                const subjectStaffSubjects = staffSubjectsList.filter((ss: StaffSubject) => ss.subject === subject.id)
                return (
                  <li key={subject.id} className="border rounded-xl bg-card overflow-hidden">
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30"
                      onClick={() => setExpandedSubjectId(isExpanded ? null : subject.id)}
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{subject.name}</p>
                          {subject.code && (
                            <p className="text-sm text-muted-foreground">{subject.code}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingSubjectId(subject.id)
                            setIsCreatingSubject(false)
                            setSubjectForm({
                              name: subject.name,
                              code: subject.code ?? '',
                              description: subject.description ?? '',
                              default_credits: subject.default_credits ?? 1,
                              school: subject.school,
                            })
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={async () => {
                            const ok = await confirm(
                              t('subjects.confirm_delete', { defaultValue: 'Удалить предмет?' }),
                              {
                                title: t('subjects.confirm_delete', { defaultValue: 'Удалить предмет?' }),
                                confirmText: t('subjects.delete', { defaultValue: 'Удалить' }),
                                cancelText: t('subjects.cancel', { defaultValue: 'Отмена' }),
                                variant: 'destructive',
                              }
                            )
                            if (ok) deleteSubjectMutation.mutate(subject.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t bg-muted/20 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {t('subjects.teachers', { defaultValue: 'Учителя' })}
                          </span>
                        </div>
                        {subjectStaffSubjects.length > 0 && (
                          <ul className="space-y-2 mb-4">
                            {subjectStaffSubjects.map((ss: StaffSubject) => {
                              const staff = staffList.find((s: Staff) => s.id === ss.staff)
                              const label = staff
                                ? [staff.user?.first_name, staff.user?.last_name].filter(Boolean).join(' ') || staff.user?.email
                                : ss.staff
                              return (
                                <li
                                  key={ss.id}
                                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-background border"
                                >
                                  <span className="text-sm text-foreground">{label}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => deleteStaffSubjectMutation.mutate(ss.id)}
                                    disabled={deleteStaffSubjectMutation.isPending}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                        {isAddingTeacher ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <Select
                              value={selectedStaffId}
                              onChange={(e) => setSelectedStaffId(e.target.value)}
                              options={[
                                { value: '', label: t('subjects.select_teacher', { defaultValue: 'Выберите учителя' }) },
                                ...staffOptionsAvailable,
                              ]}
                              className="min-w-[200px]"
                            />
                            <Button size="sm" onClick={handleAddTeacher} disabled={!selectedStaffId || createStaffSubjectMutation.isPending}>
                              <Save className="w-4 h-4 mr-2" />
                              {t('subjects.add_teacher', { defaultValue: 'Добавить' })}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAddTeacherSubjectId(null)
                                setSelectedStaffId('')
                              }}
                            >
                              <X className="w-4 h-4 mr-2" />
                              {t('subjects.cancel', { defaultValue: 'Отмена' })}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAddTeacherSubjectId(subject.id)
                              setSelectedStaffId('')
                            }}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            {t('subjects.add_teacher', { defaultValue: 'Добавить учителя' })}
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <DialogComponent />
    </div>
  )
}
