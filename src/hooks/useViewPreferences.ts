import { useState, useEffect, useCallback, useRef } from 'react'
import type { LayoutType, CardSize } from '@/components/ui/appearance-dropdown'

const STORAGE_KEY = 'collection-view-preferences'

export type CollectionViewType = 'all' | 'character' | 'location' | 'scene'

interface ViewPreferences {
  layout: LayoutType
  cardSize: CardSize
  hideEmptyCollections: boolean
  viewMode: string
  sidePanelOpen: boolean
}

const DEFAULT_PREFERENCES: ViewPreferences = {
  layout: 'grid',
  cardSize: 'md',
  hideEmptyCollections: false,
  viewMode: 'grid',
  sidePanelOpen: false,
}

const VALID_LAYOUTS: LayoutType[] = ['grid', 'list', 'gallery']
const VALID_CARD_SIZES: CardSize[] = ['sm', 'md', 'lg']

function getStoredPreferences(): ViewPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_PREFERENCES

    const parsed = JSON.parse(stored)

    // Validate stored values, fall back to defaults if invalid
      return {
        layout: VALID_LAYOUTS.includes(parsed.layout) ? parsed.layout : DEFAULT_PREFERENCES.layout,
        cardSize: VALID_CARD_SIZES.includes(parsed.cardSize) ? parsed.cardSize : DEFAULT_PREFERENCES.cardSize,
        hideEmptyCollections: typeof parsed.hideEmptyCollections === 'boolean' ? parsed.hideEmptyCollections : DEFAULT_PREFERENCES.hideEmptyCollections,
        viewMode: typeof parsed.viewMode === 'string' ? parsed.viewMode : DEFAULT_PREFERENCES.viewMode,
        sidePanelOpen: typeof parsed.sidePanelOpen === 'boolean' ? parsed.sidePanelOpen : DEFAULT_PREFERENCES.sidePanelOpen,
      }
  } catch (error) {
    console.warn('Failed to read view preferences from localStorage:', error)
    return DEFAULT_PREFERENCES
  }
}

function savePreferences(preferences: ViewPreferences): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch (error) {
    console.error('Failed to save view preferences:', error)
  }
}

export interface UseViewPreferencesReturn {
  layout: LayoutType
  cardSize: CardSize
  hideEmptyCollections: boolean
  viewMode: string
  sidePanelOpen: boolean
  setLayout: (layout: LayoutType) => void
  setCardSize: (cardSize: CardSize) => void
  setHideEmptyCollections: (hide: boolean) => void
  setViewMode: (mode: string) => void
  setSidePanelOpen: (open: boolean) => void
}

export function getGridColumns(cardSize: CardSize): 3 | 4 | 6 {
  switch (cardSize) {
    case 'sm':
      return 6
    case 'lg':
      return 3
    default:
      return 4
  }
}

export function useViewPreferences(): UseViewPreferencesReturn {
  const [mounted, setMounted] = useState(false)
  const [layout, setLayoutState] = useState<LayoutType>(DEFAULT_PREFERENCES.layout)
  const [cardSize, setCardSizeState] = useState<CardSize>(DEFAULT_PREFERENCES.cardSize)
  const [hideEmptyCollections, setHideEmptyCollectionsState] = useState<boolean>(DEFAULT_PREFERENCES.hideEmptyCollections)
  const [viewMode, setViewModeState] = useState<string>(DEFAULT_PREFERENCES.viewMode)
  const [sidePanelOpen, setSidePanelOpenState] = useState<boolean>(DEFAULT_PREFERENCES.sidePanelOpen)

  // Load preferences on mount
  useEffect(() => {
    setMounted(true)
    const prefs = getStoredPreferences()
    setLayoutState(prefs.layout)
    setCardSizeState(prefs.cardSize)
    setHideEmptyCollectionsState(prefs.hideEmptyCollections)
    setViewModeState(prefs.viewMode)
    setSidePanelOpenState(prefs.sidePanelOpen)
  }, [])

  const prefsRef = useRef(DEFAULT_PREFERENCES)
  useEffect(() => { prefsRef.current = { layout, cardSize, hideEmptyCollections, viewMode, sidePanelOpen } }, [layout, cardSize, hideEmptyCollections, viewMode, sidePanelOpen])

  const persist = useCallback((patch: Partial<ViewPreferences>) => {
    if (mounted) savePreferences({ ...prefsRef.current, ...patch })
  }, [mounted])

  const setLayout = useCallback((newLayout: LayoutType) => {
    setLayoutState(newLayout)
    persist({ layout: newLayout })
  }, [persist])

  const setCardSize = useCallback((newCardSize: CardSize) => {
    setCardSizeState(newCardSize)
    persist({ cardSize: newCardSize })
  }, [persist])

  const setHideEmptyCollections = useCallback((hide: boolean) => {
    setHideEmptyCollectionsState(hide)
    persist({ hideEmptyCollections: hide })
  }, [persist])

  const setViewMode = useCallback((newViewMode: string) => {
    setViewModeState(newViewMode)
    persist({ viewMode: newViewMode })
  }, [persist])

  const setSidePanelOpen = useCallback((open: boolean) => {
    setSidePanelOpenState(open)
    persist({ sidePanelOpen: open })
  }, [persist])

  return {
    layout,
    cardSize,
    hideEmptyCollections,
    viewMode,
    sidePanelOpen,
    setLayout,
    setCardSize,
    setHideEmptyCollections,
    setViewMode,
    setSidePanelOpen,
  }
}
