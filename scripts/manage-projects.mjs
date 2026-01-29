#!/usr/bin/env node

/**
 * ===========================================
 * PROJECT MANAGEMENT
 * ===========================================
 *
 * List and delete generated prototype projects.
 * Protects system folders and core app components.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ask, askSelect, askMultiSelect, colors } from './utils.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_DIR = path.join(__dirname, '..', 'src', 'app')

// System folders that should NEVER be deleted
const PROTECTED_FOLDERS = [
  'api',
  'examples',
  'fonts',
]

/**
 * Get all user-created projects (excludes protected folders)
 */
function getProjects() {
  const entries = fs.readdirSync(APP_DIR, { withFileTypes: true })

  return entries
    .filter(entry => {
      if (!entry.isDirectory()) return false
      if (PROTECTED_FOLDERS.includes(entry.name)) return false
      if (entry.name.startsWith('_')) return false

      // Must have a page.tsx to be considered a project
      const pagePath = path.join(APP_DIR, entry.name, 'page.tsx')
      return fs.existsSync(pagePath)
    })
    .map(entry => {
      const slug = entry.name
      const projectDir = path.join(APP_DIR, slug)

      // Count files in project
      const fileCount = countFiles(projectDir)

      // Check if it has a layout (generated project) or just page (legacy)
      const hasLayout = fs.existsSync(path.join(projectDir, 'layout.tsx'))
      const type = hasLayout ? 'project' : 'page'

      return {
        slug,
        name: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        path: projectDir,
        fileCount,
        type,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Count files recursively in a directory
 */
function countFiles(dir) {
  let count = 0
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      count += countFiles(path.join(dir, entry.name))
    } else {
      count++
    }
  }

  return count
}

/**
 * Delete a project directory
 */
function deleteProject(projectPath) {
  fs.rmSync(projectPath, { recursive: true, force: true })
}

async function main() {
  console.log(`
${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
${colors.cyan}  PROJECT MANAGEMENT${colors.reset}
${colors.dim}  List and delete generated prototypes${colors.reset}
${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
`)

  const projects = getProjects()

  if (projects.length === 0) {
    console.log(`${colors.dim}No user-created projects found.${colors.reset}`)
    console.log(`\n${colors.dim}Protected folders (not shown): ${PROTECTED_FOLDERS.join(', ')}${colors.reset}`)
    process.exit(0)
  }

  // Show current projects
  console.log(`${colors.bright}Your projects:${colors.reset}\n`)

  projects.forEach((project, i) => {
    const typeLabel = project.type === 'project'
      ? `${colors.cyan}[multi-page]${colors.reset}`
      : `${colors.dim}[single page]${colors.reset}`
    console.log(`  ${i + 1}. ${project.name} ${typeLabel}`)
    console.log(`     ${colors.dim}/${project.slug} • ${project.fileCount} files${colors.reset}`)
  })

  console.log(`\n${colors.dim}Protected folders (cannot delete): ${PROTECTED_FOLDERS.join(', ')}${colors.reset}`)

  // Ask what to do
  const action = await askSelect('What would you like to do?', [
    { key: 'delete', label: 'Delete projects', description: 'Remove selected prototypes' },
    { key: 'back', label: 'Go back', description: 'Return to main menu' },
  ], 'back')

  if (action === 'back') {
    process.exit(0)
  }

  // Select projects to delete
  const projectOptions = projects.map(p => ({
    key: p.slug,
    label: p.name,
    description: `${p.fileCount} files, ${p.type}`,
  }))

  const toDelete = await askMultiSelect(
    'Select projects to delete:',
    projectOptions,
    []
  )

  if (toDelete.length === 0) {
    console.log(`\n${colors.dim}No projects selected.${colors.reset}`)
    process.exit(0)
  }

  // Confirm deletion
  const selectedNames = toDelete.map(slug =>
    projects.find(p => p.slug === slug)?.name
  ).join(', ')

  console.log(`\n${colors.yellow}Warning: This will permanently delete:${colors.reset}`)
  toDelete.forEach(slug => {
    const project = projects.find(p => p.slug === slug)
    console.log(`  - ${project.name} (${project.fileCount} files)`)
  })

  const confirm = await ask(`\nType "delete" to confirm: `)

  if (confirm.toLowerCase() !== 'delete') {
    console.log(`\n${colors.dim}Cancelled.${colors.reset}`)
    process.exit(0)
  }

  // Delete selected projects
  console.log('')
  for (const slug of toDelete) {
    const project = projects.find(p => p.slug === slug)
    deleteProject(project.path)
    console.log(`${colors.green}✓${colors.reset} Deleted ${project.name}`)
  }

  console.log(`\n${colors.green}Done!${colors.reset} Deleted ${toDelete.length} project(s).`)
}

main().catch(err => {
  console.error(`${colors.yellow}Error:${colors.reset}`, err.message)
  process.exit(1)
})
