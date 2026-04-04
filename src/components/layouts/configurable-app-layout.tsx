'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { NavSidebar, PrimaryNavRail, ResizeHandle, HorizontalNavbar } from '@/components/ui'
import type { NavConfig, NavigationType, NavDepth, ThemePreference } from '@/types/navigation'

/**
 * Configurable App Layout
 *
 * Flexible layout component for generated projects.
 * Supports vertical navigation (1 or 2 levels), horizontal (coming soon), or none.
 */

const SIDEBAR_MIN_WIDTH = 180
const SIDEBAR_MAX_WIDTH = 400
const SIDEBAR_DEFAULT_WIDTH = 240

export interface ConfigurableAppLayoutProps {
  children: React.ReactNode
  /** Navigation type: vertical, horizontal, or none */
  navigation: NavigationType
  /** Navigation configuration for dynamic nav items */
  navConfig?: NavConfig
  /** Navigation depth: one-level (sidebar only) or two-level (rail + sidebar) */
  navDepth?: NavDepth
  /** Theme preference (for generated projects) */
  theme?: ThemePreference
  /** Storage key for sidebar width persistence */
  storageKey?: string
}

/** @public Used by generated project templates in scripts/project-templates.mjs */
export function ConfigurableAppLayout({
  children,
  navigation,
  navConfig,
  navDepth = 'two-level',
  theme: _theme,
  storageKey = 'sidebar-width',
}: ConfigurableAppLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH)
  const [isDragging, setIsDragging] = useState(false)
  const startWidthRef = useRef(SIDEBAR_DEFAULT_WIDTH)
  const currentWidthRef = useRef(SIDEBAR_DEFAULT_WIDTH)

  // Load saved width from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const width = parseInt(saved, 10)
      if (!isNaN(width) && width >= SIDEBAR_MIN_WIDTH && width <= SIDEBAR_MAX_WIDTH) {
        setSidebarWidth(width)
        currentWidthRef.current = width
      }
    }
  }, [storageKey])

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
    localStorage.setItem(storageKey, String(currentWidthRef.current))
  }, [storageKey])

  // No navigation - just render children
  if (navigation === 'none') {
    return (
      <div className="h-screen bg-surface-flat overflow-hidden">
        {children}
      </div>
    )
  }

  // Horizontal navigation
  if (navigation === 'horizontal') {
    const showSecondaryNav = navDepth === 'two-level'
    const projectName = navConfig?.basePath?.replace('/', '') || 'Project'

    return (
      <div className="h-screen bg-surface-flat flex flex-col overflow-hidden">
        <HorizontalNavbar
          navConfig={navConfig}
          showSecondaryNav={showSecondaryNav}
          productName={projectName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
        />
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </div>
    )
  }

  // Vertical navigation
  const showRail = navDepth === 'two-level'

  return (
    <div className="h-screen bg-surface-flat flex overflow-hidden">
      <div className="hidden md:flex">
        {showRail && <PrimaryNavRail />}
        <NavSidebar width={sidebarWidth} navConfig={navConfig} />
        <ResizeHandle
          isDragging={isDragging}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
