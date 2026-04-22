'use client'

import { forwardRef, useRef, useState } from 'react'
import { Bookmark, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from './popover'
import { Button } from './button'

/**
 * HawkinsSearch Component (Pro Search / Filter Bar)
 *
 * Complex filter bar with filter icon, saved filters, filter chips, and text input.
 * Based on Figma "Pro Search" design.
 *
 * TOKENS USED:
 * - text-body-0-bold: Filter chip text (13px semibold)
 * - text-body-0-regular: Input text (13px)
 * - text-foreground: Input text color
 * - text-foreground-subtle: Placeholder and chip text (60% opacity)
 * - text-foreground-dim: Icons
 * - bg-surface-3: Filter chip background (#414141 in dark)
 * - bg-transparent: Default input background
 * - rounded: 4px border radius
 */

// FILTER CHIP SUB-COMPONENT

export interface FilterChipProps {
  /** Chip label */
  label: string
  /** Whether chip is active/selected */
  active?: boolean
  /** Click handler */
  onClick?: () => void
  /** Remove handler (shows X instead of chevron) */
  onRemove?: () => void
  /** Called when popover open state changes */
  onOpenChange?: (open: boolean) => void
  className?: string
}


function FilterOptionGhost({ width = 'w-24' }: { width?: string }) {
  return (
    <div className={cn('h-4 rounded bg-surface-4', width)} />
  )
}

function FilterChip({
  label,
  active = false,
  onClick,
  onRemove,
  onOpenChange,
  className,
}: FilterChipProps) {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  const baseClasses = cn(
    'flex items-center gap-0 p-1 rounded',
    'bg-surface-3 transition-colors',
    'hover:bg-surface-4',
    (active || open) && 'bg-surface-4',
    className
  )

  // Use div wrapper when we have a remove button to avoid nested buttons
  if (onRemove) {
    return (
      <div className={baseClasses}>
        <span className="px-1 text-body-0-bold text-foreground-subtle">
          {label}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded hover:bg-surface-highlight"
          aria-label={`Remove ${label} filter`}
        >
          <X className="w-4 h-4 text-foreground-subtle" />
        </button>
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={() => {
            onClick?.()
          }}
          className={baseClasses}
        >
          <span className="px-1 text-body-0-bold text-foreground-subtle">
            {label}
          </span>
          <span className="p-1">
            <ChevronDown className={cn(
              'w-4 h-4 text-foreground-subtle transition-transform',
              open && 'rotate-180'
            )} />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-6">
        <div className="space-y-4">
          <FilterOptionGhost width="w-32" />
          <FilterOptionGhost width="w-40" />
          <FilterOptionGhost width="w-28" />
          <FilterOptionGhost width="w-36" />
          <FilterOptionGhost width="w-24" />
        </div>
      </PopoverContent>
    </Popover>
  )
}

// MAIN HAWKINS SEARCH COMPONENT

export interface FilterOption {
  id: string
  label: string
  active?: boolean
}

export interface HawkinsSearchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Current search/filter value */
  value?: string
  /** Callback when value changes */
  onValueChange?: (value: string) => void
  /** Filter options to show as chips */
  filters?: FilterOption[]
  /** Callback when filter chip is clicked */
  onFilterClick?: (filterId: string) => void
  /** Callback when filter chip is removed */
  onFilterRemove?: (filterId: string) => void
  /** Callback when saved filters button is clicked */
  onSavedFiltersClick?: () => void
  /** Show saved filters button */
  showSavedFilters?: boolean
  /** Start compact and animate wider on focus */
  expandable?: boolean
  /** On small screens, collapse to a search icon button */
  collapsible?: boolean
}

const HawkinsSearch = forwardRef<HTMLInputElement, HawkinsSearchProps>(
  ({
    className,
    value,
    onValueChange,
    filters = [],
    onFilterClick,
    onFilterRemove,
    onSavedFiltersClick,
    showSavedFilters = true,
    expandable = false,
    collapsible = false,
    placeholder = 'Search...',
    onChange,
    ...props
  }, ref) => {
    const [inputPopoverOpen, setInputPopoverOpen] = useState(false)
    const [openChips, setOpenChips] = useState<Set<string>>(new Set())
    const [expanded, setExpanded] = useState(false)
    const [mobileExpanded, setMobileExpanded] = useState(false)
    const inputRef = useRef<HTMLInputElement | null>(null)

    const handleChipOpenChange = (filterId: string, open: boolean) => {
      setOpenChips(prev => {
        const next = new Set(prev)
        if (open) {
          next.add(filterId)
        } else {
          next.delete(filterId)
        }
        return next
      })
    }

    const isAnyPopoverOpen = inputPopoverOpen || openChips.size > 0

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.(e.target.value)
      onChange?.(e)
    }

    const isExpanded = expanded || !!value

    const searchBar = (
      <div
        data-hawkins-search
        className={cn(
          'flex items-center gap-2 h-10 px-2 rounded border border-border-subtle dark:border-border-inverse-subtle',
          'transition-all duration-300 ease-in-out',
          isAnyPopoverOpen && 'ring-2 ring-border-system-focus ring-offset-2 ring-offset-background',
          expandable
            ? isExpanded ? 'w-80' : 'w-48'
            : 'flex-1',
          collapsible && 'hidden md:flex',
          className
        )}
        onFocus={() => expandable && setExpanded(true)}
        onBlur={() => expandable && !value && setExpanded(false)}
      >
        {/* Saved filters button */}
        {showSavedFilters && (
          <Button
            variant="icon"
            compact
            onClick={onSavedFiltersClick}
            aria-label="Saved filters"
          >
            <Bookmark />
          </Button>
        )}

        {/* Filter chips - hidden when narrow or when expandable and not expanded */}
        <div className={cn('hidden lg:flex items-center gap-1 flex-shrink-0', expandable && !isExpanded && '!hidden')}>
          {filters.map((filter) => (
            <FilterChip
              key={filter.id}
              label={filter.label}
              active={filter.active}
              onClick={() => onFilterClick?.(filter.id)}
              onRemove={onFilterRemove ? () => onFilterRemove(filter.id) : undefined}
              onOpenChange={(open) => handleChipOpenChange(filter.id, open)}
            />
          ))}
        </div>

        {/* Text input with suggestions popover */}
        <Popover open={inputPopoverOpen} onOpenChange={setInputPopoverOpen}>
          <PopoverAnchor asChild>
            <input
              ref={(el) => {
                inputRef.current = el
                if (typeof ref === 'function') ref(el)
                else if (ref) ref.current = el
              }}
              type="text"
              value={value}
              onChange={handleChange}
              onFocus={() => !inputPopoverOpen && setInputPopoverOpen(true)}
              onClick={() => !inputPopoverOpen && setInputPopoverOpen(true)}
              placeholder={placeholder}
              className={cn(
                'flex-1 min-w-24 h-5 bg-transparent',
                'text-body-0-regular text-foreground placeholder:text-foreground-subtle',
                'focus:outline-none',
              )}
              {...props}
            />
          </PopoverAnchor>
          <PopoverContent
            align="start"
            className="w-56 p-6"
            onInteractOutside={(e) => {
              // Prevent closing when clicking on the input anchor
              const target = e.target as HTMLElement
              if (target.tagName === 'INPUT' && target.closest('[data-hawkins-search]')) {
                e.preventDefault()
              }
            }}
          >
            <div className="space-y-4">
              <FilterOptionGhost width="w-32" />
              <FilterOptionGhost width="w-40" />
              <FilterOptionGhost width="w-28" />
              <FilterOptionGhost width="w-36" />
              <FilterOptionGhost width="w-24" />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    )

    if (!collapsible) return searchBar

    return (
      <>
        {!mobileExpanded && (
          <Button
            variant="icon"
            className="md:hidden"
            onClick={() => {
              setMobileExpanded(true)
              requestAnimationFrame(() => inputRef.current?.focus())
            }}
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </Button>
        )}
        {mobileExpanded && (
          <div className="md:hidden absolute inset-0 z-10 flex items-center gap-2 bg-surface-flat">
            <div
              data-hawkins-search
              className={cn(
                'flex items-center gap-2 h-10 px-2 rounded border border-border-subtle dark:border-border-inverse-subtle flex-1',
                className
              )}
            >
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                className="flex-1 min-w-0 h-5 bg-transparent text-body-0-regular text-foreground placeholder:text-foreground-subtle focus:outline-none"
                {...props}
              />
            </div>
            <Button
              variant="icon"
              onClick={() => { onValueChange?.(''); setMobileExpanded(false) }}
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        {searchBar}
      </>
    )
  }
)

HawkinsSearch.displayName = 'HawkinsSearch'

export { HawkinsSearch }
