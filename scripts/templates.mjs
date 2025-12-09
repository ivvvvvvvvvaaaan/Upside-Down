/**
 * ===========================================
 * TEMPLATE SYSTEM - PAGE GENERATORS
 * ===========================================
 * 
 * Pre-built page templates for rapid prototyping.
 * Each template demonstrates Hawkins Design System patterns.
 * 
 * ARCHITECTURE:
 * - Templates generate page.tsx (server component) + view.tsx (client component)
 * - Uses real data layer via lib/data.ts (mock + real Supabase)
 * - All components use semantic tokens from globals.css
 * 
 * TEMPLATE CATALOG:
 * - Search: Homepage/discovery pattern with large search input
 * - Gallery: Asset browsing with grid/list view toggle
 * - Manager: File organization with sidebar navigation
 * - Empty: Minimal starter with header/content structure
 * 
 * USAGE (via npm run new):
 * npm run new              # Interactive prompt
 * npm run new --name=foo   # Creates /app/foo/page.tsx
 * 
 * MIGRATION TO PRODUCTION HAWKINS:
 * - Replace Badge variant with color prop (variant="gray" → color="gray")
 * - Replace Input icon prop with InputAdornment composition
 * - Use Button compact boolean instead of size="compact"
 * - IconButton removed - use Button variant="icon" size="icon"
 */

export const TEMPLATES = {
  search: {
    name: 'Search Center',
    description: 'Centralized search with recent history (Best for: Homepages, Discovery)',
    features: []
  },
  gallery: {
    name: 'Asset Gallery',
    description: 'Media collection with Grid/List toggle (Best for: Browsing assets)',
    features: ['hasFilters']
  },
  manager: {
    name: 'File Manager',
    description: 'Tree navigation and file table (Best for: Organizing files)',
    features: ['hasSidebar', 'hasFilters']
  },
  empty: {
    name: 'Empty Page',
    description: 'Blank canvas',
    features: []
  },
}

export function getTemplate(type, { title, componentName, hasFilters = true, hasSidebar = false }) {
  switch (type) {
    case 'search':
      return searchTemplate(title, componentName)
    case 'gallery':
      return galleryTemplate(title, componentName, { hasFilters })
    case 'manager':
      return managerTemplate(title, componentName, { hasFilters, hasSidebar })
    case 'empty':
    default:
      return emptyTemplate(title, componentName)
  }
}

/**
 * SEARCH CENTER TEMPLATE
 * 
 * Homepage/discovery pattern with:
 * - Large centered search input with keyboard shortcut
 * - Recent searches and suggested content cards
 * - Focus on zero-state empty experiences
 * 
 * FEATURES DEMONSTRATED:
 * - Semantic spacing with Stack component
 * - Text variants (headline-1, body-1, caption)
 * - Badge for tags/chips with hover states
 * - Card variants (outlined) for content grouping
 * - Icon integration with lucide-react
 * 
 * CUSTOMIZATION:
 * - Update search placeholder and suggestions
 * - Add filters or category tabs
 * - Connect to real search API endpoint
 */
