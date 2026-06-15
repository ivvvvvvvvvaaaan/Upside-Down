'use client'

import { useState } from 'react'
import { cn, formatSceneSlug } from '@/lib/utils'
import { Button } from './button'
import { Dropdown } from './dropdown'
import { Popover, PopoverTrigger, PopoverContent } from './popover'
import { Tag } from './tag'
import { Tooltip } from './tooltip'
import { MoreVertical, Music, FileText, ImageIcon, Film, File, EyeOff, Lock, Box, Eye, Check } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Asset, DomainId } from '@/lib/data'
import type { MetadataFieldVisibility } from '@/hooks/useViewPreferences'

const STATUS_LABELS = new Set(['Key Art', 'Final'])
const CARD_HIDDEN_TAG_LABELS = new Set(['Circle Take'])
const BADGE_EXTENSIONS = new Set(['exr', 'nk', 'mb', 'hip', 'prproj', 'psd', 'ai', 'ptx', 'tiff', 'tx', 'pdf', 'zip', 'cube', 'xlsx'])
const FILE_3D_EXTENSIONS = new Set(['nk', 'mb', 'hip', 'prproj'])

// Department short names for display
const DOMAIN_NAMES: Record<DomainId, string> = {
  'art-design': 'Art',
  'vfx': 'VFX',
  'camera': 'Camera',
  'editorial': 'Editorial',
  'audio-sound': 'Audio',
  'marketing': 'Marketing',
  'legal': 'Legal',
  'globalization': 'Globalization',
}

export interface AssetCardProps {
  asset?: Asset
  onClick?: (asset: Asset, event: React.MouseEvent) => void
  onMenuClick?: (asset: Asset) => void
  /** Dropdown menu content for the three-dot button */
  menuContent?: React.ReactNode
  className?: string
  loading?: boolean
  /** Card is selected (blue background) */
  selected?: boolean
  /** Primary selection - the anchor card from initial click (has border) */
  primary?: boolean
  /** Force showing empty preview placeholder for all assets */
  forceEmptyPreview?: boolean
  /** Asset is processing (uploaded but metadata/preview extraction in progress) */
  processing?: boolean
  /** Show department tag for assets from other teams */
  showDepartment?: boolean
  /** Asset originates from a workspace managed zone */
  fromWorkspace?: boolean
  /** Asset is discoverable but not accessible — show blurred with lock */
  restricted?: boolean
  /** Called when user tries to open a restricted asset */
  onRequestAccess?: (asset: Asset) => void
  /** Show "Shared" tag — asset originates from outside the user's department */
  shared?: boolean
  /** Show tags row (type, version, status, release). Default: true */
  showTags?: boolean
  /** Per-field metadata visibility */
  metadataFields?: MetadataFieldVisibility
  /** Asset is flagged as sensitive media */
  sensitive?: boolean
  /** All currently selected asset IDs (for multi-drag) */
  allSelectedIds?: Set<string>
}

// Placeholder image for assets without thumbnails
const EMPTY_ASSET_PLACEHOLDER = '/assets/Asset-empty-img.png'

