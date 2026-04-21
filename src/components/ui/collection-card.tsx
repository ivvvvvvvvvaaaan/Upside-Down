import { cn } from '@/lib/utils'
import { Avatar } from './avatar'
import { Button } from './button'
import { Dropdown } from './dropdown'
import { Folder, FolderSymlink, FolderLock, MoreVertical, Zap } from 'lucide-react'
import Image from 'next/image'

const EMPTY_COLLECTION_PLACEHOLDER = '/assets/clapper-img.png'

// Custom collection type icons (exported for reuse in graph)
const LocationIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M16.9995 11C16.9995 12.48 16.1695 14.02 14.9495 15.44C14.0654 16.4517 13.0766 17.3669 11.9995 18.17C10.9224 17.3669 9.93351 16.4517 9.04947 15.44C7.82947 14.02 6.99947 12.48 6.99947 11C6.97126 10.324 7.07944 9.64931 7.31755 9.01604C7.55567 8.38277 7.91884 7.80393 8.38543 7.31401C8.85202 6.82409 9.41247 6.43313 10.0334 6.16443C10.6543 5.89572 11.3229 5.75478 11.9995 5.75C14.7295 5.75 16.9995 7.93 16.9995 11ZM18.4995 11C18.4995 15.02 14.0595 18.54 12.5195 19.64C12.3674 19.7476 12.1857 19.8054 11.9995 19.8054C11.8132 19.8054 11.6315 19.7476 11.4795 19.64C9.93947 18.54 5.49947 15.02 5.49947 11C5.47141 10.127 5.61851 9.25723 5.93208 8.44201C6.24565 7.62679 6.71934 6.88264 7.3252 6.25348C7.93106 5.62432 8.65681 5.12289 9.45962 4.77879C10.2624 4.43469 11.126 4.25489 11.9995 4.25C15.5895 4.25 18.4995 7.13 18.4995 11ZM13.4995 11C13.4995 11.3978 13.3414 11.7794 13.0601 12.0607C12.7788 12.342 12.3973 12.5 11.9995 12.5C11.6016 12.5 11.2201 12.342 10.9388 12.0607C10.6575 11.7794 10.4995 11.3978 10.4995 11C10.4995 10.6022 10.6575 10.2206 10.9388 9.93934C11.2201 9.65804 11.6016 9.5 11.9995 9.5C12.3973 9.5 12.7788 9.65804 13.0601 9.93934C13.3414 10.2206 13.4995 10.6022 13.4995 11ZM14.9995 11C14.9995 11.7956 14.6834 12.5587 14.1208 13.1213C13.5582 13.6839 12.7951 14 11.9995 14C11.2038 14 10.4408 13.6839 9.87815 13.1213C9.31554 12.5587 8.99947 11.7956 8.99947 11C8.99947 10.2044 9.31554 9.44129 9.87815 8.87868C10.4408 8.31607 11.2038 8 11.9995 8C12.7951 8 13.5582 8.31607 14.1208 8.87868C14.6834 9.44129 14.9995 10.2044 14.9995 11Z" fill="currentColor"/>
  </svg>
)

const SceneIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M5.94011 8.55023L6.20011 9.52023L8.88011 8.80023L7.90011 8.03023L5.94011 8.55023ZM9.51011 7.60023L10.4901 8.37023L13.3901 7.60023L12.4001 6.82023L9.51011 7.60023ZM14.0001 6.40023L15.0001 7.17023L16.4601 6.77023L16.2001 5.80023L14.0001 6.40023ZM5.04011 10.7202C4.96577 10.618 4.91148 10.5027 4.88011 10.3802L4.36011 8.46023C4.32521 8.3335 4.31564 8.20114 4.33194 8.07071C4.34824 7.94028 4.39009 7.81434 4.45511 7.7001C4.52012 7.58586 4.60702 7.48556 4.71083 7.40494C4.81464 7.32431 4.93333 7.26494 5.06011 7.23023L16.3001 4.23023C16.4268 4.19533 16.5592 4.18575 16.6896 4.20206C16.8201 4.21836 16.946 4.26021 17.0602 4.32522C17.1745 4.39024 17.2748 4.47714 17.3554 4.58095C17.436 4.68476 17.4954 4.80345 17.5301 4.93023L18.0501 6.87023C18.1172 7.12614 18.0802 7.39822 17.9471 7.62688C17.814 7.85555 17.5958 8.02216 17.3401 8.09023L10.2201 10.0002H18.0001C18.2653 10.0002 18.5197 10.1056 18.7072 10.2931C18.8948 10.4807 19.0001 10.735 19.0001 11.0002V18.0002C19.0001 18.2654 18.8948 18.5198 18.7072 18.7073C18.5197 18.8949 18.2653 19.0002 18.0001 19.0002H6.00011C5.73489 19.0002 5.48054 18.8949 5.293 18.7073C5.10547 18.5198 5.00011 18.2654 5.00011 18.0002V11.0002L5.04011 10.7202ZM6.50011 17.5002V14.0002H17.5001V17.5002H6.50011ZM8.66011 12.5002H6.50011V11.5002H9.16011L8.66011 12.5002ZM10.3401 12.5002H13.1601L13.6601 11.5002H10.8401L10.3401 12.5002ZM17.5001 12.5002H14.8401L15.3401 11.5002H17.5001V12.5002Z" fill="currentColor"/>
  </svg>
)

const ArtTypeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C12.5523 20 13 19.5523 13 19C13 18.7347 12.8946 18.4804 12.7071 18.2929C12.5196 18.1054 12.4142 17.8511 12.4142 17.5858C12.4142 17.0335 12.8619 16.5858 13.4142 16.5858H15C17.7614 16.5858 20 14.3472 20 11.5858C20 7.39572 16.4183 4 12 4ZM6.5 12C6.5 11.1716 7.17157 10.5 8 10.5C8.82843 10.5 9.5 11.1716 9.5 12C9.5 12.8284 8.82843 13.5 8 13.5C7.17157 13.5 6.5 12.8284 6.5 12ZM10 7.5C9.17157 7.5 8.5 8.17157 8.5 9C8.5 9.82843 9.17157 10.5 10 10.5C10.8284 10.5 11.5 9.82843 11.5 9C11.5 8.17157 10.8284 7.5 10 7.5ZM14 7.5C13.1716 7.5 12.5 8.17157 12.5 9C12.5 9.82843 13.1716 10.5 14 10.5C14.8284 10.5 15.5 9.82843 15.5 9C15.5 8.17157 14.8284 7.5 14 7.5ZM15.5 12C15.5 11.1716 16.1716 10.5 17 10.5C17.8284 10.5 18.5 11.1716 18.5 12C18.5 12.8284 17.8284 13.5 17 13.5C16.1716 13.5 15.5 12.8284 15.5 12Z" fill="currentColor"/>
  </svg>
)

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

export type CollectionCardType = 'character' | 'location' | 'scene' | 'art-type' | 'folder'

export type CollectionCardSize = 'sm' | 'md' | 'lg'

export interface CollectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  // Collection metadata
  title: string
  assetCount: number
  /** Total asset count (before access filtering). When provided and > assetCount, shows "N assets (you can access M)" */
  totalAssetCount?: number
  type?: CollectionCardType

  // Visual content
  mainImage?: string
  thumbnailImages?: string[]
  avatarSrc?: string
  avatarName?: string

  // State and variant props
  state?: CollectionCardState
  numberOfAssets?: CollectionCardAssetCount
  /** Card size - affects font sizes and spacing */
  size?: CollectionCardSize
  /** Optional icon rendered next to title in the footer (e.g. Lock, Users) */
  accessIcon?: React.ReactNode
  /** Show auto-ingest indicator badge */
  autoIngest?: boolean
  /** Whether the card is selected */
  isSelected?: boolean
  /** Double-click handler (e.g. navigate) */
  onDoubleClick?: () => void
  /** Three-dots menu click handler (folders) */
  onMenuClick?: (e: React.MouseEvent) => void
  /** Dropdown menu content — renders inside a Dropdown anchored to the three-dots button */
  menuContent?: React.ReactNode
}

