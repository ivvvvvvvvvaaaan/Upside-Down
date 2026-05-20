'use client'

import { forwardRef, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

function CmdKHint() {
  return (
    <kbd className="inline-flex items-center gap-px px-1.5 h-5 rounded border border-border-subtle dark:border-border-inverse-subtle text-[10px] leading-none text-foreground-subtle pointer-events-none select-none flex-shrink-0">
      ⌘K
    </kbd>
  )
}

/**
 * Minimal search input — search icon on the left, plain text input.
 * The richer filter-chip / saved-filters UI was removed pending a foundational
 * rethink of how search should work.
 */

export interface HawkinsSearchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  value?: string
  onValueChange?: (value: string) => void
  /** On mobile, render as an icon that expands into a full-width toolbar search. */
  collapsible?: boolean
}

const HawkinsSearch = forwardRef<HTMLInputElement, HawkinsSearchProps>(
  ({ className, value, onValueChange, placeholder = 'Search...', onChange, collapsible = false, ...props }, ref) => {
    const [mobileExpanded, setMobileExpanded] = useState(false)
    const [focused, setFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement | null>(null)

    const setInputRef = (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.(e.target.value)
      onChange?.(e)
    }

    const searchBar = (
      <div
        className={cn(
          'flex items-center gap-2 h-10 px-2 rounded-md border border-border-subtle dark:border-border-inverse-subtle',
          'focus-within:ring-2 focus-within:ring-border-system-focus focus-within:ring-offset-2 focus-within:ring-offset-background',
          'flex-1',
          collapsible && 'hidden md:flex',
          className,
        )}
      >
        <Search className="w-4 h-4 text-foreground-dim flex-shrink-0" />
        <input
          ref={collapsible ? undefined : setInputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
          placeholder={placeholder}
          className="flex-1 min-w-0 h-5 bg-transparent text-body-0-regular text-foreground placeholder:text-foreground-subtle focus:outline-none"
          {...props}
        />
        {!value && !focused && <CmdKHint />}
      </div>
    )

    if (!collapsible) return searchBar

    return (
      <>
        {!mobileExpanded && (
          <Button
            variant="icon"
            size="icon"
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
              className={cn(
                'flex items-center gap-2 h-10 px-2 rounded-md border border-border-subtle dark:border-border-inverse-subtle',
                'focus-within:ring-2 focus-within:ring-border-system-focus focus-within:ring-offset-2 focus-within:ring-offset-background',
                'flex-1',
                className,
              )}
            >
              <Search className="w-4 h-4 text-foreground-dim flex-shrink-0" />
              <input
                ref={setInputRef}
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
              size="icon"
              onClick={() => {
                onValueChange?.('')
                setMobileExpanded(false)
              }}
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        {searchBar}
      </>
    )
  },
)

HawkinsSearch.displayName = 'HawkinsSearch'

export { HawkinsSearch }