export function AssetCard({
  asset,
  onClick,
  onMenuClick,
  menuContent,
  className,
  loading = false,
  selected = false,
  primary = false,
  forceEmptyPreview = false,
  processing = false,
  restricted = false,
  shared,
  sensitive = false,
  onRequestAccess,
  showTags = true,
  metadataFields,
  allSelectedIds,
}: AssetCardProps) {
  const router = useRouter()
  // Primary implies selected
  const isSelected = selected || primary
  const isShared = shared === true
  const [scrubX, setScrubX] = useState<number | null>(null)

  // Loading state with breathing animation (no asset data available)
  if (loading || !asset) {
    return (
      <div className={cn('flex flex-col w-full p-2 animate-breathe', className)}>
        {/* Thumbnail skeleton - 16:9 aspect ratio */}
        <div className="w-full aspect-video rounded mb-2 bg-surface-3" />
        {/* Content skeleton */}
        <div className="flex items-start justify-between gap-2 px-1 pb-1">
          <div className="flex-1 flex flex-col gap-1">
            {/* Title skeleton */}
            <div className="h-4 w-3/4 rounded bg-surface-3" />
            {/* Tag + metadata skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-3 w-12 rounded bg-surface-3" />
              <div className="h-3 w-20 rounded bg-surface-3" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (processing) {
    return (
      <div
        onClick={(e) => onClick?.(asset, e)}
        className={cn(
          'group relative flex flex-col',
          'w-full cursor-pointer',
          'rounded p-2',
          'transition-colors',
          // Background states
          !isSelected && 'bg-transparent hover:bg-surface-2',
          // Selected: theme-adaptive selection background
          isSelected && 'bg-surface-selected hover:bg-surface-selected-hover',
          // Border: only primary selection gets the ring (theme-adaptive)
          primary && 'ring-2 ring-border-selected',
          className
        )}
      >
        {/* Thumbnail skeleton - 16:9 aspect ratio */}
        <div className="relative w-full aspect-video rounded overflow-hidden mb-2">
          <div className="absolute inset-0 bg-surface-3 animate-breathe" />
        </div>

        {/* Content area */}
        <div className="flex items-start justify-between gap-2">
          {/* Left: Title + Processing tag */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            {/* Title - body-0-bold */}
            <div className="text-body-0-bold text-foreground truncate group-hover:text-foreground-system-link transition-colors">
              {asset.name}
            </div>
            {/* Processing tag */}
            <div className="flex items-center gap-2">
              <Tag>Processing</Tag>
            </div>
          </div>

          {menuContent ? (
            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <Dropdown label="More" icon={<MoreVertical className="w-4 h-4" />} iconOnly compact align="end" width="sm">
                {menuContent}
              </Dropdown>
            </div>
          ) : (
            <Button
              variant="icon"
              compact
              onClick={(e) => {
                e.stopPropagation()
                onMenuClick?.(asset)
              }}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical />
            </Button>
          )}
        </div>
      </div>
    )
  }

  const isVideoType = asset.type === 'shot' || asset.type === 'video'

  const hasDuration = asset.type === 'shot' || asset.type === 'video' || asset.type === 'audio'
  const duration = asset.type === 'shot'
    ? asset.shotMeta?.duration
    : asset.type === 'audio'
    ? asset.audioMeta?.duration
    : asset.videoMeta?.duration

  const extBadge = !duration && asset.extension && BADGE_EXTENSIONS.has(asset.extension) ? asset.extension.toUpperCase() : undefined

  const getTypeTag = (): string => {
    switch (asset.type) {
      case 'shot': return 'Shot'
      case 'video': return asset.videoMeta?.typeTag || 'Video'
      case 'image': return asset.imageMeta?.typeTag || 'Image'
      case 'text': return asset.textMeta?.typeTag || 'Document'
      case 'audio': return asset.audioMeta?.typeTag || 'Audio'
      default: return ''
    }
  }

  // Composite Concept projections (Production Shot / CG Shot / CG Sequence)
  // get a kind label instead of the generic type label, so the grid reads as
  // first-class entities rather than as "videos."  Cuts already carry an
  // explicit system tag (e.g., "Locked Cut V1") so they're excluded here.
  const COMPOSITE_KIND_LABELS: Partial<Record<NonNullable<Asset['kind']>, string>> = {
    'production-shot': 'Production Shot',
    'cg-shot': 'CG Shot',
    'cg-sequence': 'CG Sequence',
  }
  const compositeKindLabel = asset.kind ? COMPOSITE_KIND_LABELS[asset.kind] : undefined

  const renderTypeTag = () => {
    if (compositeKindLabel) return <Tag variant="glass">{compositeKindLabel}</Tag>
    const tagLabel = getTypeTag()
    return <Tag variant="glass">{tagLabel}</Tag>
  }

  // Pre-compute tag classification (avoid recreating inside JSX IIFEs)
  const assetTags = asset.tags ?? []
  const typeTag = assetTags.find(t => t.source === 'system' && !STATUS_LABELS.has(t.label))
  const statusTag = assetTags.find(t => STATUS_LABELS.has(t.label)) ?? (asset.isKeyArt ? { label: 'Key Art', source: 'system' as const } : null)
  const releaseTags = assetTags.filter(t =>
    t.source === 'system' &&
    !STATUS_LABELS.has(t.label) &&
    !CARD_HIDDEN_TAG_LABELS.has(t.label) &&
    t !== typeTag
  )
  const showField = (f: keyof MetadataFieldVisibility) => metadataFields?.[f] !== false

  const renderThumbnail = () => {
    if (asset.type === 'audio') {
      return (
        <div className="absolute inset-0 bg-surface-2 flex items-center justify-center">
          <Music className="w-10 h-10 text-foreground-dim" />
        </div>
      )
    }

    // Single thumbnail for all asset types
    // forceEmptyPreview overrides to always show placeholder
    const thumbnailSrc = forceEmptyPreview ? EMPTY_ASSET_PLACEHOLDER : asset.thumbnail

    const is3DFile = asset.extension && FILE_3D_EXTENSIONS.has(asset.extension)

    return thumbnailSrc ? (
      <Image
        src={thumbnailSrc}
        alt={asset.name}
        fill
        className="object-cover"
      />
    ) : (
      <div className="absolute inset-0 bg-surface-2 flex items-center justify-center">
        {is3DFile ? <Box className="w-8 h-8 text-foreground-dim" /> :
         asset.type === 'video' || asset.type === 'shot' ? <Film className="w-8 h-8 text-foreground-dim" /> :
         asset.type === 'image' ? <ImageIcon className="w-8 h-8 text-foreground-dim" /> :
         asset.type === 'text' ? <FileText className="w-8 h-8 text-foreground-dim" /> :
         <File className="w-8 h-8 text-foreground-dim" />}
      </div>
    )
  }

  // Toggle-select without clearing others — simulates cmd+click
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick?.(asset, { ...e, metaKey: true, shiftKey: false, ctrlKey: false } as React.MouseEvent)
  }

  const handleThumbnailMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setScrubX(Math.max(0, Math.min(e.clientX - rect.left, rect.width)))
  }

  return (
    <div
      data-card={asset.id}
      draggable={!restricted}
      onDragStart={(e) => {
        if (restricted) return
        // If this card is selected OR part of the selection set, drag all selected
        const inSelection = allSelectedIds && (isSelected || allSelectedIds.has(asset.id))
        const ids = inSelection && allSelectedIds.size > 0 ? Array.from(allSelectedIds) : [asset.id]
        e.dataTransfer.setData('application/x-asset-ids', JSON.stringify(ids))
        e.dataTransfer.effectAllowed = 'copyMove'

        // Custom drag image: compact pill with count
        const ghost = document.createElement('div')
        ghost.style.cssText = 'position:fixed;top:-1000px;left:-1000px;display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:6px;background:#4338ca;color:white;font-size:13px;font-weight:600;white-space:nowrap;pointer-events:none;'
        ghost.textContent = ids.length === 1 ? asset.name : `${ids.length} assets`
        document.body.appendChild(ghost)
        e.dataTransfer.setDragImage(ghost, 0, 0)
        requestAnimationFrame(() => document.body.removeChild(ghost))
      }}
      onClick={(e) => onClick?.(asset, e)}
      onDoubleClick={() => {
        if (restricted) {
          onRequestAccess?.(asset)
          return
        }
        router.push(`/nextgen/assets/${asset.id}`)
      }}
      className={cn(
        'group relative flex flex-col',
        'w-full cursor-pointer',
        'rounded p-2',
        'transition-colors',
        // Background states
        !isSelected && 'bg-transparent hover:bg-surface-2',
        // Selected: theme-adaptive selection background
        isSelected && 'bg-surface-selected hover:bg-surface-selected-hover',
        // Border: only primary selection gets the ring (theme-adaptive)
        primary && 'ring-2 ring-border-selected',
        className
      )}
    >
      {/* Action buttons — sibling to thumbnail, positioned absolute to card.
          card p-2 (8px) + 4px inset = top-3/right-3 (12px from card edge) */}
      {!restricted && (
        <div
          className="absolute top-3 right-3 z-10 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip label="View" position="bottom">
            <button
              className="w-8 h-8 flex items-center justify-center rounded bg-black/60 hover:bg-black/80 text-white transition-colors"
              onClick={() => router.push(`/nextgen/assets/${asset.id}`)}
            >
              <Eye className="w-4 h-4" />
            </button>
          </Tooltip>
          {menuContent ? (
            <Tooltip label="More actions" position="bottom">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-8 h-8 flex items-center justify-center rounded bg-black/60 hover:bg-black/80 text-white transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="p-0 w-48">
                  {menuContent}
                </PopoverContent>
              </Popover>
            </Tooltip>
          ) : onMenuClick ? (
            <Tooltip label="More actions" position="bottom">
              <button
                className="w-8 h-8 flex items-center justify-center rounded bg-black/60 hover:bg-black/80 text-white transition-colors"
                onClick={() => onMenuClick(asset)}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </Tooltip>
          ) : null}
        </div>
      )}

      {/* Thumbnail container - 16:9 aspect ratio */}
      <div
        className={cn(
          'relative w-full aspect-video rounded overflow-hidden mb-2',
          isVideoType && !restricted && 'cursor-col-resize'
        )}
        onMouseMove={isVideoType && !restricted ? handleThumbnailMouseMove : undefined}
        onMouseLeave={isVideoType && !restricted ? () => setScrubX(null) : undefined}
      >
        <div className={cn(restricted && 'blur-lg scale-110')}>
          {renderThumbnail()}
        </div>

        {/* Restricted overlay */}
        {restricted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/20">
            <Lock className="w-5 h-5 text-white/80" />
          </div>
        )}

        {/* Sensitive badge owns top-left; otherwise show selection checkbox */}
        {!restricted && sensitive ? (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60">
            <EyeOff className="w-3 h-3 text-white" />
            <span className="text-label-0-regular text-white">Sensitive</span>
          </div>
        ) : !restricted ? (
          <div
            className={cn(
              'absolute top-2 left-2 transition-opacity',
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
            onClick={handleCheckboxClick}
          >
            <div className={cn(
              'w-4 h-4 rounded flex items-center justify-center border',
              isSelected
                ? 'bg-indigo-500 border-indigo-500'
                : 'bg-black/40 border-white/60'
            )}>
              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
          </div>
        ) : null}

        {/* Duration / file-type badge - bottom-right overlay */}
        {!restricted && hasDuration && duration && (
          <div className="absolute bottom-2 right-2 px-1 bg-black/60 rounded flex items-center">
            <span className="text-label-0-bold text-white leading-none">
              {duration}
            </span>
          </div>
        )}
        {!restricted && !duration && extBadge && (
          <div className="absolute bottom-2 right-2 px-1 bg-black/60 rounded flex items-center">
            <span className="text-label-0-bold text-white leading-none">
              {extBadge}
            </span>
          </div>
        )}

        {/* Scrub line — thin vertical marker tracking mouse X, video/shot types only */}
        {isVideoType && scrubX !== null && !restricted && (
          <div
            className="absolute top-0 bottom-0 w-px bg-white/70 pointer-events-none"
            style={{ left: scrubX }}
          />
        )}
      </div>

      {/* Content area */}
      <div className="flex flex-col gap-1">
        {/* Title */}
        <div className="min-w-0">
          {restricted ? (
            <span className="text-body-0-bold text-foreground-dim truncate block">
              {asset.name}
            </span>
          ) : (
            <Link
              href={`/nextgen/assets/${asset.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-body-0-bold text-foreground truncate block group-hover:text-foreground-system-link transition-colors"
            >
              {asset.name}
            </Link>
          )}
        </div>

        {/* Tags + Metadata chips */}
        <div className="flex items-center gap-1 flex-wrap">
          {showTags && (
            <>
              {typeTag ? <Tag variant="glass">{typeTag.label}</Tag> : renderTypeTag()}
              {asset.version != null && <Tag variant="border">{`V${asset.version}`}</Tag>}
              {statusTag && (
                <Tag type={statusTag.label === 'Final' ? 'positive' : 'announcement'} variant="fill">
                  {statusTag.label}
                </Tag>
              )}
              {releaseTags.map(t => {
                const tag = (
                  <Tag key={t.label} type={t.label === 'ALL' ? 'positive' : 'notice'} variant="fill">
                    {t.label}
                  </Tag>
                )
                return t.description ? <Tooltip key={t.label} label={t.description}>{tag}</Tooltip> : tag
              })}
              {isShared && asset.department && (
                <Tag variant="glass">{DOMAIN_NAMES[asset.department] ?? asset.department}</Tag>
              )}
            </>
          )}
          {asset.shotMeta && (
            <>
              {showField('scene') && asset.shotMeta.scene && (
                <Tooltip label={asset.shotMeta.scene}>
                  <Tag variant="glass">{formatSceneSlug(asset.shotMeta.scene)}</Tag>
                </Tooltip>
              )}
              {showField('take') && asset.shotMeta.take && <Tag variant="glass">Take: {asset.shotMeta.take}</Tag>}
              {showField('camera') && asset.shotMeta.camera && <Tag variant="glass">Camera: {asset.shotMeta.camera}</Tag>}
            </>
          )}
          {asset.sequenceMeta && (
            <>
              {showField('sequence') && asset.sequenceMeta.sequence && <Tag variant="glass">{asset.sequenceMeta.sequence}</Tag>}
              {showField('shot') && asset.sequenceMeta.shot && <Tag variant="glass">{asset.sequenceMeta.shot}</Tag>}
            </>
          )}
          {showField('episode') && asset.episode && <Tag variant="glass">{asset.episode}</Tag>}
        </div>
      </div>
    </div>
  )
}
