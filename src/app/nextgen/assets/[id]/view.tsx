'use client'

import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, PanelRight, Info, Play, Music, FileText, Share2, Download, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Stack,
  Text,
  Button,
  Tag,
  EmptyState,
  AssetDetailPanel,
  MobileToolbar,
} from '@/components/ui'
import { useAccess, usePersona, useViewPreferences, useSmartCollections, useMobilePanel } from '@/hooks'
import type { Asset, DepartmentId } from '@/lib/data'
import { getReviewNoteSummary } from '@/lib/review-notes'
import { getContextAssetGroups } from '@/lib/context-relationships'

const DEPARTMENT_NAMES: Record<DepartmentId, string> = {
  'art-design': 'Art & Design',
  'vfx': 'VFX',
  'camera': 'Camera',
  'editorial': 'Editorial',
  'audio-sound': 'Audio & Sound',
}

function getTypeTag(asset: Asset): string {
  switch (asset.type) {
    case 'shot': return 'Shot'
    case 'video': return asset.videoMeta?.typeTag || 'Video'
    case 'image': return asset.imageMeta?.typeTag || 'Image'
    case 'text': return asset.textMeta?.typeTag || 'Document'
    case 'audio': return asset.audioMeta?.typeTag || 'Audio'
    default: return ''
  }
}

function getDuration(asset: Asset): string | undefined {
  switch (asset.type) {
    case 'shot': return asset.shotMeta?.duration
    case 'video': return asset.videoMeta?.duration
    case 'audio': return asset.audioMeta?.duration
    default: return undefined
  }
}

interface AssetDetailViewProps {
  assetId: string
}

