'use client'

import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, PanelRight, Info, Play, Music, FileText, Download, Image as ImageIcon, CornerUpLeft } from 'lucide-react'
import { ShareIcon } from '@/components/ui/share-icon'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Stack,
  Button,
  Tag,
  EmptyState,
  AssetDetailPanel,
  InlineActionBar,
  MobileToolbar,
} from '@/components/ui'
import { useAccess, usePersona, useViewPreferences, useSmartCollections, useMobilePanel, useCuts } from '@/hooks'
import { useBreadcrumbExtras } from '@/components/ui/project-breadcrumb'
import { getCutStageLabel } from '@/lib/cuts'
import { Dropdown, DropdownMenuItem } from '@/components/ui'
import type { Asset, DomainId } from '@/lib/data'
import { getContextAssetGroups } from '@/lib/context-relationships'
import { getEditSequence } from '@/lib/ontology-meta'

const DOMAIN_NAMES: Record<DomainId, string> = {
  'art-design': 'Art & Design',
  'vfx': 'VFX',
  'camera': 'Camera',
  'editorial': 'Editorial',
  'audio-sound': 'Audio & Sound',
  'marketing': 'Marketing',
  'legal': 'Legal',
  'globalization': 'Globalization',
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
  const { setBreadcrumbExtras, clearBreadcrumbExtras } = useBreadcrumbExtras()

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
  const { getVersionsForGroup } = useCuts()

  // Breadcrumb: show path to the asset
  useEffect(() => {
    if (!asset) return
    const extras: { label: string; href?: string }[] = []
    if (asset.kind === 'cut') {
      extras.push({ label: 'Cuts', href: '/nextgen/library' })
    } else if (asset.department) {
      extras.push({ label: 'Workspace', href: '/nextgen/workspace' })
      extras.push({ label: DOMAIN_NAMES[asset.department], href: `/nextgen/workspace/${asset.sourceFolderIds?.[0] ? asset.sourceFolderIds[0] : ''}` })
      if (asset.workspacePath) {
        const parts = asset.workspacePath.split(' / ')
        for (const part of parts) {
          extras.push({ label: part })
        }
      }
    }
    extras.push({ label: asset.name })
    setBreadcrumbExtras(extras)
    return () => clearBreadcrumbExtras()
  }, [asset, setBreadcrumbExtras, clearBreadcrumbExtras])
  const typeTag = asset ? getTypeTag(asset) : ''
  const contextGroups = useMemo(() => {
    if (!asset) return undefined
    return getContextAssetGroups(asset, scopedAssets)
  }, [asset, scopedAssets])

  /**
   * Parent Composite Concepts this Media Asset belongs to, surfaced as the
   * back-reference loop the spec calls out: Concept → Concept-Asset Collection
   * → Media Asset, navigable both ways. Each parent is one clickable link.
   */
  const parentConcepts = useMemo(() => {
    if (!asset?.aiMeta) return []
    const parents: { label: string; kind: string; href: string }[] = []
    if (asset.aiMeta.editSequence) {
      const seq = getEditSequence(asset.aiMeta.editSequence)
      parents.push({
        label: seq?.name ?? asset.aiMeta.editSequence,
        kind: 'Edit Sequence',
        href: `/nextgen/assets/${asset.aiMeta.editSequence}`,
      })
    }
    if (asset.aiMeta.productionShot) {
      parents.push({
        label: asset.aiMeta.productionShot,
        kind: 'Production Shot',
        href: `/nextgen/concepts/production-shot/${asset.aiMeta.productionShot}`,
      })
    }
    return parents
  }, [asset])
  const allVersions = useMemo(() => {
    if (!asset?.versionGroupId) return []
    return getVersionsForGroup(asset.versionGroupId)
  }, [asset, getVersionsForGroup])
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
              {/* Mobile toolbar */}
              <MobileToolbar title={asset.name} actions={
                <>
                  <Button variant="icon" onClick={() => console.log('Share asset:', asset.id)} aria-label="Share">
                    <ShareIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="icon" onClick={() => console.log('Download asset:', asset.id)} aria-label="Download">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="icon" onClick={togglePanel} aria-label={panelOpen ? 'Close panel' : 'Open panel'}>
                    <Info className="w-4 h-4" />
                  </Button>
                </>
              } />

              {/* Desktop header: Back + Title + Version selector + Actions */}
              <div className="hidden md:flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="icon"
                    onClick={() => router.back()}
                    aria-label="Back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <h1 className="text-heading-2 text-foreground truncate">{asset.name}</h1>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Tag variant="glass">{typeTag}</Tag>
                    {asset.department && <Tag variant="glass">{DOMAIN_NAMES[asset.department]}</Tag>}
                    {asset.isKeyArt && <Tag type="announcement" variant="fill">Key Art</Tag>}
                    {asset.isFinal && <Tag type="positive" variant="fill">Final</Tag>}
                  </div>
                  {allVersions.length > 1 && (
                    <Dropdown
                      label={asset.stage ? `${getCutStageLabel(asset.stage)} V${asset.version}` : `V${asset.version}`}
                      size="compact"
                      align="start"
                      width="sm"
                    >
                      <div className="py-1">
                        {allVersions.map(v => {
                          const stageLabel = v.stage ? getCutStageLabel(v.stage) : null
                          const label = stageLabel ? `${stageLabel} V${v.version}` : `V${v.version}`
                          return (
                            <DropdownMenuItem
                              key={v.id}
                              label={label}
                              onClick={() => router.push(`/nextgen/assets/${v.id}`)}
                            />
                          )
                        })}
                      </div>
                    </Dropdown>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <InlineActionBar items={[
                    { label: 'Share', icon: <ShareIcon />, onClick: () => console.log('Share asset:', asset.id) },
                    { label: 'Download', icon: <Download />, onClick: () => console.log('Download asset:', asset.id) },
                  ]} />
                  <Button variant="icon" onClick={togglePanel} aria-label={panelOpen ? 'Close panel' : 'Open panel'}>
                    <PanelRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Parent Concept back-references — the navigation loop up to
                  the Composite Concept(s) this Media Asset is a component of. */}
              {parentConcepts.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  {parentConcepts.map((parent) => (
                    <Link
                      key={parent.href}
                      href={parent.href}
                      className="group inline-flex items-center gap-1.5 text-body-1-regular text-foreground-dim hover:text-foreground-system-link transition-colors"
                    >
                      <CornerUpLeft className="w-3.5 h-3.5" />
                      <span>Part of {parent.kind}:</span>
                      <span className="text-foreground group-hover:text-foreground-system-link transition-colors">
                        {parent.label}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Asset Preview */}
              <div className="bg-surface-flat rounded overflow-hidden aspect-video relative">
                <AssetPreview asset={asset} />
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
        contextGroups={contextGroups}
        onContextAssetClick={handlePanelAssetSwitch}
        onVersionSelect={handlePanelAssetSwitch}
      />
    </div>
  )
}
