'use client'

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import type { SmartCollection, SmartCollectionGroupBy, AssetFilter, Asset, SmartCollectionIcon, DepartmentId } from '@/lib/data'
import { mergeWorkspaceAssets, generateAssetInstances } from '@/lib/asset-instances'
import { getDepartmentWorkspaceFiles } from '@/lib/workspace-data'

const ALL_DEPARTMENTS: DepartmentId[] = ['art-design', 'vfx', 'camera', 'editorial', 'audio-sound']

// Default smart collections that serve as suggestions
const DEFAULT_SMART_COLLECTIONS: SmartCollection[] = [
  {
    id: 'smart-characters',
    name: 'Characters',
    icon: 'character',
    filter: { aiHasCharacters: true },
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    groupBy: 'characters',
  },
  {
    id: 'smart-locations',
    name: 'Locations',
    icon: 'location',
    filter: { aiHasLocation: true },
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    groupBy: 'locations',
  },
  {
    id: 'smart-scenes',
    name: 'Scenes',
    icon: 'scene',
    filter: { aiHasScene: true },
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    groupBy: 'scenes',
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
  // Query: free text search on name + AI metadata
  if (filter.query && filter.query.trim()) {
    const query = filter.query.toLowerCase().trim()
    const searchParts = [asset.name]
    if (asset.aiMeta) {
      if (asset.aiMeta.characters) searchParts.push(...asset.aiMeta.characters)
      if (asset.aiMeta.keywords) searchParts.push(...asset.aiMeta.keywords)
      if (asset.aiMeta.location) searchParts.push(asset.aiMeta.location)
      if (asset.aiMeta.scene) searchParts.push(asset.aiMeta.scene)
    }
    const searchText = searchParts.join(' ').toLowerCase()
    if (!searchText.includes(query)) {
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

  // AI metadata filters
  if (filter.aiHasCharacters) {
    if (!asset.aiMeta?.characters || asset.aiMeta.characters.length === 0) {
      return false
    }
  }

  if (filter.aiHasLocation) {
    if (!asset.aiMeta?.location) {
      return false
    }
  }

  if (filter.aiHasScene) {
    if (!asset.aiMeta?.scene) {
      return false
    }
  }

  if (filter.aiCharacters && filter.aiCharacters.length > 0) {
    if (!asset.aiMeta?.characters || asset.aiMeta.characters.length === 0) {
      return false
    }
    const filterChars = filter.aiCharacters.map(c => c.toLowerCase())
    const assetChars = asset.aiMeta.characters.map(c => c.toLowerCase())
    const hasIntersection = filterChars.some(fc => assetChars.includes(fc))
    if (!hasIntersection) {
      return false
    }
  }

  if (filter.aiLocation) {
    if (!asset.aiMeta?.location) {
      return false
    }
    if (asset.aiMeta.location.toLowerCase() !== filter.aiLocation.toLowerCase()) {
      return false
    }
  }

  if (filter.aiScene) {
    if (!asset.aiMeta?.scene) {
      return false
    }
    if (asset.aiMeta.scene.toLowerCase() !== filter.aiScene.toLowerCase()) {
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

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** Generate child smart collections from a parent's groupBy dimension */
function generateChildCollections(parent: SmartCollection, assets: Asset[]): SmartCollection[] {
  if (!parent.groupBy) return []

  // Filter assets matching parent's filter
  const matchingAssets = assets.filter(a => matchesFilter(a, parent.filter))

  // Extract unique values from the relevant aiMeta field
  const valuesSet = new Set<string>()
  for (const asset of matchingAssets) {
    if (!asset.aiMeta) continue
    switch (parent.groupBy) {
      case 'characters':
        if (asset.aiMeta.characters) {
          asset.aiMeta.characters.forEach(c => valuesSet.add(c))
        }
        break
      case 'locations':
        if (asset.aiMeta.location) {
          valuesSet.add(asset.aiMeta.location)
        }
        break
      case 'scenes':
        if (asset.aiMeta.scene) {
          valuesSet.add(asset.aiMeta.scene)
        }
        break
    }
  }

  // Create child SmartCollection per unique value
  const sortedValues = Array.from(valuesSet).sort()
  return sortedValues.map(value => {
    const childFilter: AssetFilter = {}
    switch (parent.groupBy) {
      case 'characters':
        childFilter.aiCharacters = [value]
        break
      case 'locations':
        childFilter.aiLocation = value
        break
      case 'scenes':
        childFilter.aiScene = value
        break
    }

    return {
      id: `${parent.id}--${slugify(value)}`,
      name: value,
      icon: parent.icon,
      filter: childFilter,
      isDefault: true,
      createdAt: parent.createdAt,
      parentId: parent.id,
    }
  })
}

interface SmartCollectionsContextValue {
  collections: SmartCollection[]
  allCollections: SmartCollection[]
  createCollection: (name: string, icon: SmartCollectionIcon, filter: AssetFilter) => SmartCollection
  updateCollection: (id: string, updates: Partial<Omit<SmartCollection, 'id' | 'isDefault' | 'createdAt'>>) => void
  deleteCollection: (id: string) => boolean
  getCollection: (id: string) => SmartCollection | undefined
  getChildren: (parentId: string) => SmartCollection[]
  filterAssets: (assets: Asset[], collectionId: string) => Asset[]
  allAssets: Asset[]
  assetsLoading: boolean
}

const SmartCollectionsContext = createContext<SmartCollectionsContextValue | null>(null)

export function SmartCollectionsProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<SmartCollection[]>(DEFAULT_SMART_COLLECTIONS)
  const [allAssets, setAllAssets] = useState<Asset[]>([])
  const [assetsLoading, setAssetsLoading] = useState(true)

  // Fetch all assets on mount (API + promoted workspace instances)
  useEffect(() => {
    const fetchAll = async () => {
      setAssetsLoading(true)
      try {
        const response = await fetch('/api/assets')
        const apiAssets: Asset[] = response.ok ? await response.json() : []

        // Generate promoted assets from workspace managed zones
        const allInstances = ALL_DEPARTMENTS.flatMap(deptId => {
          const files = getDepartmentWorkspaceFiles(deptId)
          return generateAssetInstances(files, deptId)
        })

        setAllAssets(mergeWorkspaceAssets(apiAssets, allInstances))
      } catch (error) {
        console.error('Failed to fetch assets for smart collections:', error)
        setAllAssets([])
      }
      setAssetsLoading(false)
    }

    fetchAll()
  }, [])

  // Compute child collections from loaded assets
  const childCollections = useMemo(() => {
    if (allAssets.length === 0) return []
    return collections.flatMap(parent => generateChildCollections(parent, allAssets))
  }, [collections, allAssets])

  // All collections = parents + children
  const allCollections = useMemo(() => {
    return [...collections, ...childCollections]
  }, [collections, childCollections])

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
    return allCollections.find(c => c.id === id)
  }, [allCollections])

  const getChildren = useCallback((parentId: string): SmartCollection[] => {
    return childCollections.filter(c => c.parentId === parentId)
  }, [childCollections])

  const filterAssets = useCallback((assets: Asset[], collectionId: string): Asset[] => {
    const collection = allCollections.find(c => c.id === collectionId)
    if (!collection) {
      return []
    }
    return assets.filter(asset => matchesFilter(asset, collection.filter))
  }, [allCollections])

  return (
    <SmartCollectionsContext.Provider
      value={{
        collections,
        allCollections,
        createCollection,
        updateCollection,
        deleteCollection,
        getCollection,
        getChildren,
        filterAssets,
        allAssets,
        assetsLoading,
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
