'use client'

import { useState } from 'react'
import { 
  Stack, Text, Card, Button, Badge, Input, Modal, IconButton 
} from '@/components/ui'
import { Plus, Search, Edit, Trash2, X } from 'lucide-react'

/*
 * ===========================================
 * GALLERY EXAMPLE
 * ===========================================
 * Demonstrates: media grid, filters, selection, modal
 */

// Mock data
const mediaItems = [
  { id: 1, title: 'Hero Banner - Q4', type: 'image', tags: ['marketing', 'banner'], author: 'Sarah C.', date: 'Jan 15' },
  { id: 2, title: 'Product Launch Video', type: 'video', tags: ['product', 'video'], author: 'John D.', date: 'Jan 14' },
  { id: 3, title: 'Social Media Assets', type: 'image', tags: ['social', 'marketing'], author: 'Jane S.', date: 'Jan 13' },
  { id: 4, title: 'Brand Guidelines', type: 'document', tags: ['brand', 'docs'], author: 'Bob W.', date: 'Jan 12' },
  { id: 5, title: 'Email Template Header', type: 'image', tags: ['email', 'marketing'], author: 'Sarah C.', date: 'Jan 11' },
  { id: 6, title: 'Explainer Animation', type: 'video', tags: ['animation'], author: 'John D.', date: 'Jan 10' },
]

const filterTags = ['All', 'marketing', 'product', 'video', 'brand']

export default function GalleryExample() {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('All')
  const [selected, setSelected] = useState<number[]>([])
  const [previewItem, setPreviewItem] = useState<typeof mediaItems[0] | null>(null)

  const filtered = mediaItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase())
    const matchesTag = activeTag === 'All' || item.tags.includes(activeTag)
    return matchesSearch && matchesTag
  })

  const toggleSelect = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Stack spacing="lg">
        
        {/* Header */}
        <Stack direction="horizontal" justify="between" align="center">
          <Stack spacing="xs">
            <Text variant="headline-1">Media Gallery</Text>
            <Text variant="body-2" color="secondary">
              Browse and manage your media assets
            </Text>
          </Stack>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Upload Media
          </Button>
        </Stack>

        {/* Filters */}
        <Card padding="md">
          <Stack spacing="md">
            <Input
              placeholder="Search media..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Stack direction="horizontal" spacing="sm" wrap>
              {filterTags.map(tag => (
                <Button
                  key={tag}
                  variant={activeTag === tag ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </Stack>
          </Stack>
        </Card>

        {/* Bulk actions */}
        {selected.length > 0 && (
          <Card variant="outlined" padding="sm">
            <Stack direction="horizontal" justify="between" align="center">
              <Text variant="body-2">
                {selected.length} item{selected.length > 1 ? 's' : ''} selected
              </Text>
              <Stack direction="horizontal" spacing="sm">
                <Button variant="secondary" size="sm">Download</Button>
                <Button variant="secondary" size="sm">Move</Button>
                <Button variant="danger" size="sm">Delete</Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
                  Clear
                </Button>
              </Stack>
            </Stack>
          </Card>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <Card key={item.id} variant="elevated" padding="none" className="overflow-hidden">
              {/* Thumbnail */}
              <div 
                className="relative h-40 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 cursor-pointer"
                onClick={() => setPreviewItem(item)}
              >
                {/* Type badge */}
                <div className="absolute top-2 right-2">
                  <Badge size="sm">{item.type}</Badge>
                </div>
                {/* Selection checkbox */}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 rounded border-2 border-white shadow cursor-pointer"
                  />
                </div>
                {/* Placeholder icon */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600">
                  <span className="text-4xl">
                    {item.type === 'video' ? '🎬' : item.type === 'document' ? '📄' : '🖼️'}
                  </span>
                </div>
              </div>
              
              {/* Content */}
              <Stack spacing="sm" className="p-4">
                <Text variant="body-1" weight="medium">{item.title}</Text>
                <Stack direction="horizontal" spacing="xs" wrap>
                  {item.tags.map(tag => (
                    <Badge key={tag} size="sm">{tag}</Badge>
                  ))}
                </Stack>
                <Stack direction="horizontal" justify="between" align="center">
                  <Text variant="caption" color="secondary">
                    {item.author} · {item.date}
                  </Text>
                  <Stack direction="horizontal" spacing="xs">
                    <IconButton icon={<Edit className="w-4 h-4" />} label="Edit" size="sm" />
                    <IconButton icon={<Trash2 className="w-4 h-4" />} label="Delete" size="sm" />
                  </Stack>
                </Stack>
              </Stack>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <Card padding="lg">
            <Stack spacing="md" align="center" className="py-8">
              <Text variant="headline-3">No media found</Text>
              <Text variant="body-2" color="secondary">
                Try adjusting your search or filters
              </Text>
              <Button variant="secondary" onClick={() => { setSearch(''); setActiveTag('All'); }}>
                Clear Filters
              </Button>
            </Stack>
          </Card>
        )}

        {/* Preview Modal */}
        <Modal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          title={previewItem?.title}
          size="lg"
        >
          {previewItem && (
            <Stack spacing="md">
              {/* Preview area */}
              <div className="h-64 bg-surface-secondary rounded-lg flex items-center justify-center">
                <span className="text-6xl">
                  {previewItem.type === 'video' ? '🎬' : previewItem.type === 'document' ? '📄' : '🖼️'}
                </span>
              </div>
              
              {/* Metadata */}
              <Stack spacing="sm">
                <Stack direction="horizontal" spacing="sm" wrap>
                  {previewItem.tags.map(tag => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </Stack>
                <Text variant="body-2" color="secondary">
                  Uploaded by {previewItem.author} on {previewItem.date}
                </Text>
              </Stack>
              
              {/* Actions */}
              <Stack direction="horizontal" spacing="sm" justify="end">
                <Button variant="secondary">Download</Button>
                <Button variant="secondary">Share</Button>
                <Button variant="primary">Use Asset</Button>
              </Stack>
            </Stack>
          )}
        </Modal>

      </Stack>
    </div>
  )
}
