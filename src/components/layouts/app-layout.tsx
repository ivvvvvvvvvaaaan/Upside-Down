'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { NavSidebar, PrimaryNavRail, ResizeHandle, ProjectBreadcrumb } from '@/components/ui'

/**
 * App Layout
 *
 * Shared layout with vertical logo bar and resizable navigation sidebar.
 * Sidebar width persists to localStorage.
 */

const SIDEBAR_MIN_WIDTH = 180
const SIDEBAR_MAX_WIDTH = 400
const SIDEBAR_DEFAULT_WIDTH = 240
const STORAGE_KEY = 'sidebar-width'

export interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH)
  const [isDragging, setIsDragging] = useState(false)
  const startWidthRef = useRef(SIDEBAR_DEFAULT_WIDTH)
  const currentWidthRef = useRef(SIDEBAR_DEFAULT_WIDTH)

  // Load saved width from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const width = parseInt(saved, 10)
      if (!isNaN(width) && width >= SIDEBAR_MIN_WIDTH && width <= SIDEBAR_MAX_WIDTH) {
        setSidebarWidth(width)
        currentWidthRef.current = width
      }
    }
  }, [])

  const handleDragStart = useCallback(() => {
    startWidthRef.current = sidebarWidth
    setIsDragging(true)
  }, [sidebarWidth])

  const handleDrag = useCallback((deltaX: number) => {
    const newWidth = Math.max(
      SIDEBAR_MIN_WIDTH,
      Math.min(SIDEBAR_MAX_WIDTH, startWidthRef.current + deltaX)
    )
    setSidebarWidth(newWidth)
    currentWidthRef.current = newWidth
  }, [])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    localStorage.setItem(STORAGE_KEY, String(currentWidthRef.current))
  }, [])

  return (
    <div className="h-screen bg-surface-flat flex overflow-hidden">
      <div className="hidden md:flex">
        <PrimaryNavRail />
        <NavSidebar width={sidebarWidth} />
        <ResizeHandle
          isDragging={isDragging}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <ProjectBreadcrumb />
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
