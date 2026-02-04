import { forwardRef, useCallback } from 'react'
import { cn } from '../lib/utils'
import { Input } from './Input'

const PREFIX = '+7 '
const DIGITS_MAX = 10

/** Извлекает только цифры из строки (после +7 — 10 цифр номера). */
function getDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return digits.length > DIGITS_MAX ? digits.slice(0, DIGITS_MAX) : digits
}

/** Форматирует цифры в +7 (XXX) XXX-XX-XX. Пустая строка для 0 цифр. */
function formatPhone(digits: string): string {
  if (digits.length === 0) return ''
  let out = PREFIX
  if (digits.length > 0) out += `(${digits.slice(0, 3)}`
  if (digits.length > 3) out += `) ${digits.slice(3, 6)}`
  if (digits.length > 6) out += `-${digits.slice(6, 8)}`
  if (digits.length > 8) out += `-${digits.slice(8, 10)}`
  return out
}

/** Парсит отображаемую строку в цифры для value. */
function parseDisplayToDigits(display: string): string {
  return getDigits(display)
}

export interface PhoneInputProps extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = '', onChange, ...props }, ref) => {
    const digits = parseDisplayToDigits(String(value))
    const displayValue = formatPhone(digits)

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value
        const nextDigits = getDigits(raw)
        const formatted = nextDigits.length === 0 ? '' : formatPhone(nextDigits)
        const synthetic = { ...e, target: { ...e.target, value: formatted } }
        onChange?.(synthetic)
      },
      [onChange]
    )

    return (
      <Input
        ref={ref}
        type="tel"
        autoComplete="tel"
        value={displayValue}
        onChange={handleChange}
        className={cn('rounded-xl', className)}
        {...props}
      />
    )
  }
)
PhoneInput.displayName = 'PhoneInput'
