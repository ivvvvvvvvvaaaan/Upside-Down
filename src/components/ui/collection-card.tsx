import { cn } from '@/lib/utils'
import { Avatar } from './avatar'
import { Card } from './card'
import { MapPin, Film } from 'lucide-react'
import Image from 'next/image'

/*
 * ===========================================
 * COLLECTION CARD COMPONENT
 * ===========================================
 * Card component for displaying collections with thumbnails.
 * Supports multiple states, asset count variants, and collection types.
 *
 * TOKENS USED (Hawkins only - NO hardcoded values):
 * - text-body-2-bold: Collection title for character/location (16px/24px/600)
 * - text-body-0-bold: Collection title for scene (13px/20px/600) - smaller for long names
 * - text-label-1-regular: Asset count metadata (12px/18px/400)
 * - text-body-0-regular: "No assets" state (13px/20px/400)
 * - text-foreground: Default text color
 * - text-foreground-subtle: Secondary text (metadata)
 * - text-foreground-system-link: Link color on hover (blue)
 * - bg-surface-low: Card background (elevated from flat)
 * - bg-surface-mid: Card background on hover
 * - border-border-subtle: Subtle border to distinguish from assets
 *
 * Variants:
 * - state: Normal, Hover, Selected, Focused, Loading, etc.
 * - numberOfAssets: Many (1 large + 2 small + "+X"), Two (1 large + 1 small), One (1 large)
 * - type: Character (with Avatar), Location (with MapPin), Scene (with Scene icon)
 */

export type CollectionCardState =
  | 'Normal'
  | 'Hover'
  | 'Selected'
  | 'Selected Secondary'
  | 'Focused'
  | 'Loading'
  | 'Hover Selected'
  | 'HoverFocused_CharCollection'
  | 'Location'
  | 'Sceene'
  | 'Variant12'

export type CollectionCardAssetCount = 'Many' | 'Two' | 'One' | 'None'

export type CollectionCardType = 'character' | 'location' | 'scene'

export interface CollectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  // Collection metadata
  title: string
  assetCount: number
  type?: CollectionCardType
  
  // Visual content
  mainImage?: string
  thumbnailImages?: string[]
  avatarSrc?: string
  avatarName?: string
  
  // State and variant props
  state?: CollectionCardState
  numberOfAssets?: CollectionCardAssetCount
}

