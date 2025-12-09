#!/usr/bin/env node

/**
 * Create a new prototype page
 * Usage: npm run new:page <page-name>
 */

import fs from 'fs'
import path from 'path'
import { getTemplate, TEMPLATES } from './templates.mjs'
import { ask } from './utils.mjs'

async function main() {
  // 1. Get Page Name
  let pageName = process.argv[2]
  
  if (!pageName) {
    console.log('✨ Creating a new prototype page\n')
    pageName = await ask('   Name of your page (e.g. "asset-library"): ')
  }

  // Trim and validate
  pageName = pageName?.trim()
  if (!pageName) {
    console.error('\n❌ Please provide a page name')
    process.exit(1)
  }

  // 2. Get Template Type
  let type = process.argv.find(arg => arg.startsWith('--type='))?.split('=')[1]

  if (!type) {
    console.log('\n   Choose a template:')
    Object.entries(TEMPLATES).forEach(([key, t]) => {
      console.log(`   ${key.padEnd(10)} - ${t.name} (${t.description})`)
    })
    console.log('')
    
    const answer = await ask('   Template (default: empty): ')
    type = answer.trim() || 'empty'
  }

  // 3. Get Features
  const templateConfig = TEMPLATES[type]
  let hasFilters = false
  let hasSidebar = false

  // Ask about sidebar if template supports it
  if (templateConfig?.features?.includes('hasSidebar')) {
    const sidebarAnswer = await ask('   Include sidebar navigation? (Y/n): ')
    hasSidebar = sidebarAnswer.toLowerCase() !== 'n'
  }

  // Ask about filters if template supports it
  if (templateConfig?.features?.includes('hasFilters')) {
    const filterAnswer = await ask('   Include search and filters? (Y/n): ')
    hasFilters = filterAnswer.toLowerCase() !== 'n'
  }

  console.log('\n⚙️  Configuring page...')

  // Convert to valid path (kebab-case)
  const slug = pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  
  // Convert to title case
  const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  
  // Component name (PascalCase)
  const componentName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')

  const pageDir = path.join(process.cwd(), 'src', 'app', slug)
  const pagePath = path.join(pageDir, 'page.tsx')

  console.log(`📁 Directory: src/app/${slug}`)

  // Check if exists
  if (fs.existsSync(pageDir)) {
    console.error(`\n❌ Page "${slug}" already exists at src/app/${slug}`)
    console.error('   Please choose a different name or delete the existing directory.')
    process.exit(1)
  }

  // Create directory
  console.log('📂 Creating directory...')
  fs.mkdirSync(pageDir, { recursive: true })

  // Get Content
  console.log('📄 Generating templates...')
  const templateResult = getTemplate(type, { title, componentName, hasFilters, hasSidebar })

  // Write file(s)
  if (typeof templateResult === 'string') {
    // Legacy single file
    fs.writeFileSync(pagePath, templateResult)
    console.log(`   ✔ page.tsx created`)
  } else {
    // Multi-file
    Object.entries(templateResult).forEach(([filename, content]) => {
      fs.writeFileSync(path.join(pageDir, filename), content)
      console.log(`   ✔ ${filename} created`)
    })
  }

  console.log('')
  console.log('✅ Created new prototype!')
  console.log('')
  console.log(`   Template: ${TEMPLATES[type]?.name || type}`)
  
  // Only show features if there are any
  const features = []
  if (hasSidebar) features.push('Sidebar')
  if (hasFilters) features.push('Filters')
  if (features.length > 0) {
    console.log(`   Features: ${features.join(', ')}`)
  }
  
  console.log(`   Path:     src/app/${slug}/`)
  console.log('')
  console.log(`🚀 View at: http://localhost:3000/${slug}`)
  console.log('')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
