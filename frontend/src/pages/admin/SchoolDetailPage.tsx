import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Select, SelectOption } from '@/shared/ui/Select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/Tabs'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'
import { useDialog } from '@/shared/lib/useDialog'
import { useToast } from '@/shared/lib/ToastProvider'
import { schoolsApi, academicYearsApi, AcademicYear } from '@/shared/api/schools'
import { classesApi, ClassGroup, ClassGroupCreatePayload } from '@/shared/api/classes'
import {
  ArrowLeft,
  MapPin,
  Edit2,
  Trash2,
  Plus,
  Calendar,
  ChevronRight,
  Link2,
  Copy,
  GraduationCap,
  Users,
  Save,
  X,
} from 'lucide-react'
import { format } from 'date-fns'

export function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslationWithNamespace(namespaces.admin)
  const { confirm, DialogComponent } = useDialog()
  const { success, error: showError } = useToast()

  const { data: school, isLoading } = useQuery({
    queryKey: ['school', id],
    queryFn: () => schoolsApi.get(id!),
    enabled: !!id,
  })

  const deleteSchoolMutation = useMutation({
    mutationFn: (schoolId: string) => schoolsApi.delete(schoolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      success(t('schools.school_deleted', { defaultValue: 'Школа удалена' }))
      navigate('/admin/schools')
    },
    onError: () => {
      showError(t('schools.school_delete_error', { defaultValue: 'Ошибка при удалении школы' }))
    },
  })

  const deleteYearMutation = useMutation({
    mutationFn: (yearId: string) => academicYearsApi.delete(yearId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school', id] })
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
      success(t('schools.year_deleted', { defaultValue: 'Учебный год удален' }))
    },
    onError: () => {
      showError(t('schools.year_delete_error', { defaultValue: 'Ошибка при удалении учебного года' }))
    },
  })

  const canCreateSchool = true
  const years = school?.academic_years ?? []

  const [classForm, setClassForm] = useState<Partial<ClassGroupCreatePayload>>({
    name: '',
    grade_level: 10,
    academic_year: '',
  })
  const [isCreatingClass, setIsCreatingClass] = useState(false)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [classesYearFilter, setClassesYearFilter] = useState<string>('')

  const { data: classesData } = useQuery({
    queryKey: ['classes', id, classesYearFilter],
    queryFn: () =>
      classesApi.list({
        school_id: id || undefined,
        academic_year_id: classesYearFilter || undefined,
      }),
    enabled: !!id,
  })

  const classesList: ClassGroup[] = Array.isArray(classesData?.results)
    ? classesData.results
    : Array.isArray(classesData)
      ? classesData
      : []

  const createClassMutation = useMutation({
    mutationFn: (data: ClassGroupCreatePayload) => classesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setIsCreatingClass(false)
      setClassForm({ name: '', grade_level: 10, academic_year: '' })
      success(t('schools.class_created', { defaultValue: 'Класс создан' }))
    },
    onError: () => {
      showError(t('schools.class_create_error', { defaultValue: 'Ошибка при создании класса' }))
    },
  })

  const updateClassMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClassGroupCreatePayload> }) =>
      classesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setEditingClassId(null)
      setClassForm({ name: '', grade_level: 10, academic_year: '' })
      success(t('schools.class_updated', { defaultValue: 'Класс обновлен' }))
    },
    onError: () => {
      showError(t('schools.class_update_error', { defaultValue: 'Ошибка при обновлении класса' }))
    },
  })

  const deleteClassMutation = useMutation({
    mutationFn: (classId: string) => classesApi.delete(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      success(t('schools.class_deleted', { defaultValue: 'Класс удален' }))
    },
    onError: () => {
      showError(t('schools.class_delete_error', { defaultValue: 'Ошибка при удалении класса' }))
    },
  })

  const handleSaveClass = () => {
    if (!id || !classForm.name || !classForm.academic_year) return
    const payload: ClassGroupCreatePayload = {
      school: id,
      name: classForm.name,
      grade_level: Number(classForm.grade_level) || 10,
      academic_year: classForm.academic_year,
    }
    if (editingClassId) {
      updateClassMutation.mutate({ id: editingClassId, data: payload })
    } else {
      createClassMutation.mutate(payload)
    }
  }

  const handleEditClass = (cls: ClassGroup) => {
    setEditingClassId(cls.id)
    setClassForm({
      name: cls.name,
      grade_level: cls.grade_level,
      academic_year: cls.academic_year,
    })
    setIsCreatingClass(false)
  }

  if (!id) {
    navigate('/admin/schools')
    return null
  }

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary" />
      </div>
    )
  }

  if (!school) {
    return (
      <div className="w-full py-12 text-center text-muted-foreground">
        <p>{t('schools.no_schools', { defaultValue: 'Школа не найдена' })}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/schools')}>
          {t('schools.back_to_list', { defaultValue: 'К списку школ' })}
        </Button>
      </div>
    )
  }

  const cityName = school.city_detail?.name_ru || school.city_detail?.name || '—'

  return (
    <div className="w-full max-w-4xl">
      <Button
        variant="ghost"
        className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={() => navigate('/admin/schools')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('schools.back_to_list', { defaultValue: 'К списку школ' })}
      </Button>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="info">
            {t('schools.tab_info', { defaultValue: 'Информация' })}
          </TabsTrigger>
          <TabsTrigger value="years">
            {t('schools.tab_years', { defaultValue: 'Учебные года' })}
          </TabsTrigger>
          <TabsTrigger value="classes">
            {t('schools.tab_classes', { defaultValue: 'Классы' })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-0 space-y-6">
      {/* Hero card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/8 via-primary/4 to-transparent p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
                {school.name}
              </h1>
              {school.address && (
                <div className="flex items-center gap-2 text-muted-foreground text-[15px]">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{cityName}</span>
                  <span className="text-muted-foreground/70">·</span>
                  <span className="truncate">{school.address}</span>
                </div>
              )}
              {!school.address && (
                <div className="flex items-center gap-2 text-muted-foreground text-[15px]">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{cityName}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/schools/${id}/edit`)}
                className="rounded-xl"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                {t('schools.edit_school', { defaultValue: 'Редактировать' })}
              </Button>
              {canCreateSchool && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const confirmed = await confirm(
                      t('schools.confirm_delete', { defaultValue: 'Удалить школу?' }),
                      {
                        title: t('schools.confirm_delete', { defaultValue: 'Удалить школу?' }),
                        confirmText: t('schools.delete', { defaultValue: 'Удалить' }),
                        cancelText: t('schools.cancel', { defaultValue: 'Отмена' }),
                        variant: 'destructive',
                      }
                    )
                    if (confirmed) deleteSchoolMutation.mutate(id)
                  }}
                  disabled={deleteSchoolMutation.isPending}
                  className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Connection code (for admins/directors to share) */}
      {school.connection_code && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader className="border-b border-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Link2 className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-xl">
                {t('schools.connection_code_title', { defaultValue: 'Код подключения' })}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">
              {t('schools.connection_code_description', { defaultValue: 'Поделитесь этим кодом с пользователями, которые хотят подключиться к школе.' })}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-3xl font-mono font-bold tracking-[0.3em] text-foreground select-all">
                {school.connection_code}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(school.connection_code ?? '')
                    success(t('schools.connection_code_copied', { defaultValue: 'Код скопирован в буфер обмена' }))
                  } catch {
                    showError(t('schools.connection_code_copy_error', { defaultValue: 'Не удалось скопировать' }))
                  }
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                {t('schools.copy', { defaultValue: 'Копировать' })}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="years" className="mt-0">
      {/* Academic years */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              {t('schools.academic_years', { defaultValue: 'Учебные годы' })}
            </CardTitle>
            <Button
              size="sm"
              onClick={() => navigate(`/admin/schools/${id}/years/new`)}
              className="w-full sm:w-auto rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('schools.add_year', { defaultValue: 'Добавить учебный год' })}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {years.length > 0 ? (
            <ul className="space-y-2">
              {years.map((year: AcademicYear) => (
                <li
                  key={year.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/schools/${id}/years/${year.id}/edit`)}
                    className="flex items-center gap-3 text-left w-full min-w-0 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground flex flex-wrap items-center gap-2">
                        {year.name}
                        {year.is_current && (
                          <span className="text-xs bg-primary/12 text-primary px-2 py-0.5 rounded-lg">
                            {t('schools.current', { defaultValue: 'Текущий' })}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {format(new Date(year.start_date), 'd MMM yyyy')} —{' '}
                        {format(new Date(year.end_date), 'd MMM yyyy')}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0" />
                  </button>
                  <div className="flex gap-2 shrink-0 sm:pl-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/admin/schools/${id}/years/${year.id}/edit`)}
                      className="rounded-lg"
                      aria-label={t('schools.edit_year', { defaultValue: 'Редактировать' })}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        const confirmed = await confirm(
                          t('schools.confirm_delete_year', {
                            defaultValue: 'Удалить учебный год?',
                          }),
                          {
                            title: t('schools.confirm_delete_year', {
                              defaultValue: 'Удалить учебный год?',
                            }),
                            confirmText: t('schools.delete', { defaultValue: 'Удалить' }),
                            cancelText: t('schools.cancel', { defaultValue: 'Отмена' }),
                            variant: 'destructive',
                          }
                        )
                        if (confirmed) deleteYearMutation.mutate(year.id)
                      }}
                      disabled={deleteYearMutation.isPending}
                      className="rounded-lg text-destructive hover:bg-destructive/10"
                      aria-label={t('schools.delete', { defaultValue: 'Удалить' })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-10 text-center">
              <p className="text-muted-foreground text-[15px] mb-4">
                {t('schools.no_years', { defaultValue: 'Нет учебных годов' })}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/schools/${id}/years/new`)}
                className="rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('schools.add_year', { defaultValue: 'Добавить учебный год' })}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="classes" className="mt-0">
          <Card>
            <CardHeader className="border-b bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Users className="w-5 h-5 text-amber-600" />
                  </div>
                  <CardTitle className="text-xl">
                    {t('schools.classes', { defaultValue: 'Классы' })}
                  </CardTitle>
                </div>
                {!isCreatingClass && !editingClassId && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsCreatingClass(true)
                      setEditingClassId(null)
                      setClassForm({
                        name: '',
                        grade_level: 10,
                        academic_year: (classesYearFilter || years[0]?.id) ?? '',
                      })
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('schools.add_class', { defaultValue: 'Добавить класс' })}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('schools.filter_by_year', { defaultValue: 'Учебный год' })}
                </label>
                <Select
                  value={classesYearFilter}
                  onChange={(e) => setClassesYearFilter(e.target.value)}
                  options={[
                    { value: '', label: t('schools.all_years', { defaultValue: 'Все годы' }) },
                    ...years.map((y: AcademicYear) => ({ value: y.id, label: y.name })),
                  ]}
                />
              </div>

              {(isCreatingClass || editingClassId) && (
                <div className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    {editingClassId
                      ? t('schools.edit_class', { defaultValue: 'Редактировать класс' })
                      : t('schools.add_class', { defaultValue: 'Добавить класс' })}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('schools.class_name', { defaultValue: 'Название' })} *
                      </label>
                      <Input
                        value={classForm.name}
                        onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                        placeholder="10A"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('schools.grade_level', { defaultValue: 'Уровень (класс)' })} *
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        value={classForm.grade_level ?? ''}
                        onChange={(e) =>
                          setClassForm({ ...classForm, grade_level: parseInt(e.target.value, 10) || 10 })
                        }
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('schools.academic_year', { defaultValue: 'Учебный год' })} *
                      </label>
                      <Select
                        value={classForm.academic_year ?? ''}
                        onChange={(e) => setClassForm({ ...classForm, academic_year: e.target.value })}
                        options={[
                          { value: '', label: t('schools.select_year', { defaultValue: 'Выберите год' }) },
                          ...years.map((y: AcademicYear) => ({ value: y.id, label: y.name })),
                        ]}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button
                      size="sm"
                      onClick={handleSaveClass}
                      disabled={createClassMutation.isPending || updateClassMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {t('schools.save', { defaultValue: 'Сохранить' })}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsCreatingClass(false)
                        setEditingClassId(null)
                        setClassForm({ name: '', grade_level: 10, academic_year: '' })
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t('schools.cancel', { defaultValue: 'Отмена' })}
                    </Button>
                  </div>
                </div>
              )}

              {classesList.length > 0 ? (
                <div className="space-y-3">
                  {classesList.map((cls: ClassGroup) => (
                    <div
                      key={cls.id}
                      className="p-4 border rounded-lg hover:border-gray-300 transition-colors bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-amber-50 rounded-lg">
                            <GraduationCap className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{cls.name}</h4>
                            <p className="text-sm text-gray-600">
                              {t('schools.grade_level', { defaultValue: 'Уровень' })}: {cls.grade_level}
                              {cls.student_count != null && ` · ${cls.student_count} уч.`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClass(cls)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const confirmed = await confirm(
                                t('schools.confirm_delete_class', { defaultValue: 'Удалить класс?' }),
                                {
                                  title: t('schools.confirm_delete_class', { defaultValue: 'Удалить класс?' }),
                                  confirmText: t('schools.delete', { defaultValue: 'Удалить' }),
                                  cancelText: t('schools.cancel', { defaultValue: 'Отмена' }),
                                  variant: 'destructive',
                                }
                              )
                              if (confirmed) deleteClassMutation.mutate(cls.id)
                            }}
                            disabled={deleteClassMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t('schools.no_classes', { defaultValue: 'Нет классов. Добавьте учебный год и классы.' })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DialogComponent />
    </div>
  )
}
