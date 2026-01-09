import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/*
 * ===========================================
 * HAWKINS AI HOME
 * ===========================================
 * Landing page with auto-discovered projects and examples.
 */

const examples = [
  {
    name: 'Dashboard',
    description: 'Stats cards, data tables, tabs, and filters',
    href: '/examples/dashboard',
  },
  {
    name: 'Gallery',
    description: 'Media grid with cards, selection, and modal preview',
    href: '/examples/gallery',
  },
]

const resources = [
  { name: 'Components', path: 'docs/COMPONENTS.md' },
  { name: 'Patterns', path: 'docs/PATTERNS.md' },
  { name: 'AI Prompts', path: 'docs/PROMPTS.md' },
]

// Auto-discover all user-created pages
function getProjects() {
  const appDir = path.join(process.cwd(), 'src', 'app')
  const entries = fs.readdirSync(appDir, { withFileTypes: true })

  const systemFolders = ['api', 'examples', 'fonts', 'favicon.ico']

  const projects = entries
    .filter(entry => {
      if (!entry.isDirectory()) return false
      if (systemFolders.includes(entry.name)) return false
      if (entry.name.startsWith('_')) return false

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
    <div className="min-h-screen bg-surface-flat">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex flex-col gap-8">

          {/* Hero */}
          <div>
            <h1 className="text-heading-4 text-foreground mb-2">Hawkins AI</h1>
            <p className="text-body-1-regular text-foreground-dim max-w-xl">
              Rapidly build clickable prototypes with pre-built components that match our design system.
            </p>
          </div>

          {/* Quick start */}
          <div className="flex flex-col gap-3">
            <h2 className="text-heading-1 text-foreground">Quick Start</h2>
            <div className="rounded border border-border-dim bg-surface-low p-4">
              <code className="block text-body-mono-1-regular text-foreground">
                <span className="text-foreground-subtle"># Run the interactive wizard</span>{'\n'}
                npm run wizard
              </code>
            </div>
            <p className="text-body-1-regular text-foreground-dim">
              The wizard helps you create new pages, start the dev server, or deploy your changes.
            </p>
          </div>

          {/* Your Projects */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-heading-2 text-foreground">Your Projects</h2>
              {projects.length > 0 && (
                <span className="text-label-0-bold px-2 py-0.5 bg-indigo-500 text-white rounded-full">
                  {projects.length}
                </span>
              )}
            </div>

            {projects.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <Link key={project.href} href={project.href}>
                    <div className="group flex flex-col justify-between rounded border border-border-dim bg-surface-flat hover:bg-surface-low transition-colors cursor-pointer p-4 h-32">
                      <span className="text-body-1-bold text-foreground group-hover:text-foreground-system-link group-hover:underline transition-colors">
                        {project.name}
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-label-1-regular text-foreground-subtle">
                          {project.href}
                        </span>
                        <ArrowRight className="w-4 h-4 text-foreground-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded border border-border-dim bg-surface-flat p-8 text-center">
                <p className="text-body-1-bold text-foreground mb-1">No projects yet</p>
                <p className="text-body-1-regular text-foreground-dim">
                  Run <code className="text-foreground-system-link text-body-mono-0-regular">npm run wizard</code> to create your first prototype
                </p>
              </div>
            )}
          </div>

          {/* Examples */}
          <div className="flex flex-col gap-4">
            <h2 className="text-heading-2 text-foreground">Examples</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {examples.map((example) => (
                <Link key={example.href} href={example.href}>
                  <div className="group flex flex-col justify-between rounded border border-border-dim bg-surface-flat hover:bg-surface-low transition-colors cursor-pointer p-4 h-28">
                    <div className="flex items-center justify-between">
                      <span className="text-body-1-bold text-foreground group-hover:text-foreground-system-link group-hover:underline transition-colors">
                        {example.name}
                      </span>
                      <ArrowRight className="w-4 h-4 text-foreground-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-body-1-regular text-foreground-dim">{example.description}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-3">
            <h2 className="text-heading-2 text-foreground">Resources</h2>
            <div className="flex gap-4">
              {resources.map((resource) => (
                <span key={resource.name} className="text-body-1-regular text-foreground-dim">
                  {resource.name}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
