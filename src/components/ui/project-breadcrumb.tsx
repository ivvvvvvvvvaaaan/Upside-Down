'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Settings, Map } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { SettingsModal } from './settings-modal'
import { UserJourneyModal } from './user-journey-modal'
import { PersonaPicker } from './persona-picker'
import { useIsMobile } from '@/hooks/useMediaQuery'

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
  '/nextgen': 'Search',
  '/nextgen/inbox': 'Inbox',
  '/nextgen/library': 'Cuts',
  '/nextgen/shared': 'Shared',
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
}

// Section groupings for breadcrumb hierarchy
const sectionPrefixes: { prefix: string; label: string }[] = [
  { prefix: '/nextgen/departments/', label: 'Departments' },
  { prefix: '/nextgen/collections/', label: 'Collections' },
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
    { label: 'Apex S1', href: '/nextgen' },
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
  if (pageLabel && pathname !== '/nextgen') {
    // Don't duplicate if section label matches page label
    const lastCrumb = crumbs[crumbs.length - 1]
    if (lastCrumb.label !== pageLabel) {
      crumbs.push({ label: pageLabel, href: pathname })
    }
  }

  return crumbs
}

function BreadcrumbCrumb({ crumb, isLast }: { crumb: BreadcrumbItem; isLast: boolean }) {
  if (!isLast && (crumb.href || crumb.onClick)) {
    return crumb.href ? (
      <Link
        href={crumb.href}
        className="text-foreground-subtle hover:text-foreground transition-colors whitespace-nowrap"
      >
        {crumb.label}
      </Link>
    ) : (
      <button
        onClick={crumb.onClick}
        className="text-foreground-subtle hover:text-foreground transition-colors whitespace-nowrap"
      >
        {crumb.label}
      </button>
    )
  }
  return (
    <span className={cn('whitespace-nowrap', isLast ? 'text-foreground truncate' : 'text-foreground-subtle')}>
      {crumb.label}
    </span>
  )
}

export function ProjectBreadcrumb() {
  const pathname = usePathname()
  const { extras } = useContext(BreadcrumbExtrasContext)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [journeyOpen, setJourneyOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const isMobile = useIsMobile()

  // Reset collapsed state on navigation
  useEffect(() => { setExpanded(false) }, [pathname])

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

  // On mobile with 3+ crumbs, collapse middle segments to [...]
  const shouldCollapse = isMobile && !expanded && allCrumbs.length > 2
  const visibleCrumbs = shouldCollapse
    ? [allCrumbs[0], allCrumbs[allCrumbs.length - 1]]
    : allCrumbs

  return (
    <div className="h-12 px-4 flex items-center justify-between border-b border-border-dim bg-surface-1 min-w-0">
      <nav className="flex items-center gap-1 text-body-0-regular min-w-0 overflow-hidden">
        {visibleCrumbs.map((crumb, index) => {
          const isLast = index === visibleCrumbs.length - 1

          return (
            <span key={index} className="flex items-center gap-1 min-w-0">
              {index > 0 && (
                <>
                  <ChevronRight className="w-3 h-3 text-foreground-dim flex-shrink-0" />
                  {shouldCollapse && index === 1 && (
                    <>
                      <button
                        onClick={() => setExpanded(true)}
                        className="text-foreground-subtle hover:text-foreground transition-colors px-0.5"
                        aria-label="Show full path"
                      >
                        &hellip;
                      </button>
                      <ChevronRight className="w-3 h-3 text-foreground-dim flex-shrink-0" />
                    </>
                  )}
                </>
              )}
              <BreadcrumbCrumb crumb={crumb} isLast={isLast} />
            </span>
          )
        })}
      </nav>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="tertiary"
          compact
          icon={<Map className="w-3.5 h-3.5" />}
          onClick={() => setJourneyOpen(true)}
        >
          <span className="hidden md:inline">User Journey</span>
        </Button>
        <Button
          variant="icon"
          compact
          onClick={() => setSettingsOpen(true)}
          aria-label="Permissions settings"
        >
          <Settings className="w-4 h-4" />
        </Button>
        <PersonaPicker compact showLabel />
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <UserJourneyModal open={journeyOpen} onClose={() => setJourneyOpen(false)} />
    </div>
  )
}
