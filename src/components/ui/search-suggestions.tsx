'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Suggestion } from '@/lib/search'
import { KIND_DISPLAY } from '@/lib/search'

/**
 * SearchSuggestions — typeahead dropdown rendered under the search input
 * while it has focus and unconsumed free-text remaining.
 *
 * Keyboard:
 *   ↓ / ↑     move highlight
 *   Enter     select highlighted suggestion
 *   Escape    close (caller controls visibility via `open`)
 *
 * Click also selects. The parent owns the input value and dropdown visibility;
 * this component is presentational + keyboard-handling only.
 */

export interface SearchSuggestionsProps {
  suggestions: Suggestion[]
  /** Forwarded to the document keyboard handler — when false the dropdown is hidden and nothing is bound. */
  open: boolean
  /** Called when the user picks (mouse or keyboard). */
  onSelect: (s: Suggestion) => void
  /** Called when Escape is pressed. */
  onDismiss: () => void
  /** Used so the document keydown handler ignores presses originating elsewhere. */
  inputRef: React.RefObject<HTMLInputElement>
}

export function SearchSuggestions({
  suggestions,
  open,
  onSelect,
  onDismiss,
  inputRef,
}: SearchSuggestionsProps) {
  const [highlight, setHighlight] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  // Reset highlight whenever the candidate list changes.
  useEffect(() => {
    setHighlight(0)
  }, [suggestions])

  // Keyboard nav: bind to the input element so we don't conflict with body shortcuts.
  useEffect(() => {
    if (!open) return
    const input = inputRef.current
    if (!input) return

    const onKey = (e: KeyboardEvent) => {
      if (suggestions.length === 0) {
        if (e.key === 'Escape') onDismiss()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlight(h => (h + 1) % suggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlight(h => (h - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        onSelect(suggestions[highlight])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onDismiss()
      }
    }

    input.addEventListener('keydown', onKey)
    return () => input.removeEventListener('keydown', onKey)
  }, [open, suggestions, highlight, onSelect, onDismiss, inputRef])

  // Keep the highlighted row scrolled into view.
  useEffect(() => {
    const el = listRef.current?.children[highlight] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight])

  if (!open || suggestions.length === 0) return null

  return (
    <div
      className={cn(
        'absolute left-0 right-0 top-full mt-1 z-40',
        'rounded-md bg-surface-2 shadow-mid',
        'ring-1 ring-inset ring-border-subtle dark:ring-border-inverse-subtle',
        'overflow-hidden',
      )}
      role="listbox"
    >
      <ul ref={listRef} className="max-h-72 overflow-auto py-1">
        {suggestions.map((s, i) => (
          <li
            key={`${s.kind}-${s.canonical}`}
            role="option"
            aria-selected={i === highlight}
            onMouseEnter={() => setHighlight(i)}
            onMouseDown={(e) => {
              // mousedown (not click) so the input doesn't lose focus first
              e.preventDefault()
              onSelect(s)
            }}
            className={cn(
              'flex items-center justify-between gap-3 px-3 py-2 cursor-pointer',
              'text-body-0-regular',
              i === highlight ? 'bg-surface-highlight text-foreground' : 'text-foreground',
            )}
          >
            <span className="truncate">{s.label}</span>
            <span className="text-label-0-regular text-foreground-subtle">
              {KIND_DISPLAY[s.kind]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
