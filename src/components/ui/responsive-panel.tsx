'use client'

import { useEffect } from 'react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

interface ResponsivePanelProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

/**
 * ResponsivePanel
 *
 * Desktop (≥ md): inline push-panel (360px, border-left)
 * Mobile (< md): full-screen overlay sliding in from the right
 */
export function ResponsivePanel({ open, onClose, children, className }: ResponsivePanelProps) {
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!open || !isMobile) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, isMobile, onClose])


  useEffect(() => {
    if (!isMobile || !open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isMobile, open])

  if (!open) return null

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-40">
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          className={cn(
            'absolute inset-y-0 right-0 w-full max-w-[400px] bg-surface-1 flex flex-col',
            'animate-in slide-in-from-right duration-200',
            className,
          )}
        >
          {children}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'w-[360px] flex-shrink-0 border-l border-border bg-surface-1 flex flex-col h-full',
        className,
      )}
    >
      {children}
    </div>
  )
}