function searchTemplate(title, componentName) {
  const pageContent = `import { ${componentName}View } from './view'

/*
 * ===========================================
 * ${title.toUpperCase()} - SEARCH CENTER
 * ===========================================
 */

export default function ${componentName}Page() {
  return <${componentName}View title="${title}" />
}
`
  const viewContent = `'use client'

import { Stack, Text, Card, Input, Badge } from '@/components/ui'
import { Search, Clock, TrendingUp } from 'lucide-react'

export function ${componentName}View({ title }: { title: string }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <Stack spacing="xl" align="center">
        
        {/* Header */}
        <Stack spacing="sm" align="center" className="text-center">
          <Text variant="headline-1">{title}</Text>
          <Text variant="body-1" color="secondary" className="max-w-lg">
            Find assets, folders, and campaigns across your organization.
          </Text>
        </Stack>

        {/* Search Bar */}
        <div className="w-full max-w-2xl relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-foreground-dim" />
          </div>
          <input 
            type="text"
            className="w-full h-16 pl-14 pr-12 rounded-2xl border border-border-subtle bg-surface-0 shadow-lg text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-foreground-subtle"
            placeholder="Search everything..."
            autoFocus
          />
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-border-subtle bg-surface-2 px-2 font-mono text-[10px] font-medium text-foreground-dim">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Quick Links / Recents */}
        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="md" variant="outlined">
            <Stack spacing="md">
              <Stack direction="horizontal" spacing="sm" align="center">
                <Clock className="w-4 h-4 text-foreground-dim" />
                <Text variant="body-2" weight="medium" color="secondary">Recent Searches</Text>
              </Stack>
              <div className="flex flex-wrap gap-2">
                <Badge color="gray" compact className="cursor-pointer hover:bg-surface-highlight">campaign_q4</Badge>
                <Badge color="gray" compact className="cursor-pointer hover:bg-surface-highlight">logo_final</Badge>
                <Badge color="gray" compact className="cursor-pointer hover:bg-surface-highlight">marketing video</Badge>
              </div>
            </Stack>
          </Card>

          <Card padding="md" variant="outlined">
             <Stack spacing="md">
              <Stack direction="horizontal" spacing="sm" align="center">
                <TrendingUp className="w-4 h-4 text-foreground-dim" />
                <Text variant="body-2" weight="medium" color="secondary">Suggested</Text>
              </Stack>
              <Stack spacing="sm">
                <div className="flex justify-between text-sm group cursor-pointer">
                  <span>Q4 Brand Guidelines</span>
                  <span className="text-foreground-subtle group-hover:text-primary transition-colors">PDF</span>
                </div>
                <div className="flex justify-between text-sm group cursor-pointer">
                  <span>Social Media Templates</span>
                  <span className="text-foreground-subtle group-hover:text-primary transition-colors">Folder</span>
                </div>
              </Stack>
            </Stack>
          </Card>
        </div>

      </Stack>
    </div>
  )
}
`
  return {
    'page.tsx': pageContent,
    'view.tsx': viewContent
  }
}

/**
 * ASSET GALLERY TEMPLATE
 * 
 * Browsing pattern with dual view modes:
 * - Grid view: Card-based thumbnails with hover actions
 * - List view: Table layout with sortable columns
 * 
 * FEATURES DEMONSTRATED:
 * - View mode toggle (grid/list) with visual state
 * - Input with icon prop (prototype convenience)
 * - Button variants (primary, secondary, icon)
 * - Badge for metadata display
 * - Divider for visual separation
 * - Server/client component split for data fetching
 * 
 * DATA INTEGRATION:
 * - Uses getAssets() from lib/data.ts
 * - Automatically switches between mock and Supabase
 * - Type-safe Asset interface
 * 
 * CUSTOMIZATION:
 * - Add filtering/sorting logic
 * - Implement actual file uploads
 * - Add selection mode with bulk actions
 */
