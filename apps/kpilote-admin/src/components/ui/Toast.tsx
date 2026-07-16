import { CheckCircle2, X, XCircle } from 'lucide-react'
import { Toast as ToastPrimitive } from 'radix-ui'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

import { clsxm } from '@/lib/clsxm'

type ToastVariant = 'success' | 'error'
type ToastInput = { title: ReactNode; description?: ReactNode; variant?: ToastVariant }
type ToastItem = ToastInput & { id: number; variant: ToastVariant }

const ToastContext = createContext<(input: ToastInput) => void>(() => undefined)

export const useToast = () => useContext(ToastContext)

let nextToastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback((input: ToastInput) => {
    nextToastId += 1
    setToasts((prev) => [...prev, { variant: 'success', ...input, id: nextToastId }])
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
        {children}
        {toasts.map((item) => (
          <ToastPrimitive.Root
            key={item.id}
            onOpenChange={(open) => {
              if (!open) remove(item.id)
            }}
            className={clsxm(
              'flex items-start gap-3 rounded-lg border bg-surface p-4 shadow-lg',
              item.variant === 'success' ? 'border-primary/30' : 'border-accent/30',
            )}
          >
            <span
              className={clsxm(
                'mt-0.5 shrink-0',
                item.variant === 'success' ? 'text-primary' : 'text-accent',
              )}
              aria-hidden
            >
              {item.variant === 'success' ? (
                <CheckCircle2 className="size-5" />
              ) : (
                <XCircle className="size-5" />
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <ToastPrimitive.Title className="text-sm font-semibold text-text">
                {item.title}
              </ToastPrimitive.Title>
              {item.description && (
                <ToastPrimitive.Description className="text-sm text-text-muted">
                  {item.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close
              className="shrink-0 text-text-subtle transition-colors hover:text-text"
              aria-label="Fermer"
            >
              <X className="size-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex w-96 max-w-[100vw] flex-col gap-3 p-6 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}