export function CollectionCard({
  title,
  assetCount,
  type = 'character',
  mainImage,
  thumbnailImages = [],
  avatarSrc,
  avatarName,
  state = 'Normal',
  numberOfAssets = 'Many',
  onClick,
  className,
  ...props
}: CollectionCardProps) {
  // Determine if card should show selection border
  const isSelected = 
    state === 'Selected' || 
    state === 'Selected Secondary' || 
    state === 'Hover Selected' ||
    state === 'Focused' ||
    state === 'HoverFocused_CharCollection'
  
  // Determine if card is hovered (from state prop or will be handled by CSS)
  const isHovered = 
    state === 'Hover' || 
    state === 'Hover Selected' || 
    state === 'HoverFocused_CharCollection'
  
  // Loading state with breathing animation
  if (state === 'Loading') {
    return (
      <div className={cn('flex flex-col gap-4 min-h-[204px] p-1 relative w-full animate-breathe', className)}>
        {/* Thumbnail skeleton */}
        <div className="h-[124px] w-full rounded bg-surface-3" />
        {/* Footer skeleton */}
        <div className="flex gap-4 items-center">
          {/* Avatar skeleton */}
          <div className="w-8 h-8 rounded-full bg-surface-3" />
          {/* Text skeleton */}
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-4 w-3/4 rounded bg-surface-3" />
            <div className="h-3 w-1/2 rounded bg-surface-3" />
          </div>
        </div>
      </div>
    )
  }

  // Calculate remaining assets for "+X" overlay
  const remainingAssets = numberOfAssets === 'Many'
    ? Math.max(0, assetCount - 3)
    : numberOfAssets === 'Two'
    ? Math.max(0, assetCount - 2)
    : 0

  // Render thumbnail grid based on numberOfAssets
  const renderThumbnails = () => {
    if (numberOfAssets === 'None') {
      return (
        <div className="h-[124px] relative rounded shrink-0 w-full bg-surface-2 border border-border-subtle border-dashed flex items-center justify-center">
          <div className="text-body-0-regular text-foreground-subtle">
            No assets
          </div>
        </div>
      )
    }

    if (numberOfAssets === 'One') {
      return (
        <div className="h-[124px] relative rounded shrink-0 w-full">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={title}
              fill
              className="object-cover rounded"
            />
          ) : (
            <div className="absolute inset-0 bg-surface-highlight rounded" />
          )}
        </div>
      )
    }

    if (numberOfAssets === 'Two') {
      return (
        <div className="flex gap-1 items-center w-full">
          {/* Main image - takes 2/3 of space */}
          <div className="flex-[2] h-[124px] min-h-px min-w-px relative rounded">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={title}
                fill
                className="object-cover rounded"
              />
            ) : (
              <div className="absolute inset-0 bg-surface-highlight rounded" />
            )}
          </div>
          {/* Thumbnail - takes 1/3 of space */}
          <div className="flex-[1] h-[124px] min-h-px min-w-px relative rounded">
            {thumbnailImages[0] ? (
              <Image
                src={thumbnailImages[0]}
                alt=""
                fill
                className="object-cover rounded"
              />
            ) : (
              <div className="absolute inset-0 bg-surface-2 rounded" />
            )}
          </div>
        </div>
      )
    }

    // Many: 1 large + 2 small + "+X" overlay
    return (
      <div className="flex gap-1 items-center w-full">
        {/* Main large image */}
        <div className="basis-0 grow h-[124px] min-h-px min-w-px relative rounded shrink-0">
          {mainImage ? (
            <div className="absolute inset-0 overflow-hidden rounded">
              <Image
                src={mainImage}
                alt={title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-surface-highlight rounded" />
          )}
        </div>

        {/* Right column: 2 small thumbnails */}
        <div className="basis-0 flex flex-col gap-1 grow h-[124px] items-start min-h-px min-w-px relative shrink-0">
          {/* First small thumbnail */}
          <div className="basis-0 grow min-h-px min-w-px relative rounded shrink-0 w-full">
            {thumbnailImages[0] ? (
              <Image
                src={thumbnailImages[0]}
                alt=""
                fill
                className="object-cover rounded"
              />
            ) : (
              <div className="absolute inset-0 bg-surface-2 rounded" />
            )}
          </div>

          {/* Second small thumbnail with "+X" overlay */}
          <div className="h-[60px] relative shrink-0 w-full">
            {thumbnailImages[1] ? (
              <>
                <div className="absolute h-[60px] left-0 rounded top-0 w-full">
                  <div className="absolute inset-0 rounded">
                    <Image
                      src={thumbnailImages[1]}
                      alt=""
                      fill
                      className="object-cover rounded"
                    />
                    <div className="absolute bg-surface-overlay inset-0 rounded" />
                  </div>
                </div>
                {remainingAssets > 0 && (
                  <div className="absolute left-[calc(50%-16px)] text-foreground text-nowrap top-[calc(50%-12px)] text-body-2-bold">
                    +{remainingAssets}
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 bg-surface-2 rounded" />
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render footer based on collection type
  const renderFooter = () => {
    // Link styling applies on hover (via CSS) or when explicitly set via state prop
    const linkClass = 'group-hover:underline group-hover:text-foreground-system-link transition-colors'
    
    if (type === 'location') {
      return (
        <div className="flex gap-2 items-center w-full">
          <div className="flex items-center p-1 shrink-0">
            <MapPin className="w-4 h-4 text-foreground-dim" />
          </div>
          <div className="flex flex-col items-start flex-1 min-w-0">
            <div
              className={cn(
                'text-body-2-bold text-foreground break-words',
                linkClass,
                isHovered && 'underline text-foreground-system-link'
              )}
            >
              {title}
            </div>
            <div className="text-label-1-regular text-foreground-subtle">
              {assetCount} assets
            </div>
          </div>
        </div>
      )
    }

    if (type === 'scene') {
      return (
        <div className="flex gap-2 items-center w-full">
          <div className="flex items-center p-1 shrink-0">
            <Film className="w-4 h-4 text-foreground-dim" />
          </div>
          <div className="flex flex-col items-start flex-1 min-w-0">
            <div
              className={cn(
                'text-body-0-bold text-foreground break-words',
                linkClass,
                isHovered && 'underline text-foreground-system-link'
              )}
            >
              {title}
            </div>
            <div className="text-label-1-regular text-foreground-subtle">
              {assetCount} assets
            </div>
          </div>
        </div>
      )
    }

    // Character type (default) - uses Avatar
    return (
      <div className="flex gap-4 items-center w-full">
        <Avatar
          src={avatarSrc}
          name={avatarName || title}
          size="sm"
          className="shrink-0"
        />
        <div className="flex flex-col items-start flex-1 min-w-0">
          <div
            className={cn(
              'text-body-2-bold text-foreground break-words',
              linkClass,
              isHovered && 'underline text-foreground-system-link'
            )}
          >
            {title}
          </div>
          <div className="text-label-1-regular text-foreground-subtle">
            {assetCount} assets
          </div>
        </div>
      </div>
    )
  }

  // Determine alignment based on type
  const isCentered = type === 'location' || type === 'scene'
  
  return (
    <div
      className={cn(
        'group flex flex-col gap-4 min-h-[204px] p-2 relative w-full rounded',
        'bg-surface-2 border border-border-elevation',
        isCentered ? 'items-start' : 'items-start',
        isHovered && 'bg-surface-3',
        'hover:bg-surface-3 transition-colors',
        isSelected && 'ring-2 ring-primary',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {/* Card wrapper for selected states */}
      {isSelected && (
        <div
          className="absolute inset-0 pointer-events-none rounded border-1 border-primary z-0"
        />
      )}
      
      {/* Thumbnail grid */}
      <div className="flex gap-1 items-center relative shrink-0 w-full z-10">
        {renderThumbnails()}
      </div>
      
      {/* Footer with avatar/icon and metadata */}
      <div className="relative z-10">
        {renderFooter()}
      </div>
    </div>
  )
}

