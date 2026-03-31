'use client'

import { useState } from 'react'
import { AssetCard, CardGrid, Button, Input, EmptyState, ToggleButtonGroup } from '@/components/ui'
import { Plus } from 'lucide-react'
import { useAssetSelection } from '@/hooks'
import type { Asset } from '@/lib/data'

/*
 * ===========================================
 * GALLERY EXAMPLE
 * ===========================================
 * Demonstrates: AssetCard grid with selection, filters
 * Uses the same components as the main media library
 */

// Mock asset data matching the Asset type from lib/data
const mockAssets: Asset[] = [
  {
    id: '1',
    name: 'Hero Banner - Q4 Campaign',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/hero1/400/225',
    imageMeta: { typeTag: 'Marketing', imageCount: 1 },
  },
  {
    id: '2',
    name: 'Product Launch Video',
    type: 'video',
    thumbnail: 'https://picsum.photos/seed/video1/400/225',
    videoMeta: { duration: '02:37', typeTag: 'Promo' },
  },
  {
    id: '3',
    name: 'Scene 07-01 Take 3',
    type: 'shot',
    thumbnail: 'https://picsum.photos/seed/shot1/400/225',
    shotMeta: { scene: 'Scene 07-01', take: 'Take 3', camera: 'Cam A', duration: '00:45' },
  },
  {
    id: '4',
    name: 'Brand Guidelines Document',
    type: 'text',
    thumbnail: 'https://picsum.photos/seed/doc1/400/225',
    textMeta: { typeTag: 'Document' },
  },
  {
    id: '5',
    name: 'Social Media Assets Pack',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/social1/400/225',
    imageMeta: { typeTag: 'Social', imageCount: 4 },
  },
  {
    id: '6',
    name: 'Scene 12-02 Take 1',
    type: 'shot',
    thumbnail: 'https://picsum.photos/seed/shot2/400/225',
    shotMeta: { scene: 'Scene 12-02', take: 'Take 1', camera: 'Cam B', duration: '01:12' },
  },
  {
    id: '7',
    name: 'Explainer Animation',
    type: 'video',
    thumbnail: 'https://picsum.photos/seed/video2/400/225',
    videoMeta: { duration: '03:45', typeTag: 'Animation' },
  },
  {
    id: '8',
    name: 'Storyboard Sequence',
    type: 'image',
    thumbnail: 'https://picsum.photos/seed/story1/400/225',
    imageMeta: { typeTag: 'Storyboard', imageCount: 8 },
  },
]

const typeFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'shot', label: 'Shots' },
  { value: 'video', label: 'Videos' },
  { value: 'image', label: 'Images' },
  { value: 'text', label: 'Docs' },
]

export default function GalleryExample() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const { selectedIds, primaryId, handleAssetClick, clearSelection } = useAssetSelection()

  const filteredAssets = mockAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || asset.type === typeFilter
    return matchesSearch && matchesType
  })

  const handleMenuClick = (asset: Asset) => {
    console.log('Menu clicked for:', asset.name)
  }

  return (
    <div className="min-h-screen bg-surface-flat">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-heading-4 text-foreground mb-1">Media Gallery</h1>
              <p className="text-body-1-regular text-foreground-dim">
                Browse and manage your media assets
              </p>
            </div>
            <Button variant="primary" icon={<Plus />}>
              Upload Media
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-sm">
              <Input
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <ToggleButtonGroup
              options={typeFilterOptions}
              value={typeFilter}
              onChange={setTypeFilter}
              compact
            />
          </div>

          {/* Selection bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between rounded border border-border-dim bg-surface-low p-3">
              <span className="text-body-1-regular text-foreground">
                {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" compact>Download</Button>
                <Button variant="secondary" compact>Move</Button>
                <Button variant="destructive" compact>Delete</Button>
                <Button variant="tertiary" compact onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Asset Grid */}
          {filteredAssets.length > 0 ? (
            <CardGrid columns={4} gap="4">
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  selected={selectedIds.has(asset.id)}
                  primary={primaryId === asset.id}
                  onClick={(a, e) => handleAssetClick(a, e, filteredAssets)}
                  onMenuClick={handleMenuClick}
                />
              ))}
            </CardGrid>
          ) : (
            <div className="flex flex-col items-center gap-4 py-12">
              <EmptyState
                title="No assets found"
                message="Try adjusting your search or filters"
              />
              <Button
                variant="secondary"
                onClick={() => { setSearch(''); setTypeFilter('all') }}
              >
                Clear Filters
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
