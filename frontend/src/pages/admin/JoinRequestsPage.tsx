import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { Select } from '@/shared/ui/Select'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'
import { useAuth } from '@/shared/lib/auth'
import { useToast } from '@/shared/lib/ToastProvider'
import { schoolJoinRequestsApi, type SchoolJoinRequest } from '@/shared/api/schoolJoinRequests'
import { schoolsApi } from '@/shared/api/schools'
import { UserPlus, Check, X, Loader2 } from 'lucide-react'

export function JoinRequestsPage() {
  const { t } = useTranslationWithNamespace(namespaces.admin)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()
  const [schoolFilter, setSchoolFilter] = useState<string>('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const canApprove =
    user?.roles?.includes('schooladmin') || user?.roles?.includes('director')

  const { data: schoolsData } = useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolsApi.list(),
    enabled: canApprove,
  })
  const schoolsList = Array.isArray(schoolsData) ? schoolsData : (schoolsData?.results ?? [])

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['school-join-requests', 'admin', schoolFilter || undefined],
    queryFn: () =>
      schoolJoinRequestsApi.list({
        status: 'pending',
        ...(schoolFilter ? { school_id: schoolFilter } : {}),
      }),
    enabled: canApprove,
  })
  const requests = (Array.isArray(requestsData) ? requestsData : requestsData?.results ?? []) as SchoolJoinRequest[]

  const approveMutation = useMutation({
    mutationFn: (id: string) => schoolJoinRequestsApi.patch(id, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-join-requests'] })
      success(t('join_requests.approved', { defaultValue: 'Request approved' }))
      setSelectedIds(new Set())
    },
    onError: () => {
      showError(t('join_requests.approve_error', { defaultValue: 'Failed to approve' }))
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      schoolJoinRequestsApi.patch(id, { status: 'rejected', rejection_reason: reason || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-join-requests'] })
      setRejectingId(null)
      setRejectionReason('')
      success(t('join_requests.rejected', { defaultValue: 'Request rejected' }))
    },
    onError: () => {
      showError(t('join_requests.reject_error', { defaultValue: 'Failed to reject' }))
    },
  })

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === requests.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(requests.map((r) => r.id)))
    }
  }

  const approveSelected = () => {
    selectedIds.forEach((id) => approveMutation.mutate(id))
  }

  const formatDate = (s: string) => {
    try {
      const d = new Date(s)
      return d.toLocaleDateString(undefined, { dateStyle: 'short' })
    } catch {
      return s
    }
  }

  if (!canApprove) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">{t('join_requests.no_access', { defaultValue: 'You do not have access to this page.' })}</p>
        </CardContent>
      </Card>
    )
  }

  const schoolOptions = schoolsList.map((s: { id: string; name: string }) => ({
    value: s.id,
    label: s.name,
  }))

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t('join_requests.title', { defaultValue: 'Join requests' })}
        </h1>
        <p className="text-muted-foreground text-[15px] mt-1">
          {t('join_requests.description', { defaultValue: 'Approve or reject requests to join your school.' })}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {t('join_requests.pending', { defaultValue: 'Pending requests' })}
          </CardTitle>
          {schoolOptions.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">{t('join_requests.filter_school', { defaultValue: 'School' })}</label>
              <Select
                options={[{ value: '', label: t('join_requests.all_schools', { defaultValue: 'All' }) }, ...schoolOptions]}
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="min-w-[180px]"
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {selectedIds.size > 0 && (
            <div className="mb-4 flex items-center gap-3">
              <Button size="sm" onClick={approveSelected} disabled={approveMutation.isPending}>
                {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                {t('join_requests.approve_selected', { defaultValue: 'Approve selected' })} ({selectedIds.size})
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                {t('join_requests.cancel', { defaultValue: 'Cancel' })}
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              {t('join_requests.no_pending', { defaultValue: 'No pending requests.' })}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 pr-2">
                      <input
                        type="checkbox"
                        checked={requests.length > 0 && selectedIds.size === requests.length}
                        onChange={toggleSelectAll}
                        className="rounded border-input"
                        aria-label={t('join_requests.select_all', { defaultValue: 'Select all' })}
                      />
                    </th>
                    <th className="pb-3 pr-4 font-medium text-foreground">{t('join_requests.user', { defaultValue: 'User' })}</th>
                    <th className="pb-3 pr-4 font-medium text-foreground">{t('join_requests.school', { defaultValue: 'School' })}</th>
                    <th className="pb-3 pr-4 font-medium text-foreground">{t('join_requests.role', { defaultValue: 'Role' })}</th>
                    <th className="pb-3 pr-4 font-medium text-foreground">{t('join_requests.date', { defaultValue: 'Date' })}</th>
                    <th className="pb-3 font-medium text-foreground">{t('join_requests.actions', { defaultValue: 'Actions' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="border-b border-border/50">
                      <td className="py-3 pr-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(req.id)}
                          onChange={() => toggleSelect(req.id)}
                          className="rounded border-input"
                          aria-label={t('join_requests.select', { defaultValue: 'Select' })}
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{req.user_name || req.user_email || req.user}</div>
                        <div className="text-sm text-muted-foreground">{req.user_email}</div>
                      </td>
                      <td className="py-3 pr-4">{req.school_name ?? req.school}</td>
                      <td className="py-3 pr-4">{req.requested_role}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{formatDate(req.created_at)}</td>
                      <td className="py-3 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          disabled={approveMutation.isPending}
                          onClick={() => approveMutation.mutate(req.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          {t('join_requests.approve', { defaultValue: 'Approve' })}
                        </Button>
                        {rejectingId === req.id ? (
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder={t('join_requests.rejection_reason_placeholder', { defaultValue: 'Reason (optional)' })}
                              className="flex h-9 rounded-lg border border-input bg-card px-3 text-sm"
                            />
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={rejectMutation.isPending}
                                onClick={() => rejectMutation.mutate({ id: req.id, reason: rejectionReason })}
                              >
                                {t('join_requests.reject', { defaultValue: 'Reject' })}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectionReason('') }}>
                                {t('join_requests.cancel', { defaultValue: 'Cancel' })}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => setRejectingId(req.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            {t('join_requests.reject', { defaultValue: 'Reject' })}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
