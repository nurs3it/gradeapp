import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Select, SelectOption } from '@/shared/ui/Select'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'
import { useToast } from '@/shared/lib/ToastProvider'
import { useAuth } from '@/shared/lib/auth'
import { schoolsApi, citiesApi, School, City } from '@/shared/api/schools'
import { usersApi } from '@/shared/api/users'
import { ArrowLeft, Save } from 'lucide-react'

const defaultForm: Partial<School> = {
  name: '',
  city: null,
  address: '',
  grading_system: { scale: '10-point', min: 0, max: 10 },
  languages_supported: ['ru', 'kz', 'en'],
}

export function SchoolFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslationWithNamespace(namespaces.admin)
  const { setUser } = useAuth()
  const { success, error: showError } = useToast()

  const isEdit = Boolean(id)
  const [form, setForm] = useState<Partial<School>>(defaultForm)

  const { data: school, isLoading } = useQuery({
    queryKey: ['school', id],
    queryFn: () => schoolsApi.get(id!),
    enabled: isEdit,
  })

  const { data: citiesData } = useQuery({
    queryKey: ['cities'],
    queryFn: () => citiesApi.list(),
  })

  const cities: City[] = Array.isArray(citiesData)
    ? citiesData
    : (citiesData?.results ?? [])
  const cityOptions: SelectOption[] = cities.map((c) => ({
    value: c.id,
    label: c.name_ru || c.name,
  }))

  useEffect(() => {
    if (school) {
      setForm({
        name: school.name,
        city: school.city ?? null,
        address: school.address ?? '',
        grading_system: school.grading_system ?? { scale: '10-point', min: 0, max: 10 },
        languages_supported: school.languages_supported ?? ['ru', 'kz', 'en'],
      })
    }
  }, [school])

  const createMutation = useMutation({
    mutationFn: (data: Partial<School>) => schoolsApi.create(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      const updatedUser = await usersApi.getMe()
      setUser(updatedUser)
      success(t('schools.school_created', { defaultValue: 'Школа создана' }))
      navigate('/admin/schools')
    },
    onError: () => {
      showError(t('schools.school_create_error', { defaultValue: 'Ошибка при создании школы' }))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id: schoolId, data }: { id: string; data: Partial<School> }) =>
      schoolsApi.update(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      queryClient.invalidateQueries({ queryKey: ['school', id] })
      success(t('schools.school_updated', { defaultValue: 'Школа обновлена' }))
      navigate('/admin/schools')
    },
    onError: () => {
      showError(t('schools.school_update_error', { defaultValue: 'Ошибка при обновлении школы' }))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name?.trim()) {
      showError(t('schools.fill_required', { defaultValue: 'Заполните обязательные поля' }))
      return
    }
    if (isEdit && id) {
      updateMutation.mutate({ id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const pending = createMutation.isPending || updateMutation.isPending

  if (isEdit && isLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl">
      <Button
        variant="ghost"
        className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={() => navigate('/admin/schools')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('schools.back_to_list', { defaultValue: 'К списку школ' })}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEdit
              ? t('schools.edit_school', { defaultValue: 'Редактировать школу' })
              : t('schools.create_school', { defaultValue: 'Создать школу' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('schools.name', { defaultValue: 'Название' })} *
                </label>
                <Input
                  value={form.name ?? ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('schools.name_placeholder', { defaultValue: 'Название школы' })}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('schools.city', { defaultValue: 'Город' })}
                </label>
                <Select
                  value={form.city ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, city: e.target.value || null })
                  }
                  options={cityOptions}
                  placeholder={t('schools.city_placeholder', { defaultValue: 'Выберите город' })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('schools.address', { defaultValue: 'Адрес' })}
                </label>
                <Input
                  value={form.address ?? ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder={t('schools.address_placeholder', { defaultValue: 'Адрес' })}
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
                onClick={() => navigate('/admin/schools')}
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
