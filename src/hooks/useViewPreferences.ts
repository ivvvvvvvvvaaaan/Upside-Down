import { useState, useEffect, useCallback } from 'react'
import type { LayoutType, CardSize } from '@/components/ui/appearance-dropdown'

const STORAGE_KEY = 'collection-view-preferences'

export type CollectionViewType = 'all' | 'character' | 'location' | 'scene'

interface ViewPreferences {
  layout: LayoutType
  cardSize: CardSize
}

const DEFAULT_PREFERENCES: ViewPreferences = {
  layout: 'grid',
  cardSize: 'md',
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
    }
  } catch {
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
  setLayout: (layout: LayoutType) => void
  setCardSize: (cardSize: CardSize) => void
}

export function useViewPreferences(): UseViewPreferencesReturn {
  const [mounted, setMounted] = useState(false)
  const [layout, setLayoutState] = useState<LayoutType>(DEFAULT_PREFERENCES.layout)
  const [cardSize, setCardSizeState] = useState<CardSize>(DEFAULT_PREFERENCES.cardSize)

  // Load preferences on mount
  useEffect(() => {
    setMounted(true)
    const prefs = getStoredPreferences()
    setLayoutState(prefs.layout)
    setCardSizeState(prefs.cardSize)
  }, [])

  // Save layout preference
  const setLayout = useCallback((newLayout: LayoutType) => {
    setLayoutState(newLayout)
    if (mounted) {
      const current = getStoredPreferences()
      savePreferences({ ...current, layout: newLayout })
    }
  }, [mounted])

  // Save cardSize preference
  const setCardSize = useCallback((newCardSize: CardSize) => {
    setCardSizeState(newCardSize)
    if (mounted) {
      const current = getStoredPreferences()
      savePreferences({ ...current, cardSize: newCardSize })
    }
  }, [mounted])

  return {
    layout,
    cardSize,
    setLayout,
    setCardSize,
  }
}
