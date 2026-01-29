/**
 * ===========================================
 * PROJECT TEMPLATES
 * ===========================================
 *
 * Templates for generating multi-page project structures.
 * Used by new-project.mjs wizard.
 */

import { TEMPLATES, getTemplate } from './templates.mjs'

// Icon mapping for each page type
const PAGE_ICONS = {
  search: 'Search',
  gallery: 'Grid',
  manager: 'Folder',
  empty: 'FileText',
}

// Labels for each page type
const PAGE_LABELS = {
  search: 'Search',
  gallery: 'Gallery',
  manager: 'Manager',
  empty: 'Home',
}

/**
 * Generate layout.tsx for the project
 */
export function generateLayout({ projectName, navigation, navDepth, theme }) {
  const componentName = projectName
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')

  return `import { ConfigurableAppLayout } from '@/components/layouts'
import { navConfig } from './nav-config'

/**
 * ${componentName} Layout
 *
 * Navigation: ${navigation}
 * Depth: ${navDepth}
 * Theme: ${theme}
 */
export default function ${componentName}Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConfigurableAppLayout
      navigation="${navigation}"
      navDepth="${navDepth}"
      navConfig={navConfig}
    >
      {children}
    </ConfigurableAppLayout>
  )
}
`
}

/**
 * Generate nav-config.ts for the project
 */
export function generateNavConfig({ projectName, pages }) {
  const basePath = `/${projectName}`

  // Build nav items from selected pages
  const items = pages.map(pageType => {
    const slug = pageType === 'empty' ? '' : pageType
    const href = slug ? `${basePath}/${slug}` : basePath
    return {
      label: PAGE_LABELS[pageType] || pageType,
      href,
      icon: PAGE_ICONS[pageType] || 'FileText',
    }
  })

  const itemsString = items
    .map(item => `      { label: '${item.label}', href: '${item.href}', icon: '${item.icon}' },`)
    .join('\n')

  return `import type { NavConfig } from '@/types/navigation'

/**
 * Navigation Configuration
 *
 * This file defines the navigation structure for your project.
 * Edit the sections and items below to customize navigation.
 */
export const navConfig: NavConfig = {
  basePath: '${basePath}',
  sections: [
    {
      title: 'Pages',
      defaultOpen: true,
      items: [
${itemsString}
      ],
    },
  ],
}
`
}

/**
 * Generate redirect page.tsx for project root
 */
export function generateRedirectPage({ projectName, firstPage }) {
  const redirectPath = firstPage === 'empty'
    ? `/${projectName}`
    : `/${projectName}/${firstPage}`

  // If first page is empty, we don't redirect - we render the empty page at root
  if (firstPage === 'empty') {
    return generateRootPage({ projectName })
  }

  return `import { redirect } from 'next/navigation'

/**
 * Project Root - Redirects to first page
 */
export default function Page() {
  redirect('${redirectPath}')
}
`
}

/**
 * Generate a root page when 'empty' is the first/only page
 */
function generateRootPage({ projectName }) {
  const componentName = projectName
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')

  const title = projectName
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return `'use client'

import { Stack, Text, Card, Button } from '@/components/ui'

/**
 * ${title} - Home
 */
export default function ${componentName}Page() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Stack spacing="lg">

        {/* Header */}
        <Stack direction="horizontal" justify="between" align="center">
          <Stack spacing="xs">
            <Text variant="headline-1">${title}</Text>
            <Text variant="body-2" color="secondary">
              Welcome to your new project
            </Text>
          </Stack>
          <Button variant="primary">Get Started</Button>
        </Stack>

        <Card padding="lg">
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-border-subtle rounded-lg">
            <Text variant="body-1" color="secondary">Your content goes here</Text>
          </div>
        </Card>

      </Stack>
    </div>
  )
}
`
}

/**
 * Generate subpage files (page.tsx and view.tsx)
 * Wraps the existing templates for use within a project
 */
export function generateSubpage({ projectName, pageType }) {
  const title = projectName
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const pageTitle = PAGE_LABELS[pageType] || pageType
  const componentName = projectName
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') + (pageType.charAt(0).toUpperCase() + pageType.slice(1))

  // Use existing templates
  const templateResult = getTemplate(pageType, {
    title: `${title} - ${pageTitle}`,
    componentName,
    hasFilters: true,
    hasSidebar: false, // Sidebar is now at project layout level
  })

  // Handle both object and string returns from templates
  if (typeof templateResult === 'string') {
    return {
      'page.tsx': templateResult,
    }
  }

  return templateResult
}

/**
 * Get available page types for the wizard
 */
export function getPageOptions() {
  return Object.entries(TEMPLATES).map(([key, template]) => ({
    key,
    label: template.name,
    description: template.description,
  }))
}
