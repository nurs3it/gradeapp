import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { PhoneInput } from '@/shared/ui/PhoneInput'
import { Select, SelectOption } from '@/shared/ui/Select'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces, languages, languageNames } from '@/shared/lib/i18n/config'
import { useAuth } from '@/shared/lib/auth'
import { useToast } from '@/shared/lib/ToastProvider'
import { usersApi, User, ProfileUpdatePayload } from '@/shared/api/users'
import { User as UserIcon, Save } from 'lucide-react'

const languageOptions: SelectOption[] = [
  { value: languages.ru, label: languageNames.ru },
  { value: languages.kz, label: languageNames.kz },
  { value: languages.en, label: languageNames.en },
]

export function ProfilePage() {
  const { user: authUser, setUser: setAuthUser } = useAuth()
  const queryClient = useQueryClient()
  const { t } = useTranslationWithNamespace(namespaces.profile)
  const { success, error: showError } = useToast()

  const [form, setForm] = useState<ProfileUpdatePayload & { email?: string }>({
    first_name: '',
    last_name: '',
    middle_name: '',
    phone: '',
    language_pref: languages.ru,
  })

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => usersApi.getMe(),
    enabled: !!authUser?.id,
  })

  const updateMutation = useMutation({
    mutationFn: (data: ProfileUpdatePayload) => usersApi.updateMe(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['user', 'me'], updated)
      setAuthUser(updated)
      success(t('saved', { defaultValue: 'Профиль сохранён' }))
    },
    onError: () => {
      showError(t('save_error', { defaultValue: 'Ошибка при сохранении' }))
    },
  })

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        middle_name: user.middle_name ?? '',
        phone: user.phone ?? '',
        language_pref: user.language_pref || languages.ru,
        email: user.email,
      })
    }
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const { email: _, ...payload } = form
    updateMutation.mutate(payload as ProfileUpdatePayload)
  }

  if (isLoading || !user) {
    return (
      <div className="w-full flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          {t('title', { defaultValue: 'Профиль' })}
        </h1>
        <p className="text-muted-foreground text-[15px] mt-1">
          {t('description', { defaultValue: 'Редактирование личных данных' })}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserIcon className="w-5 h-5 text-muted-foreground" />
            {t('title', { defaultValue: 'Личные данные' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t('first_name', { defaultValue: 'Имя' })}
                </label>
                <Input
                  value={form.first_name ?? ''}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t('last_name', { defaultValue: 'Фамилия' })}
                </label>
                <Input
                  value={form.last_name ?? ''}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('middle_name', { defaultValue: 'Отчество' })}
              </label>
              <Input
                value={form.middle_name ?? ''}
                onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('email', { defaultValue: 'Email' })}
              </label>
              <Input
                value={form.email ?? ''}
                disabled
                className="rounded-xl bg-muted/50 text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('phone', { defaultValue: 'Телефон' })}
              </label>
              <PhoneInput
                value={form.phone ?? ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('language_pref', { defaultValue: 'Язык интерфейса' })}
              </label>
              <Select
                value={form.language_pref ?? languages.ru}
                onChange={(e) => setForm({ ...form, language_pref: e.target.value })}
                options={languageOptions}
                className="rounded-xl"
              />
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={updateMutation.isPending} className="rounded-xl">
                <Save className="w-4 h-4 mr-2" />
                {t('save', { defaultValue: 'Сохранить' })}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
