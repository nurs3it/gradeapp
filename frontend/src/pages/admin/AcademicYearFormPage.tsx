import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'
import { useToast } from '@/shared/lib/ToastProvider'
import { schoolsApi, academicYearsApi, AcademicYear } from '@/shared/api/schools'
import { ArrowLeft, Save } from 'lucide-react'

/** Default start/end for new academic year: Sept 1 and May 30 */
function getDefaultAcademicYearDates(): { start_date: string; end_date: string; name: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startYear = month >= 9 ? year + 1 : year
  const endYear = startYear + 1
  return {
    start_date: `${startYear}-09-01`,
    end_date: `${endYear}-05-30`,
    name: `${startYear}-${String(endYear).slice(-2)}`,
  }
}

export function AcademicYearFormPage() {
  const { schoolId, id } = useParams<{ schoolId: string; id?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslationWithNamespace(namespaces.admin)
  const { success, error: showError } = useToast()

  const isEdit = Boolean(id)
  const defaults = getDefaultAcademicYearDates()
  const [form, setForm] = useState<Partial<AcademicYear>>({
    name: defaults.name,
    start_date: defaults.start_date,
    end_date: defaults.end_date,
    is_current: false,
  })

  const { data: school, isLoading: schoolLoading } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => schoolsApi.get(schoolId!),
    enabled: !!schoolId,
  })

  const { data: year, isLoading: yearLoading } = useQuery({
    queryKey: ['academic-year', id],
    queryFn: () => academicYearsApi.get(id!),
    enabled: isEdit && !!id,
  })

  useEffect(() => {
    if (year) {
      setForm({
        name: year.name,
        start_date: year.start_date,
        end_date: year.end_date,
        is_current: year.is_current,
      })
    }
  }, [year])

  const createMutation = useMutation({
    mutationFn: (data: Partial<AcademicYear> & { school: string }) =>
      academicYearsApi.create({ ...data, school: schoolId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
      queryClient.invalidateQueries({ queryKey: ['school', schoolId] })
      success(t('schools.year_created', { defaultValue: 'Учебный год создан' }))
      navigate(`/admin/schools/${schoolId}`)
    },
    onError: () => {
      showError(t('schools.year_create_error', { defaultValue: 'Ошибка при создании учебного года' }))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id: yearId, data }: { id: string; data: Partial<AcademicYear> }) =>
      academicYearsApi.update(yearId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
      queryClient.invalidateQueries({ queryKey: ['academic-year', id] })
      success(t('schools.year_updated', { defaultValue: 'Учебный год обновлен' }))
      navigate(`/admin/schools/${schoolId}`)
    },
    onError: () => {
      showError(t('schools.year_update_error', { defaultValue: 'Ошибка при обновлении учебного года' }))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name?.trim() || !form.start_date || !form.end_date || !schoolId) {
      showError(t('schools.fill_required', { defaultValue: 'Заполните обязательные поля' }))
      return
    }
    if (isEdit && id) {
      updateMutation.mutate({ id, data: form })
    } else {
      createMutation.mutate({ ...form, school: schoolId })
    }
  }

  const pending = createMutation.isPending || updateMutation.isPending
  const isLoading = schoolLoading || (isEdit && yearLoading)

  if (!schoolId || schoolLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary" />
      </div>
    )
  }

  if (isEdit && yearLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary" />
      </div>
    )
  }

  const backUrl = '/admin/schools'

  return (
    <div className="w-full max-w-3xl">
      <Button
        variant="ghost"
        className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={() => navigate(backUrl)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('schools.back_to_list', { defaultValue: 'К списку школ' })}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEdit
              ? t('schools.edit_year', { defaultValue: 'Редактировать учебный год' })
              : t('schools.add_year', { defaultValue: 'Добавить учебный год' })}
            {school?.name && (
              <span className="block text-sm font-normal text-muted-foreground mt-1">
                {school.name}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('schools.year_name', { defaultValue: 'Название' })} *
                </label>
                <Input
                  value={form.name ?? ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="2024-2025"
                  required
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="is_current"
                  checked={form.is_current ?? false}
                  onChange={(e) => setForm({ ...form, is_current: e.target.checked })}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <label htmlFor="is_current" className="text-sm font-medium text-foreground">
                  {t('schools.is_current', { defaultValue: 'Текущий учебный год' })}
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('schools.start_date', { defaultValue: 'Дата начала' })} *
                </label>
                <Input
                  type="date"
                  value={form.start_date ?? ''}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('schools.end_date', { defaultValue: 'Дата окончания' })} *
                </label>
                <Input
                  type="date"
                  value={form.end_date ?? ''}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button type="submit" disabled={pending}>
                <Save className="w-4 h-4 mr-2" />
                {t('schools.save', { defaultValue: 'Сохранить' })}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(backUrl)}
                disabled={pending}
              >
                {t('schools.cancel', { defaultValue: 'Отмена' })}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
