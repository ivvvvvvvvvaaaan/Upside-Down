'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Text } from './text'
import { HawkinsSearch } from './hawkins-search'
import { SortDropdown } from './sort-dropdown'
import { AppearanceDropdown } from './appearance-dropdown'
import type { SortCriterion } from './sort-dropdown'
import type { LayoutType, CardSize } from './appearance-dropdown'
import type { FilterOption } from './hawkins-search'

/**
 * CompactBar Component
 *
 * Sticky header bar that appears on scroll with title, count, search, and controls.
 * Supports expandable search that replaces the bar content.
 */

export interface CompactBarProps {
  /** Whether the bar is visible */
  visible: boolean
  /** Page title */
  title: string
  /** Item count to display */
  count: number
  /** Label for the count (e.g., "asset", "collection") */
  countLabel: string
  /** Current search query */
  searchQuery: string
  /** Callback when search query changes */
  onSearchChange: (value: string) => void
  /** Filter options for search */
  filterOptions: FilterOption[]
  /** Sort field options */
  sortFields: { value: string; label: string }[]
  /** Current sort criteria */
  sortCriteria: SortCriterion[]
  /** Callback when sort changes */
  onSortChange: (criteria: SortCriterion[]) => void
  /** Current layout */
  layout: LayoutType
  /** Callback when layout changes */
  onLayoutChange: (layout: LayoutType) => void
  /** Current card size */
  cardSize: CardSize
  /** Callback when card size changes */
  onCardSizeChange: (size: CardSize) => void
  /** Show layout options in appearance dropdown */
  showLayoutOptions?: boolean
}

export function CompactBar({
  visible,
  title,
  count,
  countLabel,
  searchQuery,
  onSearchChange,
  filterOptions,
  sortFields,
  sortCriteria,
  onSortChange,
  layout,
  onLayoutChange,
  cardSize,
  onCardSizeChange,
  showLayoutOptions = true,
}: CompactBarProps) {
  const [searchExpanded, setSearchExpanded] = useState(false)

  return (
    <div className="sticky top-0 z-20">
      <div
        className={cn(
          'bg-surface-flat/90 backdrop-blur border-b px-6 flex items-center transition-all overflow-hidden',
          visible
            ? 'opacity-100 max-h-16 py-2 border-border-dim'
            : 'opacity-0 max-h-0 py-0 border-transparent pointer-events-none'
        )}
      >
        {searchExpanded ? (
          <div className="flex items-center gap-2 w-full">
            <HawkinsSearch
              value={searchQuery}
              onValueChange={onSearchChange}
              filters={filterOptions}
              showSavedFilters={false}
              autoFocus
            />
            <Button
              variant="icon"
              size="icon"
              aria-label="Close search"
              onClick={() => setSearchExpanded(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Text variant="body-1" weight="semibold">
                {title}
              </Text>
              <Text variant="body-1" color="secondary">
                {count} {countLabel}{count !== 1 ? 's' : ''}
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="icon"
                size="icon"
                aria-label="Search"
                onClick={() => setSearchExpanded(true)}
              >
                <Search className="w-4 h-4" />
              </Button>
              <SortDropdown
                fields={sortFields}
                value={sortCriteria}
                onChange={onSortChange}
              />
              <AppearanceDropdown
                layout={layout}
                onLayoutChange={onLayoutChange}
                cardSize={cardSize}
                onCardSizeChange={onCardSizeChange}
                showLayoutOptions={showLayoutOptions}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
