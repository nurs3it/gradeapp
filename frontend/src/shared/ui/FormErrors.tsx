import { cn } from '@/shared/lib/utils'

export type FormErrorsVariant = 'banner' | 'list' | 'inline'

interface FormErrorsProps {
  /** Single message (e.g. form.server.message) */
  message?: string | null
  /** All messages — shown as list when provided */
  messages?: string[]
  variant?: FormErrorsVariant
  className?: string
  /** Optional role for a11y */
  role?: 'alert'
}

/**
 * Displays form-level errors (general or list).
 * Use with server banner state (e.g. from applyServerErrors).
 */
export function FormErrors({
  message,
  messages,
  variant = 'banner',
  className,
  role = 'alert',
}: FormErrorsProps) {
  const list = messages?.length ? messages : (message ? [message] : [])
  if (list.length === 0) return null

  const baseClass = 'text-destructive text-[15px]'
  const bannerClass = 'rounded-xl bg-destructive/10 px-4 py-2'
  const listClass = 'rounded-xl bg-destructive/10 px-4 py-2 space-y-1'
  const inlineClass = ''

  if (variant === 'inline') {
    return (
      <span role={role} className={cn(baseClass, inlineClass, className)}>
        {list[0]}
      </span>
    )
  }

  if (variant === 'list' && list.length > 1) {
    return (
      <div role={role} className={cn(baseClass, listClass, className)}>
        <ul className="list-disc list-inside space-y-0.5">
          {list.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div role={role} className={cn(baseClass, bannerClass, className)}>
      {list[0]}
    </div>
  )
}
