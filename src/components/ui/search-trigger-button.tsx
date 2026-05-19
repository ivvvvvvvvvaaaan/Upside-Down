'use client'

import { Search } from 'lucide-react'
import { Button } from './button'
import { useSearchOverlay } from './search-overlay-context'
import { cn } from '@/lib/utils'

/**
 * SearchTriggerButton — visually mimics HawkinsSearch but is a button. Click
 * opens the spotlight overlay. Replaces in-page HawkinsSearch instances
 * across workspace/collection/folder views — typing now happens in the modal.
 *
 * Pass `contextPhrase` when the trigger lives inside a view scoped to a
 * specific ontology entity (e.g. a character smart collection) — the overlay
 * pre-pins that phrase as a chip when it opens.
 *
 * `collapsible` matches HawkinsSearch's mobile behavior — render an icon
 * button on small screens, the full bar on md+.
 */

export interface SearchTriggerButtonProps {
  /** Pre-pin this phrase as a chip on overlay open (entity-scoped views). */
  contextPhrase?: string
  /** Placeholder text shown inside the button. */
  placeholder?: string
  /** Collapse to an icon button on mobile. */
  collapsible?: boolean
  className?: string
}

export function SearchTriggerButton({
  contextPhrase,
  placeholder = 'Search…',
  collapsible = false,
  className,
}: SearchTriggerButtonProps) {
  const { open } = useSearchOverlay()
  const handleOpen = () => open({ contextPhrase })

  // Mobile icon button (only when collapsible)
  const mobile = collapsible && (
    <Button
      variant="icon"
      size="icon"
      className="md:hidden"
      onClick={handleOpen}
      aria-label="Search"
    >
      <Search className="w-4 h-4" />
    </Button>
  )

  // Desktop trigger bar — visually matches HawkinsSearch idle state.
  const desktop = (
    <button
      type="button"
      onClick={handleOpen}
      className={cn(
        'flex items-center gap-2 h-10 px-2 rounded-md',
        'border border-border-subtle dark:border-border-inverse-subtle',
        'min-w-44 text-left',
        'hover:bg-surface-highlight transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-system-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        collapsible && 'hidden md:flex',
        className,
      )}
    >
      <Search className="w-4 h-4 text-foreground-dim flex-shrink-0" />
      <span className="flex-1 min-w-0 truncate text-body-0-regular text-foreground-subtle">
        {placeholder}
      </span>
    </button>
  )

  return (
    <>
      {mobile}
      {desktop}
    </>
  )
}
