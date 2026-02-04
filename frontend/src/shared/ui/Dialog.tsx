import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children?: ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  variant?: 'default' | 'destructive'
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
}: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const handleConfirm = () => {
    onConfirm?.()
    onOpenChange(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleCancel}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
        aria-hidden
      />
      <div
        className="relative w-full max-h-[90vh] overflow-hidden bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl sm:max-w-md"
        style={{
          animation: 'slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleCancel}
          className="absolute right-3 top-3 p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground active:opacity-80 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pt-5">
          {title && (
            <h2 className="text-lg font-semibold text-foreground pr-10 mb-1.5 leading-tight">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-[15px] text-muted-foreground mb-6 leading-snug">{description}</p>
          )}
          {children && <div className="mb-6">{children}</div>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel} className="min-w-[80px] rounded-xl">
              {cancelText}
            </Button>
            <Button
              variant={variant === 'destructive' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              className="min-w-[80px] rounded-xl"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
