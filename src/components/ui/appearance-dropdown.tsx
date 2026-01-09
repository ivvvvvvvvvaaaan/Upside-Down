'use client'

import { LayoutGrid, LayoutList, GalleryHorizontalEnd } from 'lucide-react'
import { Dropdown } from './dropdown'
import { ToggleButtonGroup } from './toggle-button-group'

export type LayoutType = 'grid' | 'list' | 'gallery'
export type CardSize = 'sm' | 'md' | 'lg'

export interface AppearanceDropdownProps {
  layout: LayoutType
  onLayoutChange: (layout: LayoutType) => void
  cardSize: CardSize
  onCardSizeChange: (size: CardSize) => void
  /** Hide layout options (grid/list/gallery toggle) */
  showLayoutOptions?: boolean
}

export function AppearanceDropdown({
  layout,
  onLayoutChange,
  cardSize,
  onCardSizeChange,
  showLayoutOptions = true,
}: AppearanceDropdownProps) {
  return (
    <Dropdown
      label="Appearance"
      icon={<LayoutGrid className="w-4 h-4" />}
      size="standard"
      align="end"
      width="auto"
    >
      <div className="space-y-3 min-w-56">
        {showLayoutOptions && (
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
      </div>
    </Dropdown>
  )
}
