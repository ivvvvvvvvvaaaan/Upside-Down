'use client'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from './card'
import { Button } from './button'

/*
 * Modal - Centered overlay with backdrop.
 * Use Dropdown for trigger-attached panels.
 */

export interface ModalProps {
  /** Controlled open state */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Width of the modal: xs=320px, sm=600px, md=980px, lg=1280px */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Custom width (overrides size) */
  width?: number
  /** Modal content */
  children: React.ReactNode
}

function Modal({
  open,
  onOpenChange,
  size = 'sm',
  width,
  children
}: ModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open ?? internalOpen
  const setIsOpen = onOpenChange ?? setInternalOpen

  const sizes = {
    xs: 'w-[320px]',
    sm: 'w-[600px]',
    md: 'w-[980px]',
    lg: 'w-[1280px]',
  }

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false)
  }, [setIsOpen])

  useEffect(() => {
    if (!isOpen) return

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-surface-overlay"
        onClick={() => setIsOpen(false)}
      />
      <Card
        variant="outlined"
        className={cn('relative mx-4 shadow-high max-w-[calc(100vw-2rem)] border-border-elevation', !width && sizes[size])}
        style={width ? { width: `${width}px` } : undefined}
      >
        {children}
      </Card>
    </div>,
    document.body
  )
}

/* ── Compound components ── */

interface ModalHeaderProps {
  title: string
  subtitle?: string
  onClose?: () => void
  backButton?: React.ReactNode
}

function ModalHeader({ title, subtitle, onClose, backButton }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 pt-6 pb-0">
      <div className="flex items-center gap-2 min-w-0">
        {backButton}
        <div className="min-w-0">
          <h2 className="text-body-2-bold text-foreground truncate">{title}</h2>
          {subtitle && (
            <p className="text-body-0-regular text-foreground-dim mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {onClose && (
        <Button variant="icon" compact onClick={onClose} className="flex-shrink-0">
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}

interface ModalBodyProps {
  children: React.ReactNode
  className?: string
}

function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={cn('p-6', className)}>{children}</div>
}

const ModalNamespace = Object.assign(Modal, {
  Header: ModalHeader,
  Body: ModalBody,
})

export { ModalNamespace as Modal }
export type { ModalHeaderProps, ModalBodyProps }
