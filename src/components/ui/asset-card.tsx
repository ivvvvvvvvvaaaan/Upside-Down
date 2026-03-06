'use client'

import { cn } from '@/lib/utils'
import { Button } from './button'
import { Tag } from './tag'
import { Text } from './text'
import { MoreVertical, Music } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Asset, DepartmentId } from '@/lib/data'

// Department short names for display
const DEPARTMENT_NAMES: Record<DepartmentId, string> = {
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
  showDepartment = false,
  fromWorkspace = false,
}: AssetCardProps) {
  const router = useRouter()
  // Primary implies selected
  const isSelected = selected || primary

  // Loading state with breathing animation (no asset data available)
  if (loading || !asset) {
    return (
      <div className={cn('flex flex-col w-full p-1 animate-breathe', className)}>
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
          'rounded p-1',
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
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-1"
          >
            <MoreVertical className="w-4 h-4" />
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

    // "Final" type tag should be green (positive) for consistency
    if (tagLabel === 'Final') {
      return <Tag type="positive">{tagLabel}</Tag>
    }

    return <Tag>{tagLabel}</Tag>
  }

  // Render metadata line (SHOT type only) - label-0-regular (10px/15px/400)
  const renderMetadata = () => {
    if (asset.type !== 'shot' || !asset.shotMeta) return null

    const { scene, take, camera } = asset.shotMeta
    const parts = [scene, take, camera].filter(Boolean)

    if (parts.length === 0) return null

    return (
      <div className="text-label-0-regular text-foreground-subtle truncate">
        {parts.join(' • ')}
      </div>
    )
  }

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

    return thumbnailSrc ? (
      <Image
        src={thumbnailSrc}
        alt={asset.name}
        fill
        className="object-cover"
      />
    ) : (
      <div className="absolute inset-0 bg-surface-2" />
    )
  }

  return (
    <div
      onClick={(e) => onClick?.(asset, e)}
      onDoubleClick={() => router.push(`/nextgen/assets/${asset.id}`)}
      className={cn(
        'group relative flex flex-col',
        'w-full cursor-pointer',
        'rounded p-1',
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
        {renderThumbnail()}

        {/* Duration badge - bottom-right overlay - Hawkins text-label-0-bold (10px/15px/600) */}
        {hasDuration && duration && (
          <div className="absolute bottom-2 right-2 px-1 bg-black/60 rounded flex items-center">
            <span className="text-label-0-bold text-white leading-none">
              {duration}
            </span>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex items-start justify-between gap-2">
        {/* Left: Title, Tag + Metadata row */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Title - 1st line with hover state - body-0-bold (13px/20px/600) */}
          <Link
            href={`/nextgen/assets/${asset.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-body-0-bold text-foreground truncate block hover:text-foreground-system-link hover:underline"
          >
            {asset.name}
          </Link>

          {/* Tag + Metadata - 2nd line with 8px gap */}
          <div className="flex items-center gap-2">
            {renderTypeTag()}
            {asset.isKeyArt && <Tag type="announcement">Key Art</Tag>}
            {showDepartment && asset.department && (
              <Tag type="neutral" variant="border">{DEPARTMENT_NAMES[asset.department]}</Tag>
            )}
            {fromWorkspace && (
              <Tag type="neutral" variant="border">AI</Tag>
            )}
            {renderMetadata()}
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
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-1"
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
