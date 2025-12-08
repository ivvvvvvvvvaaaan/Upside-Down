'use client'

import Link from 'next/link'
import { Stack, Text, Card, Button, Badge } from '@/components/ui'
import { Rocket, BookOpen, Zap, ExternalLink } from 'lucide-react'

/*
 * ===========================================
 * PROTOTYPE FACTORY HOME
 * ===========================================
 * Landing page with links to examples and docs.
 */

const examples = [
  {
    name: 'Dashboard',
    description: 'Stats cards, data tables, tabs, and filters',
    href: '/examples/dashboard',
    tags: ['layout', 'data'],
  },
  {
    name: 'Gallery',
    description: 'Media grid with cards, selection, and modal preview',
    href: '/examples/gallery',
    tags: ['grid', 'modal'],
  },
]

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Stack spacing="xl">
        
        {/* Hero */}
        <Stack spacing="md">
          <Stack direction="horizontal" spacing="sm" align="center">
            <Rocket className="w-8 h-8 text-primary-500" />
            <Text variant="headline-1">Prototype Factory</Text>
          </Stack>
          <Text variant="body-1" color="secondary" className="max-w-2xl">
            Rapidly build clickable prototypes with pre-built components that match our design system. 
            No engineering setup required — just clone, install, and start prototyping.
          </Text>
        </Stack>

        {/* Quick start */}
        <Card variant="outlined" padding="lg">
          <Stack spacing="md">
            <Stack direction="horizontal" spacing="sm" align="center">
              <Zap className="w-5 h-5 text-primary-500" />
              <Text variant="headline-3">Quick Start</Text>
            </Stack>
            <Stack spacing="sm">
              <code className="block bg-gray-900 text-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                <span className="text-gray-500"># Create a new prototype page</span>{'\n'}
                npm run new:page my-feature
              </code>
              <Text variant="body-2" color="secondary">
                This creates a new page at <code className="text-primary-500">/my-feature</code> with boilerplate ready to customize.
              </Text>
            </Stack>
          </Stack>
        </Card>

        {/* Examples */}
        <Stack spacing="md">
          <Text variant="headline-2">Examples</Text>
          <div className="grid gap-4 sm:grid-cols-2">
            {examples.map((example) => (
              <Link key={example.href} href={example.href}>
                <Card variant="elevated" padding="lg" className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <Stack spacing="sm">
                    <Text variant="headline-4">{example.name}</Text>
                    <Text variant="body-2" color="secondary">{example.description}</Text>
                    <Stack direction="horizontal" spacing="xs">
                      {example.tags.map(tag => (
                        <Badge key={tag} size="sm">{tag}</Badge>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              </Link>
            ))}
          </div>
        </Stack>

        {/* Resources */}
        <Stack spacing="md">
          <Stack direction="horizontal" spacing="sm" align="center">
            <BookOpen className="w-5 h-5 text-content-secondary" />
            <Text variant="headline-2">Resources</Text>
          </Stack>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card padding="md">
              <Stack spacing="xs">
                <Text variant="body-1" weight="medium">📚 Components</Text>
                <Text variant="caption" color="secondary">docs/COMPONENTS.md</Text>
              </Stack>
            </Card>
            <Card padding="md">
              <Stack spacing="xs">
                <Text variant="body-1" weight="medium">🎨 Patterns</Text>
                <Text variant="caption" color="secondary">docs/PATTERNS.md</Text>
              </Stack>
            </Card>
            <Card padding="md">
              <Stack spacing="xs">
                <Text variant="body-1" weight="medium">🤖 AI Prompts</Text>
                <Text variant="caption" color="secondary">docs/PROMPTS.md</Text>
              </Stack>
            </Card>
          </div>
        </Stack>

        {/* Footer tip */}
        <Card variant="default" padding="md">
          <Stack direction="horizontal" spacing="sm" align="center">
            <Text variant="body-2" color="secondary">
              💡 Toggle dark mode with the button in the top-right corner. 
              All components automatically adapt.
            </Text>
          </Stack>
        </Card>
        
      </Stack>
    </div>
  )
}
