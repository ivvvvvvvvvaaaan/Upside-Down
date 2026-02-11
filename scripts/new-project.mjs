#!/usr/bin/env node

/**
 * ===========================================
 * NEW PROJECT WIZARD
 * ===========================================
 *
 * Interactive CLI for creating multi-page prototype projects.
 *
 * USAGE:
 *   npm run new:project
 *   node scripts/new-project.mjs
 *
 * WHAT IT CREATES:
 *   src/app/{project-name}/
 *   ├── layout.tsx         # ConfigurableAppLayout wrapper
 *   ├── nav-config.ts      # Navigation configuration
 *   ├── page.tsx           # Root page (redirect or content)
 *   └── {page-type}/       # One folder per selected page
 *       ├── page.tsx
 *       └── view.tsx
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  ask,
  askSelect,
  askMultiSelect,
  slugify,
  titleCase,
  colors,
} from './utils.mjs'
import {
  generateLayout,
  generateNavConfig,
  generateRedirectPage,
  generateSubpage,
  getPageOptions,
} from './project-templates.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_DIR = path.join(__dirname, '..', 'src', 'app')

// Navigation options
const NAV_OPTIONS = [
  { key: 'vertical', label: 'Vertical nav', description: 'Sidebar navigation (like nextgen)' },
  { key: 'horizontal', label: 'Horizontal nav', description: 'Top bar navigation with tiers' },
  { key: 'none', label: 'No navigation', description: 'Content only, no nav chrome' },
]

// Theme options
const THEME_OPTIONS = [
  { key: 'dark', label: 'Dark', description: 'Dark theme by default' },
  { key: 'light', label: 'Light', description: 'Light theme by default' },
]

// Nav depth options
const NAV_DEPTH_OPTIONS = [
  { key: 'two-level', label: 'Two levels', description: 'Rail + sidebar (full navigation)' },
  { key: 'one-level', label: 'One level', description: 'Sidebar only (compact navigation)' },
]

async function main() {
  console.log(`
${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
${colors.cyan}  NEW PROJECT WIZARD${colors.reset}
${colors.dim}  Create a multi-page prototype with navigation${colors.reset}
${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
`)

  // Step 1: Project name
  const rawName = await ask(`${colors.bright}Project name${colors.reset} (e.g., asset-browser): `)

  if (!rawName.trim()) {
    console.log(`${colors.yellow}Project name is required${colors.reset}`)
    process.exit(1)
  }

  const projectName = slugify(rawName)
  const projectDir = path.join(APP_DIR, projectName)

  // Check if project already exists
  if (fs.existsSync(projectDir)) {
    console.log(`${colors.yellow}Project "${projectName}" already exists at ${projectDir}${colors.reset}`)
    const overwrite = await ask('Overwrite? (y/N): ')
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Cancelled.')
      process.exit(0)
    }
    // Remove existing directory
    fs.rmSync(projectDir, { recursive: true })
  }

  // Step 2: Navigation type
  const navigation = await askSelect('Navigation type?', NAV_OPTIONS, 'vertical')

  // Step 3: Theme
  const theme = await askSelect('Default theme?', THEME_OPTIONS, 'dark')

  // Step 4: Nav depth (only if navigation is not 'none')
  let navDepth = 'two-level'
  if (navigation !== 'none') {
    navDepth = await askSelect('Navigation depth?', NAV_DEPTH_OPTIONS, 'two-level')
  }

  // Step 5: Pages to include (multi-select)
  const pageOptions = getPageOptions()
  const selectedPages = await askMultiSelect(
    'Which pages to include?',
    pageOptions,
    ['gallery'] // Default to gallery
  )

  if (selectedPages.length === 0) {
    console.log(`${colors.yellow}You must select at least one page${colors.reset}`)
    process.exit(1)
  }

  // Generate project structure
  console.log(`
${colors.bright}Creating project...${colors.reset}
`)

  // Create project directory
  fs.mkdirSync(projectDir, { recursive: true })

  // Generate layout.tsx
  const layoutContent = generateLayout({ projectName, navigation, navDepth, theme })
  fs.writeFileSync(path.join(projectDir, 'layout.tsx'), layoutContent)
  console.log(`  ${colors.green}✓${colors.reset} layout.tsx`)

  // Generate nav-config.ts (only if navigation is not 'none')
  if (navigation !== 'none') {
    const navConfigContent = generateNavConfig({ projectName, pages: selectedPages })
    fs.writeFileSync(path.join(projectDir, 'nav-config.ts'), navConfigContent)
    console.log(`  ${colors.green}✓${colors.reset} nav-config.ts`)
  } else {
    // Create a minimal nav-config for the layout import
    const minimalNavConfig = `import type { NavConfig } from '@/types/navigation'

export const navConfig: NavConfig = {
  basePath: '/${projectName}',
  sections: [],
}
`
    fs.writeFileSync(path.join(projectDir, 'nav-config.ts'), minimalNavConfig)
    console.log(`  ${colors.green}✓${colors.reset} nav-config.ts (minimal)`)
  }

  // Generate root page.tsx
  const firstPage = selectedPages[0]
  const rootPageContent = generateRedirectPage({ projectName, firstPage })
  fs.writeFileSync(path.join(projectDir, 'page.tsx'), rootPageContent)
  console.log(`  ${colors.green}✓${colors.reset} page.tsx`)

  // Generate subpages
  for (const pageType of selectedPages) {
    // Skip 'empty' if it's the only page (handled by root page)
    if (pageType === 'empty' && selectedPages.length === 1) {
      continue
    }

    // Skip 'empty' as a subpage if it's the first page (rendered at root)
    if (pageType === 'empty' && firstPage === 'empty') {
      continue
    }

    const subpageDir = path.join(projectDir, pageType)
    fs.mkdirSync(subpageDir, { recursive: true })

    const subpageFiles = generateSubpage({ projectName, pageType })

    for (const [filename, content] of Object.entries(subpageFiles)) {
      fs.writeFileSync(path.join(subpageDir, filename), content)
    }

    console.log(`  ${colors.green}✓${colors.reset} ${pageType}/`)
  }

  // Summary
  const projectUrl = `http://localhost:3000/${projectName}`
  const title = titleCase(projectName)

  console.log(`
${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
${colors.green}  ✓ Project "${title}" created!${colors.reset}
${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}

${colors.dim}Location:${colors.reset}  src/app/${projectName}/
${colors.dim}URL:${colors.reset}       ${projectUrl}
${colors.dim}Pages:${colors.reset}     ${selectedPages.join(', ')}

${colors.dim}Next steps:${colors.reset}
  1. Start the dev server: ${colors.cyan}npm run dev${colors.reset}
  2. Open ${colors.cyan}${projectUrl}${colors.reset}
  3. Edit files in src/app/${projectName}/
`)

  // Ask if user wants to start dev server
  const startServer = await ask('Start dev server now? (Y/n): ')
  if (startServer.toLowerCase() !== 'n') {
    console.log(`\n${colors.dim}Starting dev server...${colors.reset}\n`)
    const { spawn } = await import('child_process')
    spawn('npm', ['run', 'dev'], { stdio: 'inherit' })
  }
}

main().catch(err => {
  console.error(`${colors.yellow}Error:${colors.reset}`, err.message)
  process.exit(1)
})