export function CollectionCard({
  title,
  assetCount,
  totalAssetCount,
  type = 'character',
  mainImage,
  thumbnailImages = [],
  avatarSrc,
  avatarName,
  state = 'Normal',
  numberOfAssets = 'Many',
  size = 'md',
  accessIcon,
  autoIngest,
  isSelected: isSelectedProp,
  onDoubleClick,
  onMenuClick,
  menuContent,
  onClick,
  className,
  ...props
}: CollectionCardProps) {
  // Helper to render the asset count label with optional access-filtered parenthetical
  const isFolder = type === 'folder'
  const itemLabel = isFolder ? 'items' : 'assets'
  const noItemsLabel = isFolder ? 'No items' : 'No assets'
  const renderCountLabel = () => {
    if (assetCount === 0) return noItemsLabel
    if (totalAssetCount != null && totalAssetCount > assetCount) {
      return (
        <>
          {totalAssetCount} {itemLabel}{' '}
          <span className="text-foreground-subtle">(you can access {assetCount})</span>
        </>
      )
    }
    return `${assetCount} ${itemLabel}`
  }

  const sizeStyles = size === 'sm'
    ? { thumbnail: 'aspect-video', emptyInset: 'inset-2' }
    : size === 'lg'
    ? { thumbnail: 'aspect-video', emptyInset: 'inset-4' }
    : { thumbnail: 'aspect-video', emptyInset: 'inset-3' }
  const avatarSizeClass = 'w-6 h-6'
  // Typography classes based on size
  const titleClass = size === 'sm'
    ? 'text-body-0-bold'
    : 'text-body-2-bold'
  const sceneTitleClass = size === 'sm'
    ? 'text-label-1-bold'
    : 'text-body-0-bold'
  const metaClass = size === 'sm'
    ? 'text-label-0-regular'
    : 'text-label-1-regular'
  // Determine if card should show selection border
  const isSelected = isSelectedProp ??
    (state === 'Selected' ||
    state === 'Selected Secondary' ||
    state === 'Hover Selected' ||
    state === 'Focused' ||
    state === 'HoverFocused_CharCollection')
  
  // Determine if card is hovered (from state prop or will be handled by CSS)
  const isHovered = 
    state === 'Hover' || 
    state === 'Hover Selected' || 
    state === 'HoverFocused_CharCollection'
  
  // Loading state with breathing animation
  if (state === 'Loading') {
    return (
      <div className={cn('flex flex-col gap-2 p-2 relative w-full animate-breathe', className)}>
        {/* Thumbnail skeleton */}
        <div className={cn('w-full rounded bg-surface-3', sizeStyles.thumbnail)} />
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

  const remainingAssets = numberOfAssets === 'Many'
    ? Math.max(0, assetCount - 3)
    : numberOfAssets === 'Two'
    ? Math.max(0, assetCount - 2)
    : 0

  const FolderIcon = type === 'folder' && accessIcon
    ? (className?.includes('cursor-not-allowed') ? FolderLock : FolderSymlink)
    : Folder

  const renderThumbnails = () => {
    if (type === 'folder' && !mainImage) {
      return (
        <div
          className={cn(
            'relative rounded shrink-0 w-full overflow-hidden transition-colors isolate flex items-center justify-center',
            !isSelected && 'bg-surface-2 group-hover:bg-surface-3',
            sizeStyles.thumbnail
          )}
        >
          <FolderIcon className="w-10 h-10 text-white" />
          {autoIngest && (
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Zap className="w-3 h-3" />
              <span className="text-label-0-bold">Auto</span>
            </div>
          )}
        </div>
      )
    }

    if (numberOfAssets === 'None') {
      return (
        <div
          className={cn(
            'relative rounded shrink-0 w-full overflow-hidden transition-colors isolate',
            !isSelected && 'bg-surface-2 group-hover:bg-surface-3',
            sizeStyles.thumbnail
          )}
        >
          {assetCount === 0 && (
            <div className={cn('absolute', sizeStyles.emptyInset)}>
              <Image
                src={EMPTY_COLLECTION_PLACEHOLDER}
                alt={`${title} empty`}
                fill
                sizes="25vw"
                className="object-contain mix-blend-luminosity"
              />
            </div>
          )}
        </div>
      )
    }

    if (numberOfAssets === 'One') {
      return (
        <div className={cn('relative rounded shrink-0 w-full', sizeStyles.thumbnail)}>
          {mainImage ? (
            <Image
              src={mainImage}
              alt={title}
              fill
              sizes="25vw"
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
        <div className={cn('relative w-full overflow-hidden rounded', sizeStyles.thumbnail)}>
          <div className="absolute inset-0 flex gap-1">
            {/* Main image - takes 2/3 */}
            <div className="flex-[2] relative rounded overflow-hidden">
              {mainImage ? (
                <Image src={mainImage} alt={title} fill sizes="25vw" className="object-cover" />
              ) : (
                <div className="absolute inset-0 bg-surface-highlight rounded" />
              )}
            </div>
            {/* Thumbnail - takes 1/3 */}
            <div className="flex-[1] relative rounded overflow-hidden">
              {thumbnailImages[0] ? (
                <Image src={thumbnailImages[0]} alt="" fill sizes="25vw" className="object-cover" />
              ) : (
                <div className="absolute inset-0 bg-surface-2 rounded" />
              )}
            </div>
          </div>
        </div>
      )
    }

    // Many: 1 large + 2 small + "+X" overlay
    return (
      <div className={cn('relative w-full overflow-hidden rounded', sizeStyles.thumbnail)}>
        <div className="absolute inset-0 flex gap-1">
          {/* Main large image - left half */}
          <div className="flex-1 relative rounded overflow-hidden">
            {mainImage ? (
              <Image src={mainImage} alt={title} fill sizes="25vw" className="object-cover" />
            ) : (
              <div className="absolute inset-0 bg-surface-highlight rounded" />
            )}
          </div>

          {/* Right column: 2 small thumbnails stacked */}
          <div className="flex-1 flex flex-col gap-1">
            {/* Top thumbnail */}
            <div className="flex-1 relative rounded overflow-hidden">
              {thumbnailImages[0] ? (
                <Image src={thumbnailImages[0]} alt="" fill sizes="25vw" className="object-cover" />
              ) : (
                <div className="absolute inset-0 bg-surface-2 rounded" />
              )}
            </div>
            {/* Bottom thumbnail with "+X" overlay */}
            <div className="flex-1 relative rounded overflow-hidden">
              {thumbnailImages[1] ? (
                <>
                  <Image src={thumbnailImages[1]} alt="" fill sizes="25vw" className="object-cover" />
                  {remainingAssets > 0 && (
                    <>
                      <div className="absolute bg-surface-overlay inset-0" />
                      <div className="absolute inset-0 flex items-center justify-center text-foreground text-body-2-bold">
                        +{remainingAssets}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 bg-surface-2 rounded" />
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderFooter = () => {
    // Link styling applies on hover (via CSS) or when explicitly set via state prop
    const linkClass = 'group-hover:underline group-hover:text-foreground-system-link transition-colors'
    
    if (type === 'location') {
      return (
        <div className="flex gap-2 items-center w-full">
          <div className="flex items-center shrink-0 text-foreground-dim">
            <LocationIcon />
          </div>
          <div className="flex flex-col items-start flex-1 min-w-0">
            <div
              className={cn(
                titleClass,
                'text-foreground break-words',
                linkClass,
                isHovered && 'underline text-foreground-system-link'
              )}
            >
              {title}
            </div>
            <div className={cn(metaClass, assetCount === 0 ? 'text-foreground-dim' : 'text-foreground-subtle')}>
              {renderCountLabel()}
            </div>
          </div>
        </div>
      )
    }

    if (type === 'scene') {
      return (
        <div className="flex gap-2 items-center w-full">
          <div className="flex items-center shrink-0 text-foreground-dim">
            <SceneIcon />
          </div>
          <div className="flex flex-col items-start flex-1 min-w-0">
            <div
              className={cn(
                sceneTitleClass,
                'text-foreground break-words',
                linkClass,
                isHovered && 'underline text-foreground-system-link'
              )}
            >
              {title}
            </div>
            <div className={cn(metaClass, assetCount === 0 ? 'text-foreground-dim' : 'text-foreground-subtle')}>
              {renderCountLabel()}
            </div>
          </div>
        </div>
      )
    }

    if (type === 'art-type') {
      return (
        <div className="flex gap-2 items-center w-full">
          <div className="flex items-center shrink-0 text-foreground-dim">
            <ArtTypeIcon />
          </div>
          <div className="flex flex-col items-start flex-1 min-w-0">
            <div
              className={cn(
                titleClass,
                'text-foreground break-words',
                linkClass,
                isHovered && 'underline text-foreground-system-link'
              )}
            >
              {title}
            </div>
            <div className={cn(metaClass, assetCount === 0 ? 'text-foreground-dim' : 'text-foreground-subtle')}>
              {renderCountLabel()}
            </div>
          </div>
        </div>
      )
    }

    if (type === 'folder') {
      return (
        <div className="flex items-center gap-2 w-full">
          <div className="flex flex-col items-start flex-1 min-w-0">
            <div
              className={cn(
                titleClass,
                'text-foreground break-words',
                linkClass,
                isHovered && 'underline text-foreground-system-link'
              )}
            >
              {title}
            </div>
            <div className={cn(metaClass, assetCount === 0 ? 'text-foreground-dim' : 'text-foreground-subtle')}>
              {renderCountLabel()}
            </div>
          </div>
          {type !== 'folder' && accessIcon && (
            <div className="shrink-0 text-foreground-dim">
              {accessIcon}
            </div>
          )}
          {menuContent ? (
            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <Dropdown label="More" icon={<MoreVertical className="w-4 h-4" />} iconOnly compact align="end" width="sm">
                {menuContent}
              </Dropdown>
            </div>
          ) : onMenuClick ? (
            <Button
              variant="icon"
              compact
              onClick={(e) => {
                e.stopPropagation()
                onMenuClick(e)
              }}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          ) : null}
        </div>
      )
    }

    // Character type (default) - uses Avatar
    return (
      <div className="flex gap-2 items-center w-full">
        {assetCount === 0 ? (
          <div className={cn('rounded-full bg-surface-3 shrink-0', avatarSizeClass)} />
        ) : (
          <Avatar
            src={avatarSrc}
            name={avatarName || title}
            size="compact"
            className="shrink-0"
          />
        )}
        <div className="flex flex-col items-start flex-1 min-w-0">
          <div
            className={cn(
              titleClass,
              'text-foreground break-words',
              linkClass,
              isHovered && 'underline text-foreground-system-link'
            )}
          >
            {title}
          </div>
          <div className={cn(metaClass, assetCount === 0 ? 'text-foreground-dim' : 'text-foreground-subtle')}>
            {renderCountLabel()}
          </div>
        </div>
      </div>
    )
  }

  // Determine alignment based on type
  
  return (
    <div
      className={cn(
        'group flex flex-col gap-2 p-2 relative w-full rounded',
        'border border-border-elevation',
        'items-start',
        isSelected
          ? 'bg-surface-selected hover:bg-surface-selected-hover ring-2 ring-border-selected'
          : cn('bg-surface-2', isHovered && 'bg-surface-3', 'hover:bg-surface-3'),
        'transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
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
      <div className={cn('relative z-10 w-full', type === 'folder' && 'px-2 pb-1')}>
        {renderFooter()}
      </div>
    </div>
  )
}
