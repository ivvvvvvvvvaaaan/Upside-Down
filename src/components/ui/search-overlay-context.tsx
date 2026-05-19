'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * SearchOverlayContext — global open/close state for the spotlight search
 * modal. Any view can call `open({ contextPhrase })` and a single modal
 * (mounted in /nextgen/layout) appears with the phrase pre-pinned.
 */

type OverlayState = {
  isOpen: boolean
  /** When opening from a character/scene/location view, pre-pin that entity. */
  contextPhrase?: string
}

type SearchOverlayCtx = OverlayState & {
  open: (opts?: { contextPhrase?: string }) => void
  close: () => void
}

const Ctx = createContext<SearchOverlayCtx | null>(null)

export function SearchOverlayProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OverlayState>({ isOpen: false })

  const open = useCallback((opts?: { contextPhrase?: string }) => {
    setState({ isOpen: true, contextPhrase: opts?.contextPhrase })
  }, [])

  const close = useCallback(() => {
    setState({ isOpen: false, contextPhrase: undefined })
  }, [])

  const value = useMemo<SearchOverlayCtx>(() => ({ ...state, open, close }), [state, open, close])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSearchOverlay(): SearchOverlayCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSearchOverlay must be called within <SearchOverlayProvider>')
  return v
}
