'use client'

import { useState, useCallback, useRef, createContext, useContext, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Check, Info, AlertTriangle, AlertCircle, X } from 'lucide-react'
import { Button } from './button'

export type ToastType = 'success' | 'info' | 'warning' | 'error'

export interface ToastAction {
  label: string
  onClick: () => void
}

interface Toast {
  id: number
  message: string
  type: ToastType
  action?: ToastAction
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, action?: ToastAction) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const TOAST_ICON: Record<ToastType, typeof Check> = {
  success: Check,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
}

const TOAST_BG: Record<ToastType, string> = {
  info: 'bg-gray-500',
  success: 'bg-surface-system-success',
  warning: 'bg-surface-system-warning',
  error: 'bg-surface-system-error',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'success', action?: ToastAction) => {
    const id = ++counterRef.current
    setToasts(prev => [...prev, { id, message, type, action }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, action ? 6000 : 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map(toast => {
          const Icon = TOAST_ICON[toast.type]
          return (
            <div
              key={toast.id}
              className={cn(
                'flex items-center gap-2 rounded-lg shadow-high',
                'animate-in slide-in-from-bottom-2 fade-in duration-200',
                'text-white',
                TOAST_BG[toast.type],
              )}
              style={{ paddingLeft: 16, paddingTop: 4, paddingRight: 4, paddingBottom: 4 }}
            >
              <Icon className="w-6 h-6 flex-shrink-0" />
              <span className="text-body-0-regular flex-1">{toast.message}</span>
              {toast.action && (
                <Button
                  variant="tertiary"
                  compact
                  onClick={() => {
                    toast.action!.onClick()
                    dismiss(toast.id)
                  }}
                  className="text-white hover:bg-white/20 hover:text-white"
                >
                  {toast.action.label}
                </Button>
              )}
              <Button
                variant="icon"
                compact
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                className="text-white/70 hover:text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
