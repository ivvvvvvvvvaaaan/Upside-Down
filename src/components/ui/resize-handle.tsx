'use client'

import { cn } from '@/lib/utils'

/**
 * Resize Handle
 *
 * Vertical drag handle for resizing panels.
 * Shows subtle indicator on hover and during drag.
 */

export interface ResizeHandleProps {
  /** Called when drag starts */
  onDragStart?: () => void
  /** Called during drag with delta X */
  onDrag?: (deltaX: number) => void
  /** Called when drag ends */
  onDragEnd?: () => void
  /** Whether currently dragging */
  isDragging?: boolean
  className?: string
}

export function ResizeHandle({
  onDragStart,
  onDrag,
  onDragEnd,
  isDragging,
  className,
}: ResizeHandleProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX

    onDragStart?.()

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      onDrag?.(deltaX)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      onDragEnd?.()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div
      className={cn(
        'w-4 -ml-2 cursor-col-resize flex-shrink-0 flex justify-center group',
        className
      )}
      onMouseDown={handleMouseDown}
    >
      <div
        className={cn(
          'w-px h-full transition-all',
          'bg-border-dim group-hover:w-1 group-hover:bg-indigo-500/40',
          isDragging && 'w-1 bg-indigo-500/40'
        )}
      />
    </div>
  )
}
