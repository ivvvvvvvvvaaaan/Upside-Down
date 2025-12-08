#!/usr/bin/env node

/**
 * Create a new prototype page
 * Usage: npm run new:page <page-name>
 */

import fs from 'fs'
import path from 'path'

const pageName = process.argv[2]

if (!pageName) {
  console.error('❌ Please provide a page name')
  console.log('   Usage: npm run new:page <page-name>')
  console.log('   Example: npm run new:page checkout-flow')
  process.exit(1)
}

// Convert to valid path (kebab-case)
const slug = pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Convert to title case
const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

// Component name (PascalCase)
const componentName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')

const pageDir = path.join(process.cwd(), 'src', 'app', slug)
const pagePath = path.join(pageDir, 'page.tsx')

// Check if exists
if (fs.existsSync(pageDir)) {
  console.error(`❌ Page "${slug}" already exists`)
  process.exit(1)
}

// Create directory
fs.mkdirSync(pageDir, { recursive: true })

// Page template
const pageContent = `'use client'

import { useState } from 'react'
import { Stack, Text, Card, Button } from '@/components/ui'

/*
 * ===========================================
 * ${title.toUpperCase()} PROTOTYPE
 * ===========================================
 * TODO: Describe what this prototype explores
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
              Prototype description goes here
            </Text>
          </Stack>
          <Button variant="primary">Primary Action</Button>
        </Stack>

        {/* Content */}
        <Card padding="lg">
          <Stack spacing="md">
            <Text variant="headline-3">Getting Started</Text>
            <Text variant="body-1">
              Start building your prototype here. Check the docs folder for component references and patterns.
            </Text>
          </Stack>
        </Card>

        {/* Add your prototype content below */}
        
      </Stack>
    </div>
  )
}
`

// Write file
fs.writeFileSync(pagePath, pageContent)

console.log('')
console.log('✅ Created new prototype!')
console.log('')
console.log(`   📁 src/app/${slug}/`)
console.log(`   📄 page.tsx`)
console.log('')
console.log(`🚀 View at: http://localhost:3000/${slug}`)
console.log('')
