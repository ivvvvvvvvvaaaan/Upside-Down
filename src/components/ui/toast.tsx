'use client'

import { useState, useCallback, useRef, createContext, useContext, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'info'
}

interface ToastContextValue {
  showToast: (message: string, type?: 'success' | 'info') => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    const id = ++counterRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded shadow-lg',
              'animate-in slide-in-from-bottom-2 fade-in duration-200',
              'bg-surface-high border border-border-dim text-foreground',
            )}
          >
            {toast.type === 'success' && <Check className="w-4 h-4 text-foreground-system-success flex-shrink-0" />}
            <span className="text-body-0-regular">{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-foreground-dim hover:text-foreground transition-colors flex-shrink-0 ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