function galleryTemplate(title, componentName, { hasFilters }) {
  const pageContent = `import { getAssets } from '@/lib/data'
import { ${componentName}View } from './view'

/*
 * ===========================================
 * ${title.toUpperCase()} - ASSET GALLERY
 * ===========================================
 */

export default async function ${componentName}Page() {
  // Fetch data (Mock or Real depending on environment)
  const assets = await getAssets()
  
  return <${componentName}View title="${title}" assets={assets} />
}
`

  const viewContent = `'use client'

import { useState } from 'react'
import { Stack, Text, Card, Button, Input, Badge, Divider } from '@/components/ui'
import { Search, Filter, LayoutGrid, List as ListIcon, MoreHorizontal, Image as ImageIcon, Video, File } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Asset } from '@/lib/data'

export function ${componentName}View({ title, assets }: { title: string, assets: Asset[] }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Stack spacing="lg">
        
        {/* Header & Controls */}
        <Stack spacing="md">
          <Stack direction="horizontal" justify="between" align="center">
            <Text variant="headline-1">{title}</Text>
            <Button variant="primary">Upload Assets</Button>
          </Stack>
          
          <Stack direction="horizontal" justify="between" align="center" className="gap-4">
            <div className="w-full max-w-md">
              <Input placeholder="Filter assets..." icon={<Search className="w-4 h-4" />} iconPosition="left" />
            </div>
            <Stack direction="horizontal" spacing="sm" align="center">
              <div className="flex items-center border border-border-subtle rounded-md p-1 bg-surface-0">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn("p-2 rounded-sm transition-colors", viewMode === 'grid' ? "bg-surface-highlight text-foreground shadow-sm" : "text-foreground-dim hover:text-foreground")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn("p-2 rounded-sm transition-colors", viewMode === 'list' ? "bg-surface-highlight text-foreground shadow-sm" : "text-foreground-dim hover:text-foreground")}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>${
                hasFilters
                  ? `
              <Divider orientation="vertical" className="h-6" />
              <Button variant="secondary" icon={<Filter className="w-4 h-4" />}>Filter</Button>`
                  : ''
              }
            </Stack>
          </Stack>
        </Stack>

        {/* Content Area */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <Card key={asset.id} padding="none" variant="elevated" className="overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                <div className="aspect-[4/3] bg-surface-highlight flex items-center justify-center relative">
                   {asset.type === 'video' ? <Video className="w-8 h-8 text-foreground-dim" /> : 
                   asset.type === 'file' ? <File className="w-8 h-8 text-foreground-dim" /> :
                   <ImageIcon className="w-8 h-8 text-foreground-dim" />}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button variant="icon" size="icon" className="bg-white/90 dark:bg-black/90"><MoreHorizontal className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div className="p-3">
                  <Stack spacing="xs">
                    <Text variant="body-2" weight="medium" className="truncate">{asset.name}</Text>
                    <Stack direction="horizontal" justify="between" align="center">
                      <Text variant="caption" color="secondary">{asset.size}</Text>
                      <Badge compact color="gray">{asset.format}</Badge>
                    </Stack>
                  </Stack>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card padding="none" variant="outlined">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border-subtle bg-surface-2 text-xs font-medium text-foreground-dim uppercase tracking-wider">
              <div className="col-span-5">Name</div>
              <div className="col-span-3">Type</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <div className="divide-y divide-border-subtle">
              {assets.map((asset) => (
                <div key={asset.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-highlight transition-colors cursor-pointer group">
                  <div className="col-span-5 flex items-center gap-3">
                    {asset.type === 'video' ? <Video className="w-4 h-4 text-purple-400" /> : 
                     asset.type === 'file' ? <File className="w-4 h-4 text-blue-400" /> :
                     <ImageIcon className="w-4 h-4 text-orange-400" />}
                    <Text variant="body-2" weight="medium">{asset.name}</Text>
                  </div>
                  <div className="col-span-3">
                    <Badge compact color="gray">{asset.format}</Badge>
                  </div>
                  <div className="col-span-2">
                    <Text variant="body-2" color="secondary">{asset.size}</Text>
                  </div>
                  <div className="col-span-2 text-right opacity-0 group-hover:opacity-100">
                    <Button variant="icon" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        
      </Stack>
    </div>
  )
}
`
  return {
    'page.tsx': pageContent,
    'view.tsx': viewContent
  }
}

/**
 * FILE MANAGER TEMPLATE
 * 
 * Organization pattern with sidebar + main content:
 * - Left sidebar: Location tree navigation
 * - Breadcrumb toolbar: Current path context
 * - Main area: File table with sortable columns
 * 
 * FEATURES DEMONSTRATED:
 * - Layout: Fixed sidebar with flex main content
 * - Custom components: SidebarItem, FileRow
 * - Composition: Building complex patterns from primitives
 * - State management: Active navigation state
 * - Icon usage: Contextual file type indicators
 * 
 * LAYOUT STRATEGY:
 * - Uses h-screen for full viewport height
 * - Sidebar fixed width (w-64), main flex-1
 * - Toolbar fixed height (h-16)
 * - Content area with overflow-auto for scrolling
 * 
 * CUSTOMIZATION:
 * - Add drag-and-drop for file uploads
 * - Implement folder tree expansion
 * - Add context menus for file actions
 * - Connect to real file storage API
 */