/** Type-specific preview renderer */
function AssetPreview({ asset }: { asset: Asset }) {
  switch (asset.type) {
    case 'image':
      return asset.thumbnail ? (
        <div className="relative w-full h-full">
          <Image
            src={asset.thumbnail}
            alt={asset.name}
            fill
            className="object-contain"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <ImageIcon className="w-16 h-16 text-foreground-dim" />
        </div>
      )

    case 'video':
    case 'shot': {
      const duration = getDuration(asset)
      return asset.thumbnail ? (
        <div className="relative w-full h-full">
          <Image
            src={asset.thumbnail}
            alt={asset.name}
            fill
            className="object-contain"
          />
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
          {/* Duration badge */}
          {duration && (
            <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/60 rounded">
              <span className="text-label-0-bold text-white">{duration}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <Play className="w-16 h-16 text-foreground-dim" />
          {duration && (
            <span className="text-body-1-regular text-foreground-dim">{duration}</span>
          )}
        </div>
      )
    }

    case 'audio': {
      const duration = getDuration(asset)
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <Music className="w-16 h-16 text-foreground-dim" />
          {duration && (
            <span className="text-body-1-regular text-foreground-dim">{duration}</span>
          )}
          {/* Waveform placeholder */}
          <div className="w-64 h-12 bg-surface-2 rounded flex items-center justify-center">
            <div className="flex items-end gap-1 h-8">
              {[3, 5, 8, 6, 10, 7, 4, 9, 6, 8, 5, 3, 7, 10, 6, 4, 8, 5, 7, 3].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-foreground-dim rounded-full"
                  style={{ height: `${h * 3}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      )
    }

    case 'text':
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <FileText className="w-16 h-16 text-foreground-dim" />
          <span className="text-body-1-regular text-foreground-dim">
            {asset.textMeta?.typeTag || 'Document'}
          </span>
        </div>
      )

    default:
      return (
        <div className="flex items-center justify-center h-full">
          <FileText className="w-16 h-16 text-foreground-dim" />
        </div>
      )
  }
}

export function AssetDetailView({ assetId }: AssetDetailViewProps) {
  const router = useRouter()

  const { hydrated } = usePersona()
  const { filterByAccess } = useAccess()
  const { sidePanelOpen, setSidePanelOpen } = useViewPreferences()
  const { isOpen: panelOpen, toggle: togglePanel, close: closePanel } = useMobilePanel(sidePanelOpen, setSidePanelOpen)
  const { scopedAssets, ensureAssetsLoaded } = useSmartCollections()

  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void ensureAssetsLoaded()
  }, [ensureAssetsLoaded])

  // Fetch asset data on mount
  useEffect(() => {
    if (!hydrated) return
    const fetchAsset = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/assets/by-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [assetId] }),
        })
        if (!response.ok) throw new Error('Failed to fetch asset')
        const assets: Asset[] = await response.json()
        setAsset(filterByAccess(assets)[0] || null)
      } catch (error) {
        console.error('Failed to fetch asset:', error)
        setAsset(null)
      }
      setLoading(false)
    }

    fetchAsset()
  }, [assetId, hydrated, filterByAccess])
  const typeTag = asset ? getTypeTag(asset) : ''
  const reviewNoteSummary = useMemo(() => {
    if (!asset) return null
    return getReviewNoteSummary(asset.id)
  }, [asset])
  const contextGroups = useMemo(() => {
    if (!asset) return undefined
    return getContextAssetGroups(asset, scopedAssets)
  }, [asset, scopedAssets])
  const handlePanelAssetSwitch = (nextAsset: Asset) => {
    router.push(`/nextgen/assets/${nextAsset.id}`)
  }
  // Loading state
  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Stack spacing="lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-surface-3 animate-breathe" />
                  <div className="h-6 w-48 rounded bg-surface-3 animate-breathe" />
                </div>
                <div className="aspect-video rounded bg-surface-3 animate-breathe" />
              </Stack>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Asset not found
  if (!asset) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Stack spacing="lg">
                <MobileToolbar title="Asset" />
                <EmptyState
                  title="Asset not found"
                  message="This asset may have been deleted or doesn't exist."
                >
                  <Button
                    variant="secondary"
                    onClick={() => router.push('/nextgen')}
                    className="mt-4"
                  >
                    Back to Library
                  </Button>
                </EmptyState>
              </Stack>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="p-6">
            <Stack spacing="lg">
              {/* Top bar: Back button + panel toggle */}
              <MobileToolbar title={asset.name} actions={
                <Button
                  variant="icon"
                  size="icon"
                  onClick={togglePanel}
                  aria-label={panelOpen ? 'Close panel' : 'Open panel'}
                  className={cn(panelOpen && 'bg-surface-3')}
                >
                  <Info className="w-4 h-4" />
                </Button>
              } />
              <div className="hidden md:flex items-center justify-between">
                <Button
                  variant="tertiary"
                  icon={<ArrowLeft />}
                  onClick={() => router.back()}
                >
                  Back
                </Button>
                <Button
                  variant="icon"
                  onClick={togglePanel}
                  aria-label={panelOpen ? 'Close panel' : 'Open panel'}
                  className={cn(panelOpen && 'bg-surface-3')}
                >
                  <PanelRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Asset Preview */}
              <div className="bg-surface-flat rounded overflow-hidden aspect-video relative">
                <AssetPreview asset={asset} />
              </div>

              {/* Action bar below preview */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Text variant="headline-1" weight="bold" className="mb-1 truncate hidden md:block">
                    {asset.name}
                  </Text>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag>{typeTag}</Tag>
                    {asset.isKeyArt && <Tag type="announcement">Key Art</Tag>}
                    {asset.isFinal && <Tag type="positive">Final</Tag>}
                    {asset.department && (
                      <Tag type="neutral">
                        {DEPARTMENT_NAMES[asset.department]}
                      </Tag>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {reviewNoteSummary && (
                    <Button
                      asChild
                      variant="secondary"
                      icon={<FileText />}
                    >
                      <a
                        href={reviewNoteSummary.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="hidden lg:inline">Creative Review</span>
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    icon={<Share2 />}
                    onClick={() => console.log('Share asset:', asset.id)}
                  >
                    <span className="hidden lg:inline">Share</span>
                  </Button>
                  <Button
                    variant="secondary"
                    icon={<Download />}
                    onClick={() => console.log('Download asset:', asset.id)}
                  >
                    <span className="hidden lg:inline">Download</span>
                  </Button>
                </div>
              </div>
            </Stack>
          </div>
        </div>
      </div>

      {/* Side panel */}
      <AssetDetailPanel
        asset={asset}
        open={panelOpen}
        onClose={closePanel}
        reviewNoteSummary={reviewNoteSummary}
        contextGroups={contextGroups}
        onContextAssetClick={handlePanelAssetSwitch}
        onVersionSelect={handlePanelAssetSwitch}
      />
    </div>
  )
}
