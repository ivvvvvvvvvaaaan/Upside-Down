'use client'

import { GalleryHorizontalEnd, LayoutGrid, LayoutList } from 'lucide-react'
import { Dropdown } from './dropdown'
import { ToggleButtonGroup } from './toggle-button-group'
import type { CardSize, LayoutType } from './appearance-dropdown'

export interface AppearanceDropdownIconProps {
  layout: LayoutType
  onLayoutChange: (layout: LayoutType) => void
  cardSize: CardSize
  onCardSizeChange: (size: CardSize) => void
  /** Hide layout options (grid/list/gallery toggle) */
  showLayoutOptions?: boolean
}

export function AppearanceDropdownIcon({
  layout,
  onLayoutChange,
  cardSize,
  onCardSizeChange,
  showLayoutOptions = true,
}: AppearanceDropdownIconProps) {
  return (
    <Dropdown
      label="Appearance"
      icon={<LayoutGrid className="w-4 h-4" />}
      size="standard"
      align="end"
      width="auto"
      triggerClassName="w-10 justify-center px-0 [&_span]:gap-0 [&_span]:text-[0px] [&>svg]:hidden"
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
