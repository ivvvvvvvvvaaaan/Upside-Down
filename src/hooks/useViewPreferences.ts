import { useState, useEffect, useCallback } from 'react'
import type { LayoutType, CardSize } from '@/components/ui/appearance-dropdown'

const STORAGE_KEY = 'collection-view-preferences'

export type CollectionViewType = 'all' | 'character' | 'location' | 'scene'

interface ViewPreferences {
  layout: LayoutType
  cardSize: CardSize
}

interface StoredPreferences {
  [key: string]: ViewPreferences
}

const DEFAULT_PREFERENCES: ViewPreferences = {
  layout: 'grid',
  cardSize: 'md',
}

function getStoredPreferences(): StoredPreferences {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function savePreferences(preferences: StoredPreferences): void {
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

export function useViewPreferences(collectionType: CollectionViewType): UseViewPreferencesReturn {
  const [mounted, setMounted] = useState(false)
  const [layout, setLayoutState] = useState<LayoutType>(DEFAULT_PREFERENCES.layout)
  const [cardSize, setCardSizeState] = useState<CardSize>(DEFAULT_PREFERENCES.cardSize)

  // Load preferences on mount
  useEffect(() => {
    setMounted(true)
    const stored = getStoredPreferences()
    const prefs = stored[collectionType] || DEFAULT_PREFERENCES
    setLayoutState(prefs.layout)
    setCardSizeState(prefs.cardSize)
  }, [collectionType])

  // Save layout preference
  const setLayout = useCallback((newLayout: LayoutType) => {
    setLayoutState(newLayout)
    if (mounted) {
      const stored = getStoredPreferences()
      stored[collectionType] = {
        ...stored[collectionType] || DEFAULT_PREFERENCES,
        layout: newLayout,
      }
      savePreferences(stored)
    }
  }, [collectionType, mounted])

  // Save cardSize preference
  const setCardSize = useCallback((newCardSize: CardSize) => {
    setCardSizeState(newCardSize)
    if (mounted) {
      const stored = getStoredPreferences()
      stored[collectionType] = {
        ...stored[collectionType] || DEFAULT_PREFERENCES,
        cardSize: newCardSize,
      }
      savePreferences(stored)
    }
  }, [collectionType, mounted])

  return {
    layout,
    cardSize,
    setLayout,
    setCardSize,
  }
}
