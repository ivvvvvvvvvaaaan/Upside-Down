'use client'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Card } from './card'

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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-surface-overlay"
        onClick={() => setIsOpen(false)}
      />
      <Card
        variant="outlined"
        className={cn('relative mx-4 shadow-high max-w-[calc(100vw-2rem)]', !width && sizes[size])}
        style={width ? { width: `${width}px` } : undefined}
      >
        {children}
      </Card>
    </div>
  )
}

export { Modal }
