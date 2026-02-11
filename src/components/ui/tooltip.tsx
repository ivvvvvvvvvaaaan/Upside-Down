'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

/**
 * Tooltip Component
 *
 * Provides brief, contextual information when users hover over an element.
 * Follows Hawkins design system with dark background, label + optional description.
 *
 * @example
 * <Tooltip label="Asset name" description="Shot">
 *   <img src="/thumbnail.jpg" />
 * </Tooltip>
 */

export interface TooltipProps {
  /** Primary label text (bold) */
  label: string
  /** Optional description text (dimmer) */
  description?: string
  /** Element that triggers the tooltip */
  children: React.ReactNode
  /** Tooltip position */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Additional class name */
  className?: string
  /** Delay before showing tooltip (ms) */
  delay?: number
}

export function Tooltip({
  label,
  description,
  children,
  position = 'top',
  className,
  delay = 200,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isPositioned, setIsPositioned] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const gap = 8

    let top = 0
    let left = 0

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - gap
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        break
      case 'bottom':
        top = triggerRect.bottom + gap
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        break
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.left - tooltipRect.width - gap
        break
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.right + gap
        break
    }

    // Keep tooltip within viewport
    const padding = 8
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding))
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding))

    setCoords({ top, left })
    setIsPositioned(true)
  }, [position])

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
    setIsPositioned(false)
  }

  // Calculate position after tooltip is rendered but before it's visible
  useEffect(() => {
    if (isVisible && !isPositioned) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        calculatePosition()
      })
    }
  }, [isVisible, isPositioned, calculatePosition])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={cn('inline-block', className)}
      >
        {children}
      </div>

      {isVisible && typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          className={cn(
            'fixed z-50 px-3 py-2 rounded',
            'bg-surface-high',
            'shadow-[0_2px_4px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.15)]',
            'pointer-events-none',
            // Only show animation after positioned
            isPositioned ? 'opacity-100' : 'opacity-0'
          )}
          style={{ top: coords.top, left: coords.left }}
        >
          <p className="text-body-0-bold text-foreground whitespace-nowrap">
            {label}
          </p>
          {description && (
            <p className="text-body-0-regular text-foreground-dim whitespace-nowrap">
              {description}
            </p>
          )}
        </div>,
        document.body
      )}
    </>
  )
}
