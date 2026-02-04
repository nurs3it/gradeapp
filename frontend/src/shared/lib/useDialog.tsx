import { useState, useCallback } from 'react'
import { Dialog } from '../ui/Dialog'

interface DialogOptions {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

export function useDialog() {
  const [dialogState, setDialogState] = useState<{
    open: boolean
    options: DialogOptions
    onConfirm?: () => void
  }>({
    open: false,
    options: {},
  })

  const showDialog = useCallback(
    (options: DialogOptions, onConfirm?: () => void) => {
      setDialogState({
        open: true,
        options,
        onConfirm,
      })
    },
    []
  )

  const confirm = useCallback(
    (message: string, options?: Omit<DialogOptions, 'description'>): Promise<boolean> => {
      return new Promise((resolve) => {
        showDialog(
          {
            title: options?.title || 'Подтверждение',
            description: message,
            confirmText: options?.confirmText || 'Подтвердить',
            cancelText: options?.cancelText || 'Отмена',
            variant: options?.variant || 'destructive',
          },
          () => {
            resolve(true)
          }
        )
      })
    },
    [showDialog]
  )

  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({
      ...prev,
      open: false,
    }))
  }, [])

  const DialogComponent = useCallback(() => {
    return (
      <Dialog
        open={dialogState.open}
        onOpenChange={closeDialog}
        title={dialogState.options.title}
        description={dialogState.options.description}
        confirmText={dialogState.options.confirmText}
        cancelText={dialogState.options.cancelText}
        variant={dialogState.options.variant}
        onConfirm={dialogState.onConfirm}
        onCancel={closeDialog}
      />
    )
  }, [dialogState, closeDialog])

  return {
    showDialog,
    confirm,
    DialogComponent,
  }
}

