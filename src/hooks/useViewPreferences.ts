import { useState, useEffect, useCallback, useRef } from 'react'
import type { LayoutType, CardSize } from '@/components/ui/appearance-dropdown'
import { SEED_VERSION } from '@/lib/constants'

const STORAGE_KEY = 'collection-view-preferences'
const VERSION_KEY = 'collection-view-preferences-version'

export type CollectionViewType = 'all' | 'character' | 'location' | 'scene'

interface ViewPreferences {
  layout: LayoutType
  cardSize: CardSize
  hideEmptyCollections: boolean
  viewMode: string
  sidePanelOpen: boolean
  showTags: boolean
  metadataFields: MetadataFieldVisibility
}

export type MetadataFieldVisibility = {
  scene: boolean
  take: boolean
  camera: boolean
  sequence: boolean
  shot: boolean
  episode: boolean
}

const DEFAULT_METADATA_FIELDS: MetadataFieldVisibility = {
  // Scene OFF by default — it's almost always redundant page context (users
  // typically arrive at a card through a scene/character/location page where
  // the scene is already implicit in the breadcrumb). Toggle in Appearance.
  scene: false,
  take: true,
  camera: true,
  sequence: true,
  shot: true,
  episode: true,
}

const DEFAULT_PREFERENCES: ViewPreferences = {
  layout: 'grid',
  cardSize: 'md',
  hideEmptyCollections: false,
  viewMode: 'grid',
  sidePanelOpen: false,
  showTags: true,
  metadataFields: DEFAULT_METADATA_FIELDS,
}

const VALID_LAYOUTS: LayoutType[] = ['grid', 'list', 'gallery']
const VALID_CARD_SIZES: CardSize[] = ['sm', 'md', 'lg']

function getStoredPreferences(): ViewPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES
  try {
    // Migrate stale localStorage: if the stored version doesn't match the
    // current SEED_VERSION, drop the saved prefs and start fresh from
    // DEFAULT_PREFERENCES so users pick up new default values. Same single
    // version constant we use everywhere else (workspace tree, grants, etc.).
    const storedVersion = localStorage.getItem(VERSION_KEY)
    if (storedVersion !== String(SEED_VERSION)) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.setItem(VERSION_KEY, String(SEED_VERSION))
      return DEFAULT_PREFERENCES
    }

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
        showTags: typeof parsed.showTags === 'boolean' ? parsed.showTags : DEFAULT_PREFERENCES.showTags,
        metadataFields: parsed.metadataFields && typeof parsed.metadataFields === 'object'
          ? { ...DEFAULT_METADATA_FIELDS, ...parsed.metadataFields }
          : DEFAULT_METADATA_FIELDS,
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
  showTags: boolean
  metadataFields: MetadataFieldVisibility
  setLayout: (layout: LayoutType) => void
  setCardSize: (cardSize: CardSize) => void
  setHideEmptyCollections: (hide: boolean) => void
  setViewMode: (mode: string) => void
  setSidePanelOpen: (open: boolean) => void
  setShowTags: (show: boolean) => void
  setMetadataField: (field: keyof MetadataFieldVisibility, show: boolean) => void
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
  const [showTags, setShowTagsState] = useState<boolean>(DEFAULT_PREFERENCES.showTags)
  const [metadataFields, setMetadataFieldsState] = useState<MetadataFieldVisibility>(DEFAULT_PREFERENCES.metadataFields)

  // Load preferences on mount
  useEffect(() => {
    setMounted(true)
    const prefs = getStoredPreferences()
    setLayoutState(prefs.layout)
    setCardSizeState(prefs.cardSize)
    setHideEmptyCollectionsState(prefs.hideEmptyCollections)
    setViewModeState(prefs.viewMode)
    setSidePanelOpenState(prefs.sidePanelOpen)
    setShowTagsState(prefs.showTags)
    setMetadataFieldsState(prefs.metadataFields)
  }, [])

  const prefsRef = useRef(DEFAULT_PREFERENCES)
  useEffect(() => { prefsRef.current = { layout, cardSize, hideEmptyCollections, viewMode, sidePanelOpen, showTags, metadataFields } }, [layout, cardSize, hideEmptyCollections, viewMode, sidePanelOpen, showTags, metadataFields])

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

  const setShowTags = useCallback((show: boolean) => {
    setShowTagsState(show)
    persist({ showTags: show })
  }, [persist])

  const setMetadataField = useCallback((field: keyof MetadataFieldVisibility, show: boolean) => {
    const next = { ...prefsRef.current.metadataFields, [field]: show }
    setMetadataFieldsState(next)
    persist({ metadataFields: next })
  }, [persist])

  return {
    layout,
    cardSize,
    hideEmptyCollections,
    viewMode,
    sidePanelOpen,
    showTags,
    metadataFields,
    setLayout,
    setCardSize,
    setHideEmptyCollections,
    setViewMode,
    setSidePanelOpen,
    setShowTags,
    setMetadataField,
  }
}
