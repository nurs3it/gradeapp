import * as React from 'react'
import { cn } from '@/shared/lib/utils'

/** Wrapper for a form field. Use data-invalid for error styling. */
const Field = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 'data-invalid'?: boolean }
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('space-y-1.5', className)} data-slot="field" {...props} />
))
Field.displayName = 'Field'

interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const FieldLabel = React.forwardRef<HTMLLabelElement, FieldLabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
      {...props}
    />
  )
)
FieldLabel.displayName = 'FieldLabel'

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
FieldDescription.displayName = 'FieldDescription'

/** Error from react-hook-form: FieldError has .message */
export type FieldErrorType = { message?: string } | undefined | null

interface FieldErrorProps {
  errors?: FieldErrorType[]
  className?: string
  id?: string
}

function FieldError({ errors, className, id }: FieldErrorProps) {
  const messages = (errors ?? [])
    .filter((e): e is { message?: string } => e != null && typeof e === 'object')
    .map((e) => e?.message)
    .filter((m): m is string => typeof m === 'string' && m.length > 0)
  if (messages.length === 0) return null
  return (
    <div
      id={id}
      role="alert"
      className={cn('text-destructive text-sm mt-1.5', className)}
    >
      {messages.length === 1 ? (
        messages[0]
      ) : (
        <ul className="list-disc list-inside space-y-0.5">
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
FieldError.displayName = 'FieldError'

export { Field, FieldLabel, FieldDescription, FieldError }