function managerTemplate(title, componentName, { hasFilters, hasSidebar }) {
  const pageContent = `import { getAssets } from '@/lib/data'
import { ${componentName}View } from './view'

/*
 * ===========================================
 * ${title.toUpperCase()} - FILE MANAGER
 * ===========================================
 */

export default async function ${componentName}Page() {
  const assets = await getAssets()
  return <${componentName}View title="${title}" assets={assets} />
}
`

  const viewContent = `'use client'

import { Stack, Text, Card, Button, Input } from '@/components/ui'
import { Search, Folder, ChevronRight, MoreHorizontal, FileText, Image as ImageIcon, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Asset } from '@/lib/data'

export function ${componentName}View({ title, assets }: { title: string, assets: Asset[] }) {
  return (
    <div className="flex h-screen bg-surface-0">${hasSidebar ? `
      
      {/* Sidebar */}
      <div className="w-64 border-r border-border-subtle p-4 flex flex-col gap-6">
        <Stack spacing="sm">
          <Text variant="caption" weight="bold" color="secondary" className="px-2">LOCATIONS</Text>
          <SidebarItem active label="All Files" icon={<Folder className="w-4 h-4" />} />
          <SidebarItem label="Shared" icon={<Folder className="w-4 h-4" />} />
          <SidebarItem label="Trash" icon={<Folder className="w-4 h-4" />} />
        </Stack>
        
        <Stack spacing="sm">
          <Text variant="caption" weight="bold" color="secondary" className="px-2">FOLDERS</Text>
          <SidebarItem label="Marketing" indent />
          <SidebarItem label="Product" indent />
          <SidebarItem label="Sales" indent />
          <SidebarItem label="Legal" indent />
        </Stack>
      </div>` : ''}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Toolbar */}
        <div className="h-16 border-b border-border-subtle flex items-center justify-between px-6 bg-surface-0">${hasSidebar ? `
          <Stack direction="horizontal" align="center" spacing="sm">
            <Text variant="body-2" color="secondary">All Files</Text>
            <ChevronRight className="w-4 h-4 text-foreground-subtle" />
            <Text variant="body-2" weight="medium">Marketing</Text>
          </Stack>` : `
          <Text variant="headline-2">{title}</Text>`}
          <Stack direction="horizontal" spacing="sm">${hasFilters ? `
             <div className="w-64">
               <Input placeholder="Search..." icon={<Search className="w-4 h-4" />} iconPosition="left" />
             </div>` : ''}
             <Button variant="primary" icon={<Folder className="w-4 h-4" />}>New Folder</Button>
          </Stack>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-auto p-6">
          <Card padding="none" variant="outlined">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border-subtle bg-surface-2 text-xs font-medium text-foreground-dim uppercase tracking-wider">
              <div className="col-span-6">Name</div>
              <div className="col-span-3">Date Modified</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-1"></div>
            </div>
            <div className="divide-y divide-border-subtle">
              {assets.map((asset) => (
                <FileRow 
                  key={asset.id}
                  name={asset.name} 
                  type={asset.type} 
                  date={new Date(asset.created_at || new Date()).toLocaleDateString()} 
                  size={asset.size || '--'} 
                />
              ))}
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}

function SidebarItem({ label, icon, active, indent }: { label: string, icon?: any, active?: boolean, indent?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors",
      active ? "bg-primary/10 text-primary font-medium" : "text-foreground-dim hover:bg-surface-highlight hover:text-foreground",
      indent && "pl-8"
    )}>
      {icon || <ChevronDown className="w-3 h-3 text-foreground-subtle" />}
      {label}
    </div>
  )
}

function FileRow({ name, type, date, size }: { name: string, type: 'folder' | 'file' | 'image' | 'video', date: string, size: string }) {
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-surface-highlight transition-colors cursor-pointer group">
      <div className="col-span-6 flex items-center gap-3">
        {type === 'folder' ? <Folder className="w-5 h-5 text-blue-400 fill-blue-400/20" /> : 
         type === 'image' ? <ImageIcon className="w-5 h-5 text-purple-400" /> :
         <FileText className="w-5 h-5 text-gray-400" />}
        <Text variant="body-2" weight="medium">{name}</Text>
      </div>
      <div className="col-span-3">
        <Text variant="caption" color="secondary">{date}</Text>
      </div>
      <div className="col-span-2">
        <Text variant="caption" color="secondary">{size}</Text>
      </div>
      <div className="col-span-1 flex justify-end">
        <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded">
          <MoreHorizontal className="w-4 h-4 text-foreground-dim" />
        </button>
      </div>
    </div>
  )
}
`
  return {
    'page.tsx': pageContent,
    'view.tsx': viewContent
  }
}

/**
 * EMPTY PAGE TEMPLATE
 * 
 * Minimal starter with:
 * - Header with title, description, and primary action
 * - Card container with placeholder content area
 * 
 * FEATURES DEMONSTRATED:
 * - Stack for semantic spacing
 * - Text variants for hierarchy
 * - Card for content grouping
 * - Dashed border placeholder pattern
 * 
 * USE THIS WHEN:
 * - Starting fresh without specific pattern
 * - Building custom layouts
 * - Need basic structure without opinions
 * 
 * CUSTOMIZATION:
 * - Replace placeholder with actual content
 * - Add tabs for multiple views
 * - Add filters or search
 */
function emptyTemplate(title, componentName) {
  return `'use client'

import { Stack, Text, Card, Button } from '@/components/ui'

/*
 * ===========================================
 * ${title.toUpperCase()}
 * ===========================================
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
              Page description
            </Text>
          </Stack>
          <Button variant="primary">Action</Button>
        </Stack>

        <Card padding="lg">
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-border-subtle rounded-lg">
            <Text variant="body-1" color="secondary">Content goes here</Text>
          </div>
        </Card>
        
      </Stack>
    </div>
  )
}
`
}
