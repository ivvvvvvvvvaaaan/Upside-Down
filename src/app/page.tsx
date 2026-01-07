import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { Stack, Text, Card, Badge } from '@/components/ui'
import { Rocket, BookOpen, Zap, FolderOpen, Sparkles } from 'lucide-react'

/*
 * ===========================================
 * PROTOTYPE FACTORY HOME
 * ===========================================
 * Landing page with auto-discovered projects and examples.
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

// Auto-discover all user-created pages
function getProjects() {
  const appDir = path.join(process.cwd(), 'src', 'app')
  const entries = fs.readdirSync(appDir, { withFileTypes: true })

  // Filter out system folders and files
  const systemFolders = ['api', 'examples', 'fonts', 'favicon.ico']

  const projects = entries
    .filter(entry => {
      if (!entry.isDirectory()) return false
      if (systemFolders.includes(entry.name)) return false
      if (entry.name.startsWith('_')) return false

      // Check if it has a page.tsx file
      const pagePath = path.join(appDir, entry.name, 'page.tsx')
      return fs.existsSync(pagePath)
    })
    .map(entry => {
      const slug = entry.name
      const title = slug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')

      return {
        name: title,
        slug,
        href: `/${slug}`,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return projects
}

export default function Home() {
  const projects = getProjects()
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Stack spacing="xl">
        
        {/* Hero */}
        <Stack spacing="md">
          <Stack direction="horizontal" spacing="sm" align="center">
            <Rocket className="w-8 h-8 text-primary" />
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
              <Zap className="w-5 h-5 text-primary" />
              <Text variant="headline-3">Quick Start</Text>
            </Stack>
            <Stack spacing="sm">
              <code className="block bg-surface-6 text-foreground-inverse p-4 rounded-lg text-sm font-mono overflow-x-auto">
                <span className="text-foreground-inverse-dim"># Run the interactive wizard</span>{'\n'}
                npm run wizard
              </code>
              <Text variant="body-2" color="secondary">
                The wizard helps you create new pages, start the dev server, or deploy your changes.
              </Text>
            </Stack>
          </Stack>
        </Card>

        {/* Your Projects */}
        <Stack spacing="md">
          <Stack direction="horizontal" spacing="sm" align="center">
            <FolderOpen className="w-5 h-5 text-primary" />
            <Text variant="headline-2">Your Projects</Text>
            {projects.length > 0 && <Badge color="blue" compact>{projects.length}</Badge>}
          </Stack>

          {projects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <Link key={project.href} href={project.href}>
                  <Card variant="elevated" padding="lg" className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                    <Stack spacing="sm">
                      <Stack direction="horizontal" justify="between" align="center">
                        <Text variant="headline-4">{project.name}</Text>
                        <Sparkles className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Stack>
                      <Text variant="caption" color="secondary" className="font-mono">
                        {project.href}
                      </Text>
                    </Stack>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card variant="outlined" padding="lg">
              <Stack spacing="sm" align="center" className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-surface-highlight flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-foreground-dim" />
                </div>
                <Stack spacing="xs">
                  <Text variant="body-1" weight="medium">No projects yet</Text>
                  <Text variant="body-2" color="secondary">
                    Run <code className="text-primary">npm run wizard</code> to create your first prototype
                  </Text>
                </Stack>
              </Stack>
            </Card>
          )}
        </Stack>

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
            <BookOpen className="w-5 h-5 text-foreground-dim" />
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
