'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export interface ContextMenuItem {
  label: string
  icon?: ReactNode
  /** For toggle items like "Auto-promote" */
  checked?: boolean
  disabled?: boolean
  destructive?: boolean
  dividerAfter?: boolean
  onClick: () => void
}

export interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight

    if (rect.right > viewportW) {
      menuRef.current.style.left = `${x - rect.width}px`
    }
    if (rect.bottom > viewportH) {
      menuRef.current.style.top = `${y - rect.height}px`
    }
  }, [x, y])

  const menu = (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] bg-surface-mid rounded shadow-lg py-1"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => {
              item.onClick()
              onClose()
            }}
            disabled={item.disabled}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2.5 text-body-0-regular',
              item.destructive ? 'text-foreground-system-error' : 'text-foreground',
              'hover:bg-surface-highlight transition-colors text-left',
              item.disabled && 'opacity-40 pointer-events-none',
            )}
          >
            {item.checked !== undefined ? (
              <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                {item.checked && <Check className="w-3.5 h-3.5" />}
              </span>
            ) : item.icon ? (
              <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                {item.icon}
              </span>
            ) : null}
            <span>{item.label}</span>
          </button>
          {item.dividerAfter && (
            <div className="my-1 border-t border-border-dim" />
          )}
        </div>
      ))}
    </div>
  )

  return createPortal(menu, document.body)
}
