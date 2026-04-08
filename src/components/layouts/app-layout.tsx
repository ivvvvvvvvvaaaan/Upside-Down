'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { NavSidebar, PrimaryNavRail, ResizeHandle, ProjectBreadcrumb, NewCollectionModal } from '@/components/ui'
import { useUserCollections, useSmartCollections } from '@/hooks'
import type { AssetFilter } from '@/lib/data'

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
  hideNav?: boolean
}

export function AppLayout({ children, hideNav = false }: AppLayoutProps) {
  const router = useRouter()
  const { createCollection: createUserCollection } = useUserCollections()
  const { createCollection: createSmartCollection } = useSmartCollections()

  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH)
  const [isDragging, setIsDragging] = useState(false)
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false)
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
      {/* Primary nav rail — full height, touches top of browser */}
      {!hideNav && (
        <div className="hidden md:flex">
          <PrimaryNavRail />
        </div>
      )}

      {/* Right side: breadcrumb + sidebar + content */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <ProjectBreadcrumb />
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {!hideNav && (
            <div className="hidden md:flex">
              <NavSidebar width={sidebarWidth} onNewCollection={() => setShowNewCollectionModal(true)} />
              <ResizeHandle
                isDragging={isDragging}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {children}
          </div>
        </div>
      </div>

      <NewCollectionModal
        open={showNewCollectionModal}
        onOpenChange={setShowNewCollectionModal}
        onCreateCollection={(name) => {
          const collection = createUserCollection(name, [])
          setShowNewCollectionModal(false)
          router.push(`/nextgen/collections/${collection.id}`)
        }}
        onCreateSmartCollection={(name: string, filter: AssetFilter) => {
          const collection = createSmartCollection(name, 'filter', filter)
          setShowNewCollectionModal(false)
          router.push(`/nextgen/collections/${collection.id}`)
        }}
      />
    </div>
  )
}
