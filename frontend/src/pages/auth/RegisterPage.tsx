import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { useAuth } from '@/shared/lib/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { applyServerErrors } from '@/shared/lib/apiErrors'
import { registerSchema, type RegisterFormValues } from '@/shared/lib/validations/auth'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { PasswordInput } from '@/shared/ui/PasswordInput'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Field, FieldLabel, FieldError } from '@/shared/ui/Field'
import { FormErrors } from '@/shared/ui/FormErrors'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'

const defaultValues: RegisterFormValues = {
  email: '',
  password: '',
  password_confirm: '',
  first_name: '',
  last_name: '',
}

export function RegisterPage() {
  const { t } = useTranslationWithNamespace(namespaces.auth)
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [serverBanner, setServerBanner] = useState<{ message: string; list: string[] }>({
    message: '',
    list: [],
  })

  const form = useForm<RegisterFormValues>({
    defaultValues,
    resolver: zodResolver(registerSchema),
  })

  const { control, handleSubmit, formState: { isSubmitting }, clearErrors } = form

  const onSubmit = handleSubmit(async (data) => {
    setServerBanner({ message: '', list: [] })
    clearErrors()
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        password_confirm: data.password_confirm,
        first_name: data.first_name || undefined,
        last_name: data.last_name || undefined,
      })
      navigate('/dashboard')
    } catch (err: unknown) {
      const result = applyServerErrors(err, form.setError, t('register_failed'))
      setServerBanner({ message: result.generalMessage, list: result.allMessages })
    }
  })

  const hasServerErrors = serverBanner.list.length > 0

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 safe-area-top safe-area-bottom">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>{t('register_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {hasServerErrors && (
              <FormErrors
                message={serverBanner.message}
                messages={serverBanner.list.length > 1 ? serverBanner.list : undefined}
                variant={serverBanner.list.length > 1 ? 'list' : 'banner'}
              />
            )}
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-email">{t('email')}</FieldLabel>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder={t('email_placeholder')}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? 'register-email-error' : undefined}
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} id="register-email-error" />}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-password">{t('password')}</FieldLabel>
                  <PasswordInput
                    id="register-password"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? 'register-password-error' : undefined}
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} id="register-password-error" />}
                </Field>
              )}
            />
            <Controller
              name="password_confirm"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-password_confirm">{t('password_confirm')}</FieldLabel>
                  <PasswordInput
                    id="register-password_confirm"
                    placeholder={t('password_confirm_placeholder')}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? 'register-password_confirm-error' : undefined}
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} id="register-password_confirm-error" />}
                </Field>
              )}
            />
            <Controller
              name="first_name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-first_name">{t('first_name')}</FieldLabel>
                  <Input
                    id="register-first_name"
                    type="text"
                    placeholder={t('first_name_placeholder')}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? 'register-first_name-error' : undefined}
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} id="register-first_name-error" />}
                </Field>
              )}
            />
            <Controller
              name="last_name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-last_name">{t('last_name')}</FieldLabel>
                  <Input
                    id="register-last_name"
                    type="text"
                    placeholder={t('last_name_placeholder')}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? 'register-last_name-error' : undefined}
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} id="register-last_name-error" />}
                </Field>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {t('register_button')}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t('register_prompt')}{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                {t('login_link')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
