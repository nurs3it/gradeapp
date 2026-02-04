import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'
import { useAuth } from '@/shared/lib/auth'
import { useDialog } from '@/shared/lib/useDialog'
import { useToast } from '@/shared/lib/ToastProvider'
import { schoolsApi, School } from '@/shared/api/schools'
import { Plus, Edit2, Trash2, MapPin, ChevronRight } from 'lucide-react'

export function AdminSchoolsPage() {
  const { t } = useTranslationWithNamespace(namespaces.admin)
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { confirm, DialogComponent } = useDialog()
  const { success, error: showError } = useToast()

  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)

  const { data: schoolsData } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolsApi.list(),
  })

  const deleteSchoolMutation = useMutation({
    mutationFn: (id: string) => schoolsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      if (selectedSchoolId === id) {
        setSelectedSchoolId(null)
      }
      success(t('schools.school_deleted', { defaultValue: 'Школа удалена' }))
    },
    onError: () => {
      showError(t('schools.school_delete_error', { defaultValue: 'Ошибка при удалении школы' }))
    },
  })

  const schools = schoolsData?.results ?? schoolsData ?? []
  const canCreateSchool = user?.roles?.includes('superadmin')
  const isDirector = user?.roles?.includes('director')
  const directorSchoolId = user?.linked_school
  const isEmpty = schools.length === 0

  useEffect(() => {
    if (isDirector && directorSchoolId && !selectedSchoolId) {
      setSelectedSchoolId(directorSchoolId)
    }
  }, [isDirector, directorSchoolId, selectedSchoolId])

  const emptyIllustration = (
    <div className="w-40 h-40 rounded-3xl bg-primary/5 flex items-center justify-center border border-primary/10">
      <svg
        className="w-20 h-20 text-primary/25"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    </div>
  )

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {t('schools.title', { defaultValue: 'Управление школами' })}
        </h1>
        {canCreateSchool && (
          <Button onClick={() => navigate('/admin/schools/new')} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            {t('schools.create_school', { defaultValue: 'Создать школу' })}
          </Button>
        )}
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              title={t('schools.no_schools_title', { defaultValue: 'Пока нет школ' })}
              description={t('schools.no_schools_description', {
                defaultValue: 'Добавьте первую школу, чтобы начать управление учебными годами и данными.',
              })}
              lottieUrl="https://assets2.lottiefiles.com/datafiles/vhvOcuUkV41BIdr/data.json"
              illustration={emptyIllustration}
              action={
                canCreateSchool ? (
                  <Button onClick={() => navigate('/admin/schools/new')} className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('schools.create_school', { defaultValue: 'Создать школу' })}
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('schools.schools_list', { defaultValue: 'Список школ' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {schools.map((school: School) => {
                const cityName =
                  school.city_detail?.name_ru || school.city_detail?.name || '—'
                return (
                  <li
                    key={school.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors group"
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/schools/${school.id}`)}
                      className="flex flex-1 flex-col sm:flex-row sm:items-center gap-3 text-left min-w-0 w-full"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                          {school.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span>{cityName}</span>
                          {school.address && (
                            <>
                              <span className="text-muted-foreground/60">·</span>
                              <span className="truncate">{school.address}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 self-start sm:self-center" />
                    </button>
                    <div className="flex gap-2 shrink-0 sm:pl-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/schools/${school.id}/edit`)
                        }}
                        aria-label={t('schools.edit_school', { defaultValue: 'Редактировать' })}
                        className="rounded-xl"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {canCreateSchool && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async (e) => {
                            e.stopPropagation()
                            const confirmed = await confirm(
                              t('schools.confirm_delete', { defaultValue: 'Удалить школу?' }),
                              {
                                title: t('schools.confirm_delete', { defaultValue: 'Удалить школу?' }),
                                confirmText: t('schools.delete', { defaultValue: 'Удалить' }),
                                cancelText: t('schools.cancel', { defaultValue: 'Отмена' }),
                                variant: 'destructive',
                              }
                            )
                            if (confirmed) {
                              deleteSchoolMutation.mutate(school.id)
                            }
                          }}
                          disabled={deleteSchoolMutation.isPending}
                          aria-label={t('schools.delete', { defaultValue: 'Удалить' })}
                          className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <DialogComponent />
    </div>
  )
}
