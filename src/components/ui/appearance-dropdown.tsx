'use client'

import { LayoutGrid, LayoutList } from 'lucide-react'
import {
  Dropdown,
  DropdownSection,
  DropdownOptionGroup,
  DropdownOption,
} from './dropdown'

export type LayoutType = 'grid' | 'list'
export type CardSize = 'sm' | 'md' | 'lg'

export interface AppearanceDropdownProps {
  layout: LayoutType
  onLayoutChange: (layout: LayoutType) => void
  cardSize: CardSize
  onCardSizeChange: (size: CardSize) => void
}

export function AppearanceDropdown({
  layout,
  onLayoutChange,
  cardSize,
  onCardSizeChange,
}: AppearanceDropdownProps) {
  return (
    <Dropdown
      label="Appearance"
      icon={<LayoutGrid className="w-4 h-4" />}
      size="standard"
      align="end"
      width="md"
    >
      <div className="space-y-4">
        <DropdownSection label="Layout">
          <DropdownOptionGroup>
            <DropdownOption
              selected={layout === 'grid'}
              onClick={() => onLayoutChange('grid')}
              icon={<LayoutGrid className="w-4 h-4" />}
            >
              Grid
            </DropdownOption>
            <DropdownOption
              selected={layout === 'list'}
              onClick={() => onLayoutChange('list')}
              icon={<LayoutList className="w-4 h-4" />}
            >
              List
            </DropdownOption>
          </DropdownOptionGroup>
        </DropdownSection>

        <DropdownSection label="Card Size">
          <DropdownOptionGroup>
            {(['sm', 'md', 'lg'] as const).map((size) => (
              <DropdownOption
                key={size}
                selected={cardSize === size}
                onClick={() => onCardSizeChange(size)}
              >
                {size.toUpperCase()}
              </DropdownOption>
            ))}
          </DropdownOptionGroup>
        </DropdownSection>
      </div>
    </Dropdown>
  )
}
