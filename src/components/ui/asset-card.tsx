import { cn } from '@/lib/utils'
import { Button } from './button'
import { Tag } from './tag'
import { Text } from './text'
import { MoreVertical } from 'lucide-react'
import Image from 'next/image'
import type { Asset } from '@/lib/data'

/**
 * AssetCard Component
 *
 * Displays individual assets with type-specific styling and metadata.
 * Supports 4 asset types: shot, video, image, text
 *
 * TOKENS USED (Hawkins only - NO hardcoded values):
 * - text-foreground: Asset title (#ffffffe5)
 * - text-foreground-dim: Metadata line (#ffffffb2)
 * - bg-surface-flat: Card background (#161616)
 * - bg-gray-600: Type tag background (#414141)
 * - bg-black/60: Duration badge background (rgba(0,0,0,0.6))
 * - text-xs: Title font (13px)
 * - text-overline: Metadata and duration (10px)
 * - font-semibold: Title and duration weight (600)
 * - rounded: 4px radius
 *
 * Design specs from Figma:
 * - Title: text-xs font-semibold text-foreground
 * - Type Tag: Tag component (bg-gray-600, text-white, text-overline)
 * - Metadata: text-overline text-foreground-dim
 * - Duration: text-overline font-semibold text-white bg-black/60
 * - Menu: Button variant="icon" size="icon" (16px icon)
 */

export interface AssetCardProps extends React.HTMLAttributes<HTMLDivElement> {
  asset: Asset
  onMenuClick?: (asset: Asset) => void
}

export function AssetCard({
  asset,
  onMenuClick,
  className,
  ...props
}: AssetCardProps) {
  const hasDuration = asset.type === 'shot' || asset.type === 'video'
  const duration = asset.type === 'shot'
    ? asset.shotMeta?.duration
    : asset.videoMeta?.duration

  // Render type tag
  const renderTypeTag = () => {
    let tagLabel = ''

    switch (asset.type) {
      case 'shot':
        tagLabel = 'Shot'
        break
      case 'video':
        tagLabel = asset.videoMeta?.typeTag || 'Video'
        break
      case 'image':
        tagLabel = asset.imageMeta?.typeTag || 'Image'
        break
      case 'text':
        tagLabel = asset.textMeta?.typeTag || 'Document'
        break
    }

    return <Tag>{tagLabel}</Tag>
  }

  // Render metadata line (SHOT type only)
  const renderMetadata = () => {
    if (asset.type !== 'shot' || !asset.shotMeta) return null

    const { scene, take, camera } = asset.shotMeta
    const parts = [scene, take, camera].filter(Boolean)

    if (parts.length === 0) return null

    return (
      <Text
        variant="overline"
        color="secondary"
        className="truncate"
      >
        {parts.join(' • ')}
      </Text>
    )
  }

  // Render thumbnail based on type
  const renderThumbnail = () => {
    if (asset.type === 'image' && asset.imageMeta?.imageCount) {
      // Multi-image grid with white padding (from Figma spec)
      return (
        <div className="absolute inset-0">
          <div className="grid grid-cols-2 gap-1 p-2 h-full">
            {[...Array(Math.min(4, asset.imageMeta.imageCount))].map((_, i) => (
              <div key={i} className="relative bg-surface-2 rounded-sm overflow-hidden">
                {asset.thumbnail && (
                  <Image
                    src={asset.thumbnail}
                    alt=""
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Single image for shot, video, text
    return asset.thumbnail ? (
      <Image
        src={asset.thumbnail}
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
      className={cn(
        'group relative flex flex-col',
        'w-full',
        className
      )}
      {...props}
    >
      {/* Thumbnail container - 16:9 aspect ratio */}
      <div className="relative w-full aspect-video rounded overflow-hidden bg-surface-flat mb-2">
        {renderThumbnail()}

        {/* Duration badge - bottom-right overlay */}
        {hasDuration && duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 rounded">
            <Text
              variant="overline"
              weight="semibold"
              className="text-white"
            >
              {duration}
            </Text>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex items-start gap-2">
        {/* Left: Title, Tag, Metadata */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <Text
            variant="caption"
            weight="semibold"
            className="truncate"
          >
            {asset.name}
          </Text>
          {renderTypeTag()}
          {renderMetadata()}
        </div>

        {/* Right: Menu button (appears on hover) */}
        <Button
          variant="icon"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            onMenuClick?.(asset)
          }}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
