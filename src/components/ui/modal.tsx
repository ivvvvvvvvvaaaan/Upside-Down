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
  /** Width of the modal */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Modal content */
  children: React.ReactNode
}

function Modal({
  open,
  onOpenChange,
  size = 'md',
  children
}: ModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open ?? internalOpen
  const setIsOpen = onOpenChange ?? setInternalOpen

  const sizes = {
    sm: 'w-72',
    md: 'w-80',
    lg: 'w-96',
    xl: 'w-[420px]',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-surface-overlay"
        onClick={() => setIsOpen(false)}
      />
      <Card
        variant="outlined"
        className={cn('relative mx-4 shadow-high', sizes[size])}
      >
        {children}
      </Card>
    </div>
  )
}

export { Modal }
