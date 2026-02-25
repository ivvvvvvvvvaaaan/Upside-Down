'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { SmartCollection, AssetFilter, Asset, SmartCollectionIcon } from '@/lib/data'

// Default smart collections that serve as suggestions
const DEFAULT_SMART_COLLECTIONS: SmartCollection[] = [
  {
    id: 'smart-characters',
    name: 'Characters',
    icon: 'character',
    filter: { typeTags: ['Character'] },
    isDefault: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'smart-locations',
    name: 'Locations',
    icon: 'location',
    filter: { typeTags: ['Location', 'Environment'] },
    isDefault: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'smart-scenes',
    name: 'Scenes',
    icon: 'scene',
    filter: { typeTags: ['Scene'] },
    isDefault: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'smart-palettes',
    name: 'Color Palettes',
    icon: 'palette',
    filter: { typeTags: ['Color Palette', 'Palette'] },
    isDefault: true,
    createdAt: new Date('2024-01-01'),
  },
]

/**
 * Check if an asset matches the given filter rules
 * All filter rules are combined with AND logic
 * Empty/undefined rules are ignored (pass-through)
 */
export function matchesFilter(asset: Asset, filter: AssetFilter): boolean {
  // Query: free text search on name
  if (filter.query && filter.query.trim()) {
    const query = filter.query.toLowerCase().trim()
    const name = asset.name.toLowerCase()
    if (!name.includes(query)) {
      return false
    }
  }

  // Types: asset type must be in the list
  if (filter.types && filter.types.length > 0) {
    if (!filter.types.includes(asset.type)) {
      return false
    }
  }

  // Department: must match
  if (filter.department) {
    if (asset.department !== filter.department) {
      return false
    }
  }

  // Type tags: asset must have at least one matching tag
  if (filter.typeTags && filter.typeTags.length > 0) {
    const assetTypeTag = getAssetTypeTag(asset)
    if (!assetTypeTag) {
      return false
    }
    const normalizedTags = filter.typeTags.map(t => t.toLowerCase())
    if (!normalizedTags.includes(assetTypeTag.toLowerCase())) {
      return false
    }
  }

  // Key art: must match if specified
  if (filter.isKeyArt !== undefined) {
    if (Boolean(asset.isKeyArt) !== filter.isKeyArt) {
      return false
    }
  }

  return true
}

/**
 * Get the type tag from an asset's metadata
 */
function getAssetTypeTag(asset: Asset): string | undefined {
  switch (asset.type) {
    case 'video':
      return asset.videoMeta?.typeTag
    case 'image':
      return asset.imageMeta?.typeTag
    case 'text':
      return asset.textMeta?.typeTag
    case 'audio':
      return asset.audioMeta?.typeTag
    default:
      return undefined
  }
}

interface SmartCollectionsContextValue {
  collections: SmartCollection[]
  createCollection: (name: string, icon: SmartCollectionIcon, filter: AssetFilter) => SmartCollection
  updateCollection: (id: string, updates: Partial<Omit<SmartCollection, 'id' | 'isDefault' | 'createdAt'>>) => void
  deleteCollection: (id: string) => boolean
  getCollection: (id: string) => SmartCollection | undefined
  filterAssets: (assets: Asset[], collectionId: string) => Asset[]
}

const SmartCollectionsContext = createContext<SmartCollectionsContextValue | null>(null)

export function SmartCollectionsProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<SmartCollection[]>(DEFAULT_SMART_COLLECTIONS)

  const createCollection = useCallback((
    name: string,
    icon: SmartCollectionIcon,
    filter: AssetFilter
  ): SmartCollection => {
    const newCollection: SmartCollection = {
      id: `smart-${Date.now()}`,
      name,
      icon,
      filter,
      isDefault: false,
      createdAt: new Date(),
    }
    setCollections(prev => [...prev, newCollection])
    return newCollection
  }, [])

  const updateCollection = useCallback((
    id: string,
    updates: Partial<Omit<SmartCollection, 'id' | 'isDefault' | 'createdAt'>>
  ) => {
    setCollections(prev => prev.map(c =>
      c.id === id ? { ...c, ...updates } : c
    ))
  }, [])

  const deleteCollection = useCallback((id: string): boolean => {
    setCollections(prev => prev.filter(c => c.id !== id))
    return true
  }, [])

  const getCollection = useCallback((id: string): SmartCollection | undefined => {
    return collections.find(c => c.id === id)
  }, [collections])

  const filterAssets = useCallback((assets: Asset[], collectionId: string): Asset[] => {
    const collection = collections.find(c => c.id === collectionId)
    if (!collection) {
      return []
    }
    return assets.filter(asset => matchesFilter(asset, collection.filter))
  }, [collections])

  return (
    <SmartCollectionsContext.Provider
      value={{
        collections,
        createCollection,
        updateCollection,
        deleteCollection,
        getCollection,
        filterAssets,
      }}
    >
      {children}
    </SmartCollectionsContext.Provider>
  )
}

export function useSmartCollections(): SmartCollectionsContextValue {
  const context = useContext(SmartCollectionsContext)
  if (!context) {
    throw new Error('useSmartCollections must be used within a SmartCollectionsProvider')
  }
  return context
}
