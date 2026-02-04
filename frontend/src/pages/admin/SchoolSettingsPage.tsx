import { useState, useEffect } from 'react'
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
import { schoolsApi, academicYearsApi, citiesApi, School, AcademicYear } from '@/shared/api/schools'
import { classesApi, ClassGroup, ClassGroupCreatePayload } from '@/shared/api/classes'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/Tabs'
import { 
  Save, 
  Building2, 
  MapPin, 
  Calendar, 
  Languages, 
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Copy,
  Link2,
  Users
} from 'lucide-react'

export function SchoolSettingsPage() {
  const { t } = useTranslationWithNamespace(namespaces.admin)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { confirm, DialogComponent } = useDialog()
  const { success, error: showError } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [schoolForm, setSchoolForm] = useState<Partial<School> & { city?: string }>({
    name: '',
    city: '',
    address: '',
    grading_system: { scale: '10-point', min: 0, max: 10 },
    languages_supported: ['ru', 'kz', 'en'],
  })

  const [yearForm, setYearForm] = useState<Partial<AcademicYear>>({
    name: '',
    start_date: '',
    end_date: '',
    is_current: false,
  })

  const [isCreatingYear, setIsCreatingYear] = useState(false)
  const [editingYearId, setEditingYearId] = useState<string | null>(null)

  const [classForm, setClassForm] = useState<Partial<ClassGroupCreatePayload>>({
    name: '',
    grade_level: 10,
    academic_year: '',
  })
  const [isCreatingClass, setIsCreatingClass] = useState(false)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [classesYearFilter, setClassesYearFilter] = useState<string>('')

  // Fetch director's school
  const { data: schoolData, isLoading } = useQuery({
    queryKey: ['school', user?.linked_school],
    queryFn: () => {
      if (!user?.linked_school) return null
      return schoolsApi.get(user.linked_school)
    },
    enabled: !!user?.linked_school,
  })

  // Fetch academic years
  const { data: yearsData } = useQuery({
    queryKey: ['academic-years', user?.linked_school],
    queryFn: () => academicYearsApi.list({ school_id: user?.linked_school || undefined }),
    enabled: !!user?.linked_school,
  })

  const { data: citiesList } = useQuery({
    queryKey: ['cities'],
    queryFn: () => citiesApi.list(),
  })

  const { data: classesData } = useQuery({
    queryKey: ['classes', user?.linked_school, classesYearFilter],
    queryFn: () =>
      classesApi.list({
        school_id: user?.linked_school || undefined,
        academic_year_id: classesYearFilter || undefined,
      }),
    enabled: !!user?.linked_school,
  })

  const classesList: ClassGroup[] = Array.isArray(classesData?.results)
    ? classesData.results
    : Array.isArray(classesData)
      ? classesData
      : []

  const citiesArray = Array.isArray(citiesList) ? citiesList : (citiesList?.results ?? [])
  const citiesOptions: SelectOption[] = citiesArray.map((c: { id: string; name: string; name_ru?: string }) => ({
    value: String(c.id),
    label: c.name_ru || c.name || String(c.id),
  }))

  // Initialize form when school data loads
  useEffect(() => {
    if (schoolData && !isEditing) {
      setSchoolForm({
        name: schoolData.name || '',
        city: schoolData.city != null ? String(schoolData.city) : '',
        address: schoolData.address || '',
        grading_system: schoolData.grading_system || { scale: '10-point', min: 0, max: 10 },
        languages_supported: schoolData.languages_supported || ['ru', 'kz', 'en'],
      })
    }
  }, [schoolData, isEditing])

  // Update school mutation
  const updateSchoolMutation = useMutation({
    mutationFn: (data: Partial<School>) => {
      if (!user?.linked_school) throw new Error('No school linked')
      return schoolsApi.update(user.linked_school, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school'] })
      setIsEditing(false)
      success(t('schools.school_updated', { defaultValue: 'Школа обновлена' }))
    },
    onError: () => {
      showError(t('schools.school_update_error', { defaultValue: 'Ошибка при обновлении школы' }))
    },
  })

  // Create academic year mutation
  const createYearMutation = useMutation({
    mutationFn: (data: Partial<AcademicYear>) => academicYearsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
      setIsCreatingYear(false)
      resetYearForm()
    },
  })

  // Update academic year mutation
  const updateYearMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AcademicYear> }) =>
      academicYearsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
      setEditingYearId(null)
      resetYearForm()
      success(t('schools.year_updated', { defaultValue: 'Учебный год обновлен' }))
    },
    onError: () => {
      showError(t('schools.year_update_error', { defaultValue: 'Ошибка при обновлении учебного года' }))
    },
  })

  // Delete academic year mutation
  const deleteYearMutation = useMutation({
    mutationFn: (id: string) => academicYearsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
      success(t('schools.year_deleted', { defaultValue: 'Учебный год удален' }))
    },
    onError: () => {
      showError(t('schools.year_delete_error', { defaultValue: 'Ошибка при удалении учебного года' }))
    },
  })

  const resetYearForm = () => {
    setYearForm({
      name: '',
      start_date: '',
      end_date: '',
      is_current: false,
    })
  }

  const createClassMutation = useMutation({
    mutationFn: (data: ClassGroupCreatePayload) => classesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      setIsCreatingClass(false)
      resetClassForm()
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
      resetClassForm()
      success(t('schools.class_updated', { defaultValue: 'Класс обновлен' }))
    },
    onError: () => {
      showError(t('schools.class_update_error', { defaultValue: 'Ошибка при обновлении класса' }))
    },
  })

  const deleteClassMutation = useMutation({
    mutationFn: (id: string) => classesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      success(t('schools.class_deleted', { defaultValue: 'Класс удален' }))
    },
    onError: () => {
      showError(t('schools.class_delete_error', { defaultValue: 'Ошибка при удалении класса' }))
    },
  })

  const resetClassForm = () => {
    setClassForm({ name: '', grade_level: 10, academic_year: '' })
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

  const handleSaveClass = () => {
    if (!user?.linked_school || !classForm.name || !classForm.academic_year) return
    const payload: ClassGroupCreatePayload = {
      school: user.linked_school,
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

  const handleEditYear = (year: AcademicYear) => {
    setEditingYearId(year.id)
    setYearForm({
      name: year.name,
      start_date: year.start_date,
      end_date: year.end_date,
      is_current: year.is_current,
    })
    setIsCreatingYear(false)
  }

  const handleSaveYear = () => {
    if (!yearForm.name || !yearForm.start_date || !yearForm.end_date || !user?.linked_school) {
      return
    }

    const data = {
      ...yearForm,
      school: user.linked_school,
    }

    if (editingYearId) {
      updateYearMutation.mutate({ id: editingYearId, data })
    } else {
      createYearMutation.mutate(data)
    }
  }

  const handleSaveSchool = () => {
    if (!schoolForm.name || !schoolForm.city) {
      return
    }
    updateSchoolMutation.mutate(schoolForm)
  }

  const handleLanguageToggle = (lang: string) => {
    const current = schoolForm.languages_supported || []
    if (current.includes(lang)) {
      setSchoolForm({
        ...schoolForm,
        languages_supported: current.filter((l) => l !== lang),
      })
    } else {
      setSchoolForm({
        ...schoolForm,
        languages_supported: [...current, lang],
      })
    }
  }

  const languageOptions = [
    { code: 'ru', label: 'Русский' },
    { code: 'kz', label: 'Қазақша' },
    { code: 'en', label: 'English' },
  ]

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('schools.loading', { defaultValue: 'Загрузка...' })}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!schoolData) {
    return (
      <div className="w-full">
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            {t('schools.no_school_linked', { defaultValue: 'Школа не привязана к вашему аккаунту' })}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('schools.settings', { defaultValue: 'Настройки школы' })}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('schools.settings_description', { defaultValue: 'Управление информацией о школе' })}
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            {t('schools.edit', { defaultValue: 'Редактировать' })}
          </Button>
        )}
      </div>

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

        <TabsContent value="info" className="space-y-6 mt-0">
      {/* Connection code (read-only) */}
      {schoolData.connection_code && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader className="border-b border-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Link2 className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-xl">
                {t('schools.connection_code_title', { defaultValue: 'Connection code' })}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">
              {t('schools.connection_code_description', { defaultValue: 'Share this code with users who want to join your school.' })}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-3xl font-mono font-bold tracking-[0.3em] text-foreground select-all">
                {schoolData.connection_code}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(schoolData.connection_code ?? '')
                    success(t('schools.connection_code_copied', { defaultValue: 'Code copied to clipboard' }))
                  } catch {
                    showError(t('schools.connection_code_copy_error', { defaultValue: 'Failed to copy' }))
                  }
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                {t('schools.copy', { defaultValue: 'Copy' })}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* School Information Card */}
      <Card className="border-2">
        <CardHeader className="border-b bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <CardTitle className="text-xl">
              {t('schools.basic_info', { defaultValue: 'Основная информация' })}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('schools.name', { defaultValue: 'Название' })} *
                  </label>
                  <Input
                    value={schoolForm.name}
                    onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                    placeholder={t('schools.name_placeholder', { defaultValue: 'Название школы' })}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('schools.city', { defaultValue: 'Город' })} *
                  </label>
                  <Select
                    value={schoolForm.city ?? ''}
                    onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })}
                    options={[{ value: '', label: t('schools.city_placeholder', { defaultValue: 'Выберите город' }) }, ...citiesOptions]}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MapPin className="w-4 h-4" />
                    {t('schools.address', { defaultValue: 'Адрес' })}
                  </label>
                  <Input
                    value={schoolForm.address}
                    onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                    placeholder={t('schools.address_placeholder', { defaultValue: 'Адрес' })}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Languages className="w-4 h-4" />
                  {t('schools.languages', { defaultValue: 'Поддерживаемые языки' })}
                </label>
                <div className="flex gap-3">
                  {languageOptions.map((lang) => {
                    const isSelected = schoolForm.languages_supported?.includes(lang.code)
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleLanguageToggle(lang.code)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                        {lang.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleSaveSchool}
                  disabled={updateSchoolMutation.isPending}
                  className="min-w-[120px]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t('schools.save', { defaultValue: 'Сохранить' })}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    // Reset form to original data
                    if (schoolData) {
                      setSchoolForm({
                        name: schoolData.name || '',
                        city: schoolData.city != null ? String(schoolData.city) : '',
                        address: schoolData.address || '',
                        grading_system: schoolData.grading_system || { scale: '10-point', min: 0, max: 10 },
                        languages_supported: schoolData.languages_supported || ['ru', 'kz', 'en'],
                      })
                    }
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('schools.cancel', { defaultValue: 'Отмена' })}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    {t('schools.name', { defaultValue: 'Название' })}
                  </p>
                  <p className="text-base font-medium text-gray-900">{schoolData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    {t('schools.city', { defaultValue: 'Город' })}
                  </p>
                  <p className="text-base font-medium text-gray-900">
                    {schoolData.city_detail?.name_ru || schoolData.city_detail?.name || '—'}
                  </p>
                </div>
                {schoolData.address && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      {t('schools.address', { defaultValue: 'Адрес' })}
                    </p>
                    <p className="text-base font-medium text-gray-900">{schoolData.address}</p>
                  </div>
                )}
              </div>

              {schoolData.languages_supported && schoolData.languages_supported.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    {t('schools.languages', { defaultValue: 'Поддерживаемые языки' })}
                  </p>
                  <div className="flex gap-2">
                    {schoolData.languages_supported.map((lang: string) => {
                      const langInfo = languageOptions.find((l) => l.code === lang)
                      return (
                        <span
                          key={lang}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium"
                        >
                          {langInfo?.label || lang}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="years" className="mt-0">
      {/* Academic Years Card */}
      <Card className="border-2">
        <CardHeader className="border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <CardTitle className="text-xl">
                {t('schools.academic_years', { defaultValue: 'Учебные годы' })}
              </CardTitle>
            </div>
            {!isCreatingYear && !editingYearId && (
              <Button
                size="sm"
                onClick={() => {
                  setIsCreatingYear(true)
                  resetYearForm()
                  setEditingYearId(null)
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('schools.add_year', { defaultValue: 'Добавить' })}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Create/Edit Year Form */}
          {(isCreatingYear || editingYearId) && (
            <div className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                {editingYearId
                  ? t('schools.edit_year', { defaultValue: 'Редактировать учебный год' })
                  : t('schools.add_year', { defaultValue: 'Добавить учебный год' })}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('schools.year_name', { defaultValue: 'Название' })} *
                  </label>
                  <Input
                    value={yearForm.name}
                    onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                    placeholder="2024-2025"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={yearForm.is_current}
                      onChange={(e) => setYearForm({ ...yearForm, is_current: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {t('schools.is_current', { defaultValue: 'Текущий учебный год' })}
                    </span>
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('schools.start_date', { defaultValue: 'Дата начала' })} *
                  </label>
                  <Input
                    type="date"
                    value={yearForm.start_date}
                    onChange={(e) => setYearForm({ ...yearForm, start_date: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('schools.end_date', { defaultValue: 'Дата окончания' })} *
                  </label>
                  <Input
                    type="date"
                    value={yearForm.end_date}
                    onChange={(e) => setYearForm({ ...yearForm, end_date: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button
                  size="sm"
                  onClick={handleSaveYear}
                  disabled={createYearMutation.isPending || updateYearMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t('schools.save', { defaultValue: 'Сохранить' })}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreatingYear(false)
                    setEditingYearId(null)
                    resetYearForm()
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('schools.cancel', { defaultValue: 'Отмена' })}
                </Button>
              </div>
            </div>
          )}

          {/* Years List */}
          {yearsData?.results && yearsData.results.length > 0 ? (
            <div className="space-y-3">
              {yearsData.results.map((year: AcademicYear) => (
                <div
                  key={year.id}
                  className="p-4 border rounded-lg hover:border-gray-300 transition-colors bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <GraduationCap className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{year.name}</h4>
                          {year.is_current && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                              {t('schools.current', { defaultValue: 'Текущий' })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {year.start_date} - {year.end_date}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditYear(year)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const confirmed = await confirm(
                            t('schools.confirm_delete_year', { defaultValue: 'Удалить учебный год?' }),
                            {
                              title: t('schools.confirm_delete_year', { defaultValue: 'Удалить учебный год?' }),
                              confirmText: t('schools.delete', { defaultValue: 'Удалить' }),
                              cancelText: t('schools.cancel', { defaultValue: 'Отмена' }),
                              variant: 'destructive',
                            }
                          )
                          if (confirmed) {
                            deleteYearMutation.mutate(year.id)
                          }
                        }}
                        disabled={deleteYearMutation.isPending}
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
              {t('schools.no_years', { defaultValue: 'Нет учебных годов' })}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="classes" className="mt-0">
          <Card className="border-2">
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
                      resetClassForm()
                      setEditingClassId(null)
                      setClassForm((f) => ({ ...f, academic_year: classesYearFilter || (yearsData?.results?.[0]?.id ?? '') }))
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
                    ...(yearsData?.results ?? []).map((y: AcademicYear) => ({
                      value: y.id,
                      label: y.name,
                    })),
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
                          ...(yearsData?.results ?? []).map((y: AcademicYear) => ({
                            value: y.id,
                            label: y.name,
                          })),
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
                        resetClassForm()
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

