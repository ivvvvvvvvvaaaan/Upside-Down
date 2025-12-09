'use client'

import { cn } from '@/lib/utils'
import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

/*
 * ===========================================
 * MODAL COMPONENT
 * ===========================================
 * Overlay dialog for focused interactions.
 * Handles escape key and backdrop click.
 */

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}

function Modal({ 
  isOpen, 
  onClose, 
  title,
  size = 'md',
  children 
}: ModalProps) {
  // Handle escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])
  
  useEffect(() => {
    if (!isOpen) return
    
    // Only run setup when modal is actually open
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    
    // ✅ Cleanup only runs if setup ran
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEscape])
  
  if (!isOpen) return null
  
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div 
        className={cn(
          'relative w-full mx-4 bg-surface-0 rounded-lg shadow-lg animate-slide-up',
          sizes[size]
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-headline-3 text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-foreground-dim hover:text-foreground hover:bg-surface-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Body */}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}

export { Modal }
