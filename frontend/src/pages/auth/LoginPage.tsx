import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { useAuth } from '@/shared/lib/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { applyServerErrors } from '@/shared/lib/apiErrors'
import { loginSchema, type LoginFormValues } from '@/shared/lib/validations/auth'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { PasswordInput } from '@/shared/ui/PasswordInput'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Field, FieldLabel, FieldError } from '@/shared/ui/Field'
import { FormErrors } from '@/shared/ui/FormErrors'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'

const defaultValues: LoginFormValues = {
  email: '',
  password: '',
}

export function LoginPage() {
  const { t } = useTranslationWithNamespace(namespaces.auth)
  const navigate = useNavigate()
  const { login } = useAuth()
  const [serverBanner, setServerBanner] = useState<{ message: string; list: string[] }>({
    message: '',
    list: [],
  })

  const form = useForm<LoginFormValues>({
    defaultValues,
    resolver: zodResolver(loginSchema),
  })

  const { control, handleSubmit, formState: { isSubmitting }, clearErrors } = form

  const onSubmit = handleSubmit(async (data) => {
    setServerBanner({ message: '', list: [] })
    clearErrors()
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (err: unknown) {
      const result = applyServerErrors(err, form.setError, t('login_failed'))
      setServerBanner({ message: result.generalMessage, list: result.allMessages })
    }
  })

  const hasServerErrors = serverBanner.list.length > 0

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 safe-area-top safe-area-bottom">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>{t('login_title')}</CardTitle>
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
                  <FieldLabel htmlFor="login-email">{t('email')}</FieldLabel>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder={t('email_placeholder')}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? 'login-email-error' : undefined}
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} id="login-email-error" />}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-password">{t('password')}</FieldLabel>
                  <PasswordInput
                    id="login-password"
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? 'login-password-error' : undefined}
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} id="login-password-error" />}
                </Field>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {t('login_button')}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-4">
              {t('login_register_prompt')}{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                {t('register_link')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
