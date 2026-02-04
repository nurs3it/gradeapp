import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'
import { useAuth } from '@/shared/lib/auth'
import { useToast } from '@/shared/lib/ToastProvider'
import { permissionsApi, Permission } from '@/shared/api/permissions'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

const ROLES = [
  'superadmin',
  'schooladmin',
  'director',
  'teacher',
  'student',
  'parent',
  'registrar',
  'scheduler',
] as const

export function PermissionsPage() {
  const { t } = useTranslationWithNamespace(namespaces.admin)
  const { user } = useAuth()
  const navigate = useNavigate()
  const { success, error: showError } = useToast()
  const queryClient = useQueryClient()

  const canManage =
    user?.is_superuser === true ||
    (Array.isArray(user?.permissions) && user.permissions.includes('permissions.manage'))

  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({})
  const initialized = useRef(false)

  const { data: permissions = [], isLoading: loadingPerms } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionsApi.list(),
    enabled: canManage,
  })

  const roleQueries = useQueries({
    queries: ROLES.map((role) => ({
      queryKey: ['rolePermissions', role],
      queryFn: () => permissionsApi.getRolePermissions(role),
      enabled: canManage,
    })),
  })

  useEffect(() => {
    if (initialized.current) return
    if (roleQueries.some((q) => !q.data)) return
    const next: Record<string, string[]> = {}
    roleQueries.forEach((q, i) => {
      const role = ROLES[i]
      next[role] = (q.data as { permission_codes: string[] })?.permission_codes ?? []
    })
    setRolePermissions(next)
    initialized.current = true
  }, [roleQueries])

  const setRolePermission = (role: string, code: string, checked: boolean) => {
    setRolePermissions((prev) => {
      const list = prev[role] ?? []
      const nextList = checked
        ? [...list, code]
        : list.filter((c) => c !== code)
      return { ...prev, [role]: nextList }
    })
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        ROLES.map((role) =>
          permissionsApi.setRolePermissions(role, rolePermissions[role] ?? [])
        )
      )
    },
    onSuccess: () => {
      ROLES.forEach((role) => {
        queryClient.invalidateQueries({ queryKey: ['rolePermissions', role] })
      })
      success(t('permissions.saved', { defaultValue: 'Изменения сохранены' }))
    },
    onError: (err: any) => {
      showError(
        err.response?.data?.detail ||
          t('permissions.error_save', { defaultValue: 'Ошибка сохранения' })
      )
    },
  })

  if (!canManage) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const isLoading = loadingPerms || roleQueries.some((q) => q.isLoading)
  const groupedByResource = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const r = p.resource || 'other'
    if (!acc[r]) acc[r] = []
    acc[r].push(p)
    return acc
  }, {})

  const resourceLabel = (resourceKey: string) =>
    t(`permissions.resource.${resourceKey}`, { ns: namespaces.admin, defaultValue: resourceKey })

  return (
    <div className="p-4 lg:p-6 max-w-full">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground truncate">
            {t('permissions.title', { defaultValue: 'Права ролей' })}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('permissions.description', { defaultValue: 'Отметьте, какие действия доступны каждой роли в системе.' })}
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="truncate">
                {t('permissions.table_caption', { defaultValue: 'Право / Роль' })}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t('permissions.table_hint', { defaultValue: 'Галочка — у роли есть это право.' })}
              </p>
            </div>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="shrink-0"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('permissions.saving', { defaultValue: 'Сохранение...' })}
                </>
              ) : (
                t('permissions.save', { defaultValue: 'Сохранить' })
              )}
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm border-collapse" role="grid" aria-label={t('permissions.table_caption', { defaultValue: 'Право / Роль' })}>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="text-left p-3 font-medium text-foreground sticky left-0 bg-card min-w-[180px] max-w-[280px]">
                    {t('permissions.permission_label', { defaultValue: 'Право' })}
                  </th>
                  {ROLES.map((role) => (
                    <th
                      key={role}
                      scope="col"
                      className="p-3 font-medium text-foreground text-center min-w-[90px] max-w-[140px] truncate"
                      title={t(`permissions.roles.${role}`, { defaultValue: role })}
                    >
                      {t(`permissions.roles.${role}`, { defaultValue: role })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedByResource).map(([resource, perms]) => (
                  <React.Fragment key={resource}>
                    <tr className="bg-muted/30">
                      <td
                        colSpan={ROLES.length + 1}
                        className="p-2 pl-3 font-medium text-foreground sticky left-0 bg-muted/30 truncate"
                      >
                        {resourceLabel(resource)}
                      </td>
                    </tr>
                    {perms.map((perm) => (
                      <tr
                        key={perm.id}
                        className="border-b border-border hover:bg-muted/20"
                      >
                        <td className="p-3 sticky left-0 bg-card min-w-0">
                          <span className="font-mono text-xs text-muted-foreground block truncate" title={perm.code}>
                            {perm.code}
                          </span>
                          <span className="block text-foreground mt-0.5 truncate" title={perm.name || perm.description}>
                            {perm.name}
                          </span>
                        </td>
                        {ROLES.map((role) => (
                          <td key={role} className="p-3 text-center align-middle">
                            <input
                              type="checkbox"
                              checked={(rolePermissions[role] ?? []).includes(perm.code)}
                              onChange={(e) =>
                                setRolePermission(role, perm.code, e.target.checked)
                              }
                              className={clsx(
                                'w-4 h-4 rounded border-border cursor-pointer',
                                'focus:ring-2 focus:ring-primary focus:ring-offset-0'
                              )}
                              aria-label={`${perm.name || perm.code} — ${t(`permissions.roles.${role}`, { defaultValue: role })}`}
                              title={`${t(`permissions.roles.${role}`, { defaultValue: role })}: ${perm.name || perm.code}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
