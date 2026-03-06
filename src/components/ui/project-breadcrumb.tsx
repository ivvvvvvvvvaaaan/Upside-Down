'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Project Breadcrumb
 *
 * Top-level horizontal breadcrumb navigation showing project context.
 * Displays: Project Name / Current Section
 *
 * Child components can append extra crumbs via useBreadcrumbExtras().
 */

// Route to display name mapping
const routeLabels: Record<string, string> = {
  '/nextgen': 'Media Library',
  '/nextgen/workspace': 'Workspace',
  '/nextgen/departments/art-design': 'Art & Design',
  '/nextgen/departments/camera': 'Camera',
  '/nextgen/departments/editorial': 'Editorial',
  '/nextgen/departments/vfx': 'VFX',
  '/nextgen/departments/audio-sound': 'Audio & Sound',
  '/nextgen/collections': 'All Collections',
  '/nextgen/collections/characters': 'Characters',
  '/nextgen/collections/locations': 'Locations',
  '/nextgen/collections/scenes': 'Scenes',
  '/nextgen/sharing/incoming': 'Incoming',
}

// Section groupings for breadcrumb hierarchy
const sectionPrefixes: { prefix: string; label: string }[] = [
  { prefix: '/nextgen/departments/', label: 'Departments' },
  { prefix: '/nextgen/collections/', label: 'Smart Collections' },
  { prefix: '/nextgen/sharing/', label: 'Sharing' },
]

export interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

// --- Breadcrumb extras context ---

interface BreadcrumbExtrasContextValue {
  extras: BreadcrumbItem[]
  setExtras: (items: BreadcrumbItem[]) => void
}

const BreadcrumbExtrasContext = createContext<BreadcrumbExtrasContextValue>({
  extras: [],
  setExtras: () => {},
})

export function BreadcrumbExtrasProvider({ children }: { children: React.ReactNode }) {
  const [extras, setExtras] = useState<BreadcrumbItem[]>([])
  return (
    <BreadcrumbExtrasContext.Provider value={{ extras, setExtras }}>
      {children}
    </BreadcrumbExtrasContext.Provider>
  )
}

/** Hook for child components to set extra breadcrumb items */
export function useBreadcrumbExtras() {
  const { setExtras } = useContext(BreadcrumbExtrasContext)

  const setBreadcrumbExtras = useCallback((items: BreadcrumbItem[]) => {
    setExtras(items)
  }, [setExtras])

  const clearBreadcrumbExtras = useCallback(() => {
    setExtras([])
  }, [setExtras])

  return { setBreadcrumbExtras, clearBreadcrumbExtras }
}

// --- Core breadcrumb logic ---

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [
    { label: 'Stranger Things S6', href: '/nextgen' },
  ]

  // Check if we're in a section
  const section = sectionPrefixes.find((s) => pathname.startsWith(s.prefix))

  if (section) {
    // Add section crumb
    const sectionHref =
      section.prefix === '/nextgen/collections/'
        ? '/nextgen/collections'
        : undefined
    crumbs.push({ label: section.label, href: sectionHref })
  }

  // Add the current page (with href so it becomes a link when extras are appended)
  const pageLabel = routeLabels[pathname]
  if (pageLabel && pageLabel !== 'Media Library') {
    // Don't duplicate if section label matches page label
    const lastCrumb = crumbs[crumbs.length - 1]
    if (lastCrumb.label !== pageLabel) {
      crumbs.push({ label: pageLabel, href: pathname })
    }
  }

  return crumbs
}

export function ProjectBreadcrumb() {
  const pathname = usePathname()
  const { extras } = useContext(BreadcrumbExtrasContext)

  // Only show on nextgen routes
  if (!pathname.startsWith('/nextgen')) {
    return null
  }

  // Resolve the base pathname (strip dynamic segments for sub-routes)
  let basePathname = pathname
  if (pathname.startsWith('/nextgen/workspace')) {
    // Workspace breadcrumbs are fully managed via extras from workspace-view
    basePathname = '/nextgen'
  } else if (pathname.startsWith('/nextgen/collections/') && !routeLabels[pathname]) {
    // Dynamic collection route like /nextgen/collections/user-123
    // Keep prefix so section crumb appears, but skip page label
    basePathname = pathname
  }
  const baseCrumbs = getBreadcrumbs(basePathname)

  const allCrumbs: BreadcrumbItem[] = [...baseCrumbs, ...extras]

  return (
    <div className="h-10 px-4 flex items-center border-b border-border-dim bg-surface-1">
      <nav className="flex items-center gap-1 text-body-0-regular">
        {allCrumbs.map((crumb, index) => {
          const isLast = index === allCrumbs.length - 1

          return (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="w-3 h-3 text-foreground-dim" />
              )}
              {!isLast && (crumb.href || crumb.onClick) ? (
                crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-foreground-subtle hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <button
                    onClick={crumb.onClick}
                    className="text-foreground-subtle hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </button>
                )
              ) : (
                <span
                  className={cn(
                    isLast ? 'text-foreground' : 'text-foreground-subtle'
                  )}
                >
                  {crumb.label}
                </span>
              )}
            </span>
          )
        })}
      </nav>
    </div>
  )
}
