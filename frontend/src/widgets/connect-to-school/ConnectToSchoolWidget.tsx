import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/shared/lib/auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { Field, FieldLabel, FieldError } from '@/shared/ui/Field'
import { schoolsApi, SchoolByCode } from '@/shared/api/schools'
import {
  schoolJoinRequestsApi,
  REQUESTABLE_ROLES,
  type SchoolJoinRequest,
} from '@/shared/api/schoolJoinRequests'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link2, CheckCircle, Clock, XCircle } from 'lucide-react'

const CONNECT_HINT_KEY = 'connect_school_hint_shown'

function useMyJoinRequests() {
  const { data } = useQuery({
    queryKey: ['school-join-requests', 'mine'],
    queryFn: () => schoolJoinRequestsApi.list(),
  })
  const list = Array.isArray(data) ? data : (data?.results ?? []) as SchoolJoinRequest[]
  return list
}

export function ConnectToSchoolWidget() {
  const { t } = useTranslationWithNamespace(namespaces.dashboard)
  useAuth()
  const queryClient = useQueryClient()
  const [code, setCode] = useState('')
  const [checkedSchool, setCheckedSchool] = useState<SchoolByCode | null>(null)
  const [codeError, setCodeError] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [hintShown, setHintShown] = useState(false)

  const myRequests = useMyJoinRequests()

  useEffect(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(CONNECT_HINT_KEY)) {
      setHintShown(true)
    }
  }, [])

  const showHintOnce = () => {
    if (typeof localStorage !== 'undefined' && !localStorage.getItem(CONNECT_HINT_KEY)) {
      localStorage.setItem(CONNECT_HINT_KEY, '1')
      setHintShown(true)
    }
  }

  const handleCheckCode = async () => {
    setCodeError('')
    setCheckedSchool(null)
    const normalized = code.trim().toUpperCase().slice(0, 6)
    if (normalized.length !== 6) {
      setCodeError(t('connect_school_code_invalid', { defaultValue: 'Enter a 6-character code.' }))
      return
    }
    try {
      const school = await schoolsApi.getByCode(normalized)
      setCheckedSchool(school)
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { detail?: string } } }
      if (e.response?.status === 429) {
        setCodeError(t('connect_school_too_many_requests', { defaultValue: 'Too many attempts. Try again later.' }))
      } else if (e.response?.status === 404) {
        setCodeError(t('connect_school_not_found', { defaultValue: 'School not found.' }))
      } else {
        setCodeError(e.response?.data?.detail || (t('connect_school_check_failed', { defaultValue: 'Failed to check code.' })))
      }
    }
  }

  const existingRequest = checkedSchool
    ? myRequests.find((r) => r.school === checkedSchool.id)
    : null

  const createMutation = useMutation({
    mutationFn: (payload: { school_id: string; requested_role: string }) =>
      schoolJoinRequestsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-join-requests'] })
      setSubmitSuccess(t('connect_school_request_sent', { defaultValue: 'Request sent.' }))
      setSubmitError('')
      setCheckedSchool(null)
      setCode('')
      setSelectedRole('')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      setSubmitError(e.response?.data?.detail || (t('connect_school_submit_failed', { defaultValue: 'Failed to submit request.' })))
    },
  })

  const roleOptions = REQUESTABLE_ROLES.map((role) => ({
    value: role,
    label: t(`connect_school_role_${role}`, { defaultValue: role }),
  }))

  return (
    <Card className="mb-8 overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-primary/8 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-6 h-6 text-primary" />
          {t('connect_school_title', { defaultValue: 'Connect to a school' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hintShown && (
          <p className="text-muted-foreground text-[15px] rounded-xl bg-muted/50 px-4 py-2">
            {t('connect_school_hint', { defaultValue: 'Connect to your school using the 6-character code provided by your administrator.' })}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Field data-invalid={!!codeError}>
              <FieldLabel htmlFor="school-code">
                {t('connect_school_code_label', { defaultValue: 'School code' })}
              </FieldLabel>
              <Input
                id="school-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                onFocus={showHintOnce}
                placeholder="XXXXXX"
                maxLength={6}
                className="font-mono text-lg tracking-widest"
                aria-invalid={!!codeError}
                aria-describedby={codeError ? 'school-code-error' : undefined}
              />
              <FieldError errors={codeError ? [{ message: codeError }] : []} id="school-code-error" />
            </Field>
          </div>
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={handleCheckCode} className="w-full sm:w-auto">
              {t('connect_school_check', { defaultValue: 'Check' })}
            </Button>
          </div>
        </div>

        {checkedSchool && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="font-medium text-foreground">
              {checkedSchool.name}
              {checkedSchool.city && (
                <span className="text-muted-foreground font-normal"> — {checkedSchool.city}</span>
              )}
            </p>
            {existingRequest?.status === 'pending' && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5" />
                {t('connect_school_status_pending', { defaultValue: 'Request pending' })}
              </div>
            )}
            {existingRequest?.status === 'approved' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                {t('connect_school_status_approved', { defaultValue: 'Connected' })}
              </div>
            )}
            {existingRequest?.status === 'rejected' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="w-5 h-5" />
                  {t('connect_school_status_rejected', { defaultValue: 'Rejected' })}
                </div>
                {existingRequest.rejection_reason && (
                  <p className="text-sm text-muted-foreground pl-7">{existingRequest.rejection_reason}</p>
                )}
              </div>
            )}
            {(!existingRequest || existingRequest.status === 'rejected') && (
              <>
                <Field data-invalid={!!submitError}>
                  <FieldLabel>
                    {t('connect_school_role_label', { defaultValue: 'Your role' })}
                  </FieldLabel>
                  <Select
                    options={roleOptions}
                    value={selectedRole}
                    onChange={(e) => {
                      setSelectedRole(e.target.value)
                      setSubmitError('')
                    }}
                    placeholder={t('connect_school_role_placeholder', { defaultValue: 'Select role' })}
                  />
                  <FieldError errors={submitError ? [{ message: submitError }] : []} />
                </Field>
                {submitSuccess && (
                  <div className="text-green-600 text-sm rounded-xl bg-green-500/10 px-4 py-2">{submitSuccess}</div>
                )}
                <Button
                  disabled={!selectedRole || createMutation.isPending}
                  onClick={() =>
                    createMutation.mutate({
                      school_id: checkedSchool.id,
                      requested_role: selectedRole,
                    })
                  }
                >
                  {t('connect_school_submit', { defaultValue: 'Submit request' })}
                </Button>
              </>
            )}
          </div>
        )}

        {myRequests.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              {t('connect_school_my_requests', { defaultValue: 'My requests' })}
            </h3>
            <ul className="space-y-2">
              {myRequests.map((req) => (
                <li
                  key={req.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm"
                >
                  <span className="font-medium">{req.school_name ?? req.school}</span>
                  <span className="text-muted-foreground">{req.requested_role}</span>
                  <span className="flex items-center gap-1">
                    {req.status === 'pending' && (
                      <>
                        <Clock className="w-4 h-4" />
                        {t('connect_school_status_pending', { defaultValue: 'Pending' })}
                      </>
                    )}
                    {req.status === 'approved' && (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {t('connect_school_status_approved', { defaultValue: 'Approved' })}
                      </>
                    )}
                    {req.status === 'rejected' && (
                      <>
                        <XCircle className="w-4 h-4 text-destructive" />
                        {t('connect_school_status_rejected', { defaultValue: 'Rejected' })}
                        {req.rejection_reason && (
                          <span className="text-muted-foreground"> — {req.rejection_reason}</span>
                        )}
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
