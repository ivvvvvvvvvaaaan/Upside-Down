'use client'

import { useRef, useCallback, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { WindowState } from '../view'

// macOS traffic light colors - intentionally hardcoded to match macOS exactly
// This is a documented exception to the Hawkins design system
const TRAFFIC_LIGHT_CLOSE = '#FF5F57'
const TRAFFIC_LIGHT_MINIMIZE = '#FFBD2E'
const TRAFFIC_LIGHT_MAXIMIZE = '#28C840'
const TRAFFIC_LIGHT_DISABLED = '#4D4D4D'

type ResizeCorner = 'ne' | 'se' | 'sw' | 'nw'

interface DesktopWindowProps {
  window: WindowState
  isActive: boolean
  canClose?: boolean
  onFocus: () => void
  onMove: (x: number, y: number) => void
  onResize: (width: number, height: number, x?: number, y?: number) => void
  onMinimize: () => void
  onMaximize: () => void
  onClose?: () => void
  children: ReactNode
}

export function DesktopWindow({
  window,
  isActive,
  canClose = true,
  onFocus,
  onMove,
  onResize,
  onMinimize,
  onMaximize,
  onClose,
  children,
}: DesktopWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  // Drag handler for title bar
  const handleTitleBarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (window.isMaximized) return
      e.preventDefault()
      onFocus()

      const startX = e.clientX
      const startY = e.clientY
      const startWindowX = window.x
      const startWindowY = window.y

      setIsDragging(true)

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX
        const deltaY = moveEvent.clientY - startY

        // Constrain to keep title bar visible (at least 100px from left, top >= 0)
        const newX = Math.max(-window.width + 100, startWindowX + deltaX)
        const newY = Math.max(0, startWindowY + deltaY)

        onMove(newX, newY)
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        setIsDragging(false)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'move'
      document.body.style.userSelect = 'none'
    },
    [window.x, window.y, window.width, window.isMaximized, onFocus, onMove]
  )

  // Resize handler for corners
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, corner: ResizeCorner) => {
      if (window.isMaximized) return
      e.preventDefault()
      e.stopPropagation()
      onFocus()

      const startX = e.clientX
      const startY = e.clientY
      const startWidth = window.width
      const startHeight = window.height
      const startWindowX = window.x
      const startWindowY = window.y

      setIsResizing(true)

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX
        const deltaY = moveEvent.clientY - startY

        let newWidth = startWidth
        let newHeight = startHeight
        let newX = startWindowX
        let newY = startWindowY

        // Handle horizontal resize
        if (corner === 'ne' || corner === 'se') {
          // Resize from right edge
          newWidth = startWidth + deltaX
        } else {
          // Resize from left edge - also moves window
          newWidth = startWidth - deltaX
          newX = startWindowX + deltaX
        }

        // Handle vertical resize
        if (corner === 'sw' || corner === 'se') {
          // Resize from bottom edge
          newHeight = startHeight + deltaY
        } else {
          // Resize from top edge - also moves window
          newHeight = startHeight - deltaY
          newY = startWindowY + deltaY
        }

        onResize(newWidth, newHeight, newX, newY)
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        setIsResizing(false)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      // Set appropriate cursor based on corner
      const cursors: Record<ResizeCorner, string> = {
        ne: 'nesw-resize',
        se: 'nwse-resize',
        sw: 'nesw-resize',
        nw: 'nwse-resize',
      }
      document.body.style.cursor = cursors[corner]
      document.body.style.userSelect = 'none'
    },
    [window.width, window.height, window.x, window.y, window.isMaximized, onFocus, onResize]
  )

  return (
    <div
      ref={windowRef}
      className={cn(
        'absolute flex flex-col bg-surface-low rounded-lg overflow-hidden',
        'border border-border-dim',
        isActive ? 'shadow-high' : 'shadow-mid',
        (isDragging || isResizing) && 'will-change-transform'
      )}
      style={{
        left: window.x,
        top: window.y,
        width: window.width,
        height: window.height,
        zIndex: window.zIndex,
      }}
      onMouseDown={onFocus}
    >
      {/* Title Bar */}
      <div
        className={cn(
          'h-10 px-3 flex items-center gap-3 flex-shrink-0',
          'bg-surface-mid border-b border-border-dim',
          !window.isMaximized && 'cursor-move'
        )}
        onMouseDown={handleTitleBarMouseDown}
      >
        {/* Traffic Light Buttons */}
        <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={() => canClose && onClose?.()}
            disabled={!canClose}
            className={cn(
              'w-3 h-3 rounded-full transition-opacity',
              canClose ? 'hover:opacity-80' : 'cursor-not-allowed'
            )}
            style={{ backgroundColor: canClose ? TRAFFIC_LIGHT_CLOSE : TRAFFIC_LIGHT_DISABLED }}
            aria-label="Close"
          />
          <button
            onClick={onMinimize}
            className="w-3 h-3 rounded-full hover:opacity-80 transition-opacity"
            style={{ backgroundColor: TRAFFIC_LIGHT_MINIMIZE }}
            aria-label="Minimize"
          />
          <button
            onClick={onMaximize}
            className="w-3 h-3 rounded-full hover:opacity-80 transition-opacity"
            style={{ backgroundColor: TRAFFIC_LIGHT_MAXIMIZE }}
            aria-label="Maximize"
          />
        </div>

        {/* Window Title */}
        <span className="flex-1 text-body-0-bold text-foreground text-center truncate select-none">
          {window.title}
        </span>

        {/* Spacer to balance traffic lights */}
        <div className="w-14" />
      </div>

      {/* Window Content */}
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>

      {/* Resize Handles (4 corners) */}
      {!window.isMaximized && (
        <>
          {/* Top-left */}
          <div
            className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize z-10"
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          />
          {/* Top-right */}
          <div
            className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize z-10"
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          />
          {/* Bottom-left */}
          <div
            className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize z-10"
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          />
          {/* Bottom-right */}
          <div
            className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize z-10"
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          />
        </>
      )}
    </div>
  )
}
