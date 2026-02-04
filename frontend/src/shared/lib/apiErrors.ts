import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

/**
 * Parses API validation errors from axios/backend responses.
 * Supports: DRF field errors, detail, message, non_field_errors.
 */

export interface ParsedApiError {
  /** Field name -> list of error messages (e.g. { password: ["Too common"] }) */
  fieldErrors: Record<string, string[]>
  /** Single message for display (detail, first non-field error, or first field error) */
  generalMessage: string
  /** All messages as flat list (for bullet list display) */
  allMessages: string[]
  /** HTTP status if available */
  statusCode?: number
}

type UnknownError = unknown & {
  response?: { data?: Record<string, unknown>; status?: number }
  message?: string
}

/**
 * Normalize value to string[] (backend may send string or string[] per field).
 */
function toMessages(value: unknown): string[] {
  if (value == null) return []
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.map((x) => (typeof x === 'string' ? x : String(x)))
  return [String(value)]
}

/**
 * Extract field errors from response data.
 * Handles: { password: ["msg"], email: "single" }, { errors: { ... } }, nested objects.
 */
function extractFieldErrors(data: Record<string, unknown>): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}

  // DRF style: { "password": ["..."], "email": ["..."] }
  for (const [key, value] of Object.entries(data)) {
    if (key === 'detail' || key === 'message' || key === 'non_field_errors') continue
    const messages = toMessages(value)
    if (messages.length > 0) fieldErrors[key] = messages
  }

  // Optional: nested under "errors"
  const nested = data.errors
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    for (const [key, value] of Object.entries(nested as Record<string, unknown>)) {
      const messages = toMessages(value)
      if (messages.length > 0) fieldErrors[key] = [...(fieldErrors[key] ?? []), ...messages]
    }
  }

  return fieldErrors
}

/**
 * Get general message from data: detail, message, non_field_errors, or first field error.
 */
function getGeneralMessage(
  data: Record<string, unknown>,
  fieldErrors: Record<string, string[]>,
  fallback: string
): string {
  const detail = data.detail
  if (detail != null) {
    const arr = toMessages(detail)
    if (arr.length > 0) return arr[0]
  }
  const msg = data.message
  if (typeof msg === 'string' && msg.trim()) return msg
  const nonField = toMessages(data.non_field_errors)
  if (nonField.length > 0) return nonField[0]
  const firstField = Object.values(fieldErrors).flat()
  if (firstField.length > 0) return firstField[0]
  return fallback
}

/**
 * Parse an axios/API error into a structured form for UI.
 *
 * @param error - Caught error (axios error or unknown)
 * @param fallbackMessage - Message when nothing can be extracted
 * @returns ParsedApiError with fieldErrors, generalMessage, allMessages
 *
 * @example
 * try {
 *   await api.post('/register/', data)
 * } catch (err) {
 *   const parsed = parseApiError(err, 'Registration failed')
 *   setFieldErrors(parsed.fieldErrors)
 *   setGeneralError(parsed.generalMessage)
 * }
 */
export function parseApiError(error: unknown, fallbackMessage = 'Request failed'): ParsedApiError {
  const err = error as UnknownError
  const data = err?.response?.data
  const statusCode = err?.response?.status

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const fieldErrors = extractFieldErrors(data as Record<string, unknown>)
    const generalMessage = getGeneralMessage(
      data as Record<string, unknown>,
      fieldErrors,
      fallbackMessage
    )
    const allMessages = [
      ...toMessages((data as Record<string, unknown>).non_field_errors),
      ...Object.values(fieldErrors).flat(),
    ]
    if (allMessages.length === 0) allMessages.push(generalMessage)
    return {
      fieldErrors,
      generalMessage,
      allMessages: [...new Set(allMessages)],
      statusCode,
    }
  }

  const message =
    typeof (err as { message?: string })?.message === 'string'
      ? (err as { message: string }).message
      : fallbackMessage
  return {
    fieldErrors: {},
    generalMessage: message,
    allMessages: [message],
    statusCode,
  }
}

export interface ApplyServerErrorsResult {
  generalMessage: string
  allMessages: string[]
}

/**
 * Parse API error and apply field errors to react-hook-form.
 * Use in submit catch: setBanner(applyServerErrors(err, form.setError, fallback)).
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fallbackMessage: string
): ApplyServerErrorsResult {
  const parsed = parseApiError(error, fallbackMessage)
  for (const [field, messages] of Object.entries(parsed.fieldErrors)) {
    const msg = messages[0]
    if (msg) {
      try {
        setError(field as Path<T>, { type: 'server', message: msg })
      } catch {
        /* field not in form schema */
      }
    }
  }
  return {
    generalMessage: parsed.generalMessage,
    allMessages: parsed.allMessages,
  }
}
