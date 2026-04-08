'use client'

import { LayoutGrid, LayoutList, GalleryHorizontalEnd } from 'lucide-react'
import { Card } from './card'
import { Dropdown } from './dropdown'
import { ToggleButtonGroup } from './toggle-button-group'
import type { ToggleButtonOption } from './toggle-button-group'

export type LayoutType = 'grid' | 'list' | 'gallery'
export type CardSize = 'sm' | 'md' | 'lg'

export interface AppearanceDropdownProps {
  layout: LayoutType
  onLayoutChange: (layout: LayoutType) => void
  cardSize: CardSize
  onCardSizeChange: (size: CardSize) => void
  showLayoutOptions?: boolean
  label?: string
  /** Show only icon in trigger */
  iconOnly?: boolean
  /** Hide empty collections toggle */
  hideEmptyCollections?: boolean
  onHideEmptyCollectionsChange?: (hide: boolean) => void
  /** Custom view mode options (replaces default layout toggle) */
  viewModeOptions?: ToggleButtonOption<string>[]
  /** Current view mode value (used with viewModeOptions) */
  viewMode?: string
  /** Callback when view mode changes (used with viewModeOptions) */
  onViewModeChange?: (mode: string) => void
  /** Show/hide structured metadata chips on asset cards */
  showMetadata?: boolean
  onShowMetadataChange?: (show: boolean) => void
}

export function AppearanceDropdown({
  layout,
  onLayoutChange,
  cardSize,
  onCardSizeChange,
  showLayoutOptions = true,
  label = 'Appearance',
  iconOnly = false,
  hideEmptyCollections,
  onHideEmptyCollectionsChange,
  viewModeOptions,
  viewMode,
  onViewModeChange,
  showMetadata,
  onShowMetadataChange,
}: AppearanceDropdownProps) {
  return (
    <Dropdown
      label={label}
      icon={<LayoutGrid />}
      size="standard"
      align="end"
      width="auto"
      iconOnly={iconOnly}
      ghost={!iconOnly}
    >
      <Card.Body padding="lg">
        <div className="space-y-3 min-w-56">
          {viewModeOptions && viewMode != null && onViewModeChange && (
            <ToggleButtonGroup
              options={viewModeOptions}
              value={viewMode}
              onChange={onViewModeChange}
              compact
            />
          )}

          {showLayoutOptions && !viewModeOptions && (
            <ToggleButtonGroup
              options={[
                { value: 'grid' as const, label: 'Grid', icon: <LayoutGrid className="w-4 h-4" /> },
                { value: 'list' as const, label: 'List', icon: <LayoutList className="w-4 h-4" /> },
                { value: 'gallery' as const, label: 'Gallery', icon: <GalleryHorizontalEnd className="w-4 h-4" /> },
              ]}
              value={layout}
              onChange={onLayoutChange}
              compact
            />
          )}

          {(layout === 'grid' || !showLayoutOptions) && (
            <div className="flex items-center justify-between">
              <span className="text-body-0-regular text-foreground">Card Size</span>
              <ToggleButtonGroup
                options={[
                  { value: 'sm' as const, label: 'SM' },
                  { value: 'md' as const, label: 'MD' },
                  { value: 'lg' as const, label: 'LG' },
                ]}
                value={cardSize}
                onChange={onCardSizeChange}
                compact
              />
            </div>
          )}

          {onHideEmptyCollectionsChange && (
            <div className="flex items-center justify-between">
              <span className="text-body-0-regular text-foreground">Empty Collections</span>
              <ToggleButtonGroup
                options={[
                  { value: 'show' as const, label: 'Show' },
                  { value: 'hide' as const, label: 'Hide' },
                ]}
                value={hideEmptyCollections ? 'hide' : 'show'}
                onChange={(val) => onHideEmptyCollectionsChange(val === 'hide')}
                compact
              />
            </div>
          )}

          {onShowMetadataChange && (
            <div className="flex items-center justify-between">
              <span className="text-body-0-regular text-foreground">Metadata</span>
              <ToggleButtonGroup
                options={[
                  { value: 'show' as const, label: 'Show' },
                  { value: 'hide' as const, label: 'Hide' },
                ]}
                value={showMetadata ? 'show' : 'hide'}
                onChange={(val) => onShowMetadataChange(val === 'show')}
                compact
              />
            </div>
          )}

        </div>
      </Card.Body>
    </Dropdown>
  )
}
