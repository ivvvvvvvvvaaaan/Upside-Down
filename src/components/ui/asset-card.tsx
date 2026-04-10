'use client'

import { cn } from '@/lib/utils'
import { Button } from './button'
import { Tag } from './tag'
import { Tooltip } from './tooltip'
import { MoreVertical, Music, FileText, ImageIcon, Film, File, Lock, Box } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Asset, DomainId } from '@/lib/data'
import type { MetadataFieldVisibility } from '@/hooks/useViewPreferences'
import { useAccess } from '@/hooks/useAccess'

const STATUS_LABELS = new Set(['Key Art', 'Final'])
const BADGE_EXTENSIONS = new Set(['exr', 'nk', 'mb', 'hip', 'prproj', 'psd', 'ai', 'ptx', 'tiff', 'tx', 'pdf', 'zip', 'cube', 'xlsx'])
const FILE_3D_EXTENSIONS = new Set(['nk', 'mb', 'hip', 'prproj'])

// Department short names for display
const DOMAIN_NAMES: Record<DomainId, string> = {
  'art-design': 'Art',
  'vfx': 'VFX',
  'camera': 'Camera',
  'editorial': 'Editorial',
  'audio-sound': 'Audio',
}

/**
 * AssetCard Component
 *
 * Clickable card displaying individual assets with type-specific styling and metadata.
 * Supports 4 asset types: shot, video, image, text
 *
 * TOKENS USED (Hawkins only - NO hardcoded values):
 * - text-body-0-bold: Asset title (13px font / 20px line / 600 weight)
 * - text-label-0-regular: Metadata (10px font / 15px line / 400 weight)
 * - text-tag-small: Tag and duration (10px font / 15px line / 600 weight)
 * - text-foreground: Asset title default color
 * - text-foreground-system-link: Asset title hover color (blue)
 * - text-foreground-subtle: Metadata line color
 * - bg-surface-flat: Card background default
 * - bg-surface-low: Card background on hover
 * - bg-gray-600 / dark:bg-gray-400: Type tag background
 * - bg-black/60: Duration badge background
 * - rounded: 4px radius
 *
 * Design specs from Figma (Node: 4244-234267):
 * - Card: button element with hover states
 * - Title: body-0-bold (13px/20px/600), hover → link blue with underline
 * - Background: surface-flat → surface-low on hover
 * - Type Tag: tag--text-small (10px/15px/600), 4px horizontal, 0px vertical, gray bg, white text
 * - Metadata: label-0-regular (10px/15px/400), foreground-subtle color (SHOT type only)
 * - Duration: tag--text-small (10px/15px/600), 4px horizontal, 0px vertical, bg-black/60
 * - Menu: Button variant="icon" size="icon", appears on hover
 */

export interface AssetCardProps {
  asset?: Asset
  onClick?: (asset: Asset, event: React.MouseEvent) => void
  onMenuClick?: (asset: Asset) => void
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
  /** Called when user clicks "Request Access" on a restricted asset */
  onRequestAccess?: (asset: Asset) => void
  /** Show "Shared" tag — asset originates from outside the user's department */
  shared?: boolean
  /** Show tags row (type, version, status, release). Default: true */
  showTags?: boolean
  /** Per-field metadata visibility */
  metadataFields?: MetadataFieldVisibility
}

// Placeholder image for assets without thumbnails
const EMPTY_ASSET_PLACEHOLDER = '/assets/Asset-empty-img.png'

export function AssetCard({
  asset,
  onClick,
  onMenuClick,
  className,
  loading = false,
  selected = false,
  primary = false,
  forceEmptyPreview = false,
  processing = false,
  restricted = false,
  shared,
  onRequestAccess,
  showTags = true,
  metadataFields,
}: AssetCardProps) {
  const router = useRouter()
  // Primary implies selected
  const isSelected = selected || primary
  const isShared = shared === true
  const { isSensitiveAsset } = useAccess()

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

  // Processing state: asset uploaded but metadata/preview extraction in progress
  // Shows skeleton thumbnail with "Processing" badge, asset name, and "Processing" tag
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
            <div className="text-body-0-bold text-foreground truncate group-hover:text-foreground-system-link group-hover:underline">
              {asset.name}
            </div>
            {/* Processing tag */}
            <div className="flex items-center gap-2">
              <Tag>Processing</Tag>
            </div>
          </div>

          {/* Right: Menu button (appears on hover) */}
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
        </div>
      </div>
    )
  }
  const hasDuration = asset.type === 'shot' || asset.type === 'video' || asset.type === 'audio'
  const duration = asset.type === 'shot'
    ? asset.shotMeta?.duration
    : asset.type === 'audio'
    ? asset.audioMeta?.duration
    : asset.videoMeta?.duration

  // Show file extension badge when there's no duration — production formats, documents, archives
  const extBadge = !duration && asset.extension && BADGE_EXTENSIONS.has(asset.extension) ? asset.extension.toUpperCase() : undefined

  // Get type tag label
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

  // Render type tag
  const renderTypeTag = () => {
    const tagLabel = getTypeTag()
    return <Tag variant="glass">{tagLabel}</Tag>
  }

  // Pre-compute tag classification (avoid recreating inside JSX IIFEs)
  const typeTag = asset.tags?.find(t => t.source === 'system' && !STATUS_LABELS.has(t.label))
  const statusTag = asset.tags?.find(t => STATUS_LABELS.has(t.label)) ?? (asset.isKeyArt ? { label: 'Key Art', source: 'system' as const } : null)
  const releaseTags = asset.tags?.filter(t => t.source === 'system' && !STATUS_LABELS.has(t.label) && t !== typeTag) ?? []
  const showField = (f: keyof MetadataFieldVisibility) => metadataFields?.[f] !== false

  // Render thumbnail based on type
  const renderThumbnail = () => {
    // Audio assets get icon placeholder
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

  return (
    <div
      onClick={(e) => {
        if (restricted) { onRequestAccess?.(asset); return }
        onClick?.(asset, e)
      }}
      onDoubleClick={() => { if (!restricted) router.push(`/nextgen/assets/${asset.id}`) }}
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
      {/* Thumbnail container - 16:9 aspect ratio */}
      <div className="relative w-full aspect-video rounded overflow-hidden mb-2">
        <div className={cn(restricted && 'blur-lg scale-110')}>
          {renderThumbnail()}
        </div>

        {/* Restricted overlay */}
        {restricted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/20">
            <Lock className="w-5 h-5 text-white/80" />
          </div>
        )}

        {/* Sensitive media badge - top-left */}
        {!restricted && asset && isSensitiveAsset(asset.id) && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/60">
            <Lock className="w-3 h-3 text-white" />
          </div>
        )}

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
      </div>

      {/* Content area */}
      <div className="flex flex-col gap-1">
        {/* Title row — title + menu button aligned */}
        <div className="flex items-center gap-1">
          <div className="flex-1 min-w-0">
            {restricted ? (
              <span className="text-body-0-bold text-foreground-dim truncate block">
                {asset.name}
              </span>
            ) : (
              <Link
                href={`/nextgen/assets/${asset.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-body-0-bold text-foreground truncate block hover:text-foreground-system-link hover:underline"
              >
                {asset.name}
              </Link>
            )}
          </div>
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
              {showField('scene') && asset.shotMeta.scene && <Tag variant="glass">Scene: {asset.shotMeta.scene}</Tag>}
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
