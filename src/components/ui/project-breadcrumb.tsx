'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Project Breadcrumb
 *
 * Top-level horizontal breadcrumb navigation showing project context.
 * Displays: Project Name / Current Section
 */

// Route to display name mapping
const routeLabels: Record<string, string> = {
  '/nextgen': 'Media Library',
  '/nextgen/assets': 'All Assets',
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

interface BreadcrumbItem {
  label: string
  href?: string
}

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [
    { label: 'Stranger Things S6', href: '/nextgen' },
  ]

  // Check if we're in a section
  const section = sectionPrefixes.find((s) => pathname.startsWith(s.prefix))

  if (section) {
    // Add section crumb
    const sectionHref =
      section.prefix === '/nextgen/departments/'
        ? '/nextgen/assets'
        : section.prefix === '/nextgen/collections/'
          ? '/nextgen/collections'
          : undefined
    crumbs.push({ label: section.label, href: sectionHref })
  }

  // Add the current page
  const pageLabel = routeLabels[pathname]
  if (pageLabel && pageLabel !== 'Media Library') {
    // Don't duplicate if section label matches page label
    const lastCrumb = crumbs[crumbs.length - 1]
    if (lastCrumb.label !== pageLabel) {
      crumbs.push({ label: pageLabel })
    }
  }

  return crumbs
}

export function ProjectBreadcrumb() {
  const pathname = usePathname()

  // Only show on nextgen routes
  if (!pathname.startsWith('/nextgen')) {
    return null
  }

  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <div className="h-10 px-4 flex items-center border-b border-border-dim bg-surface-1">
      <nav className="flex items-center gap-1 text-body-0-regular">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="w-3 h-3 text-foreground-dim" />
              )}
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="text-foreground-subtle hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
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
