'use client'

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import type { SmartCollection, SmartCollectionGroupBy, AssetFilter, Asset, SmartCollectionIcon, SmartCollectionCategory, DepartmentId } from '@/lib/data'
import { mergeWorkspaceAssets, generateAssetInstances } from '@/lib/asset-instances'
import { getDepartmentWorkspaceFiles } from '@/lib/workspace-data'
import { matchesFilter, slugify, generateChildCollections } from '@/lib/smart-collection-filters'

// Re-export for existing consumers
export { matchesFilter, slugify, generateChildCollections } from '@/lib/smart-collection-filters'

const ALL_DEPARTMENTS: DepartmentId[] = ['art-design', 'vfx', 'camera', 'editorial', 'audio-sound']

// Default smart collections grouped by pipeline stage
const DEFAULT_SMART_COLLECTIONS: SmartCollection[] = [
  // Narrative
  {
    id: 'smart-narrative-character',
    name: 'Character',
    icon: 'character',
    filter: { aiHasCharacters: true },
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    groupBy: 'characters',
    category: 'narrative',
  },
  {
    id: 'smart-narrative-scene',
    name: 'Scene',
    icon: 'scene',
    filter: { aiHasScene: true },
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    groupBy: 'scenes',
    category: 'narrative',
  },
  {
    id: 'smart-narrative-location',
    name: 'Location',
    icon: 'location',
    filter: { aiHasLocation: true },
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    groupBy: 'locations',
    category: 'narrative',
  },
  // Production
  {
    id: 'smart-production-shot',
    name: 'Shot (Live Action)',
    icon: 'shot',
    filter: { types: ['shot'] },
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    category: 'production',
  },
  {
    id: 'smart-production-scene',
    name: 'Scene',
    icon: 'scene',
    filter: { aiHasScene: true, types: ['shot'] },
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    groupBy: 'scenes',
    category: 'production',
  },
  // CG
  {
    id: 'smart-cg-shot',
    name: 'Shot',
    icon: 'shot',
    filter: { types: ['shot'], typeTags: ['CG', 'VFX'] },
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    category: 'cg',
  },
  {
    id: 'smart-cg-sequence',
    name: 'Sequence',
    icon: 'sequence',
    filter: { typeTags: ['Sequence', 'CG Sequence'] },
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    category: 'cg',
  },
  // Edit
  {
    id: 'smart-edit-shot',
    name: 'Shot',
    icon: 'shot',
    filter: { types: ['shot'], department: 'editorial' },
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    category: 'edit',
  },
  {
    id: 'smart-edit-scene',
    name: 'Scene',
    icon: 'scene',
    filter: { aiHasScene: true, department: 'editorial' },
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    groupBy: 'scenes',
    category: 'edit',
  },
  {
    id: 'smart-edit-sequence',
    name: 'Sequence',
    icon: 'sequence',
    filter: { typeTags: ['Sequence', 'Edit Sequence'], department: 'editorial' },
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    category: 'edit',
  },
]

export interface RelatedCollections {
  characters: SmartCollection[]
  scenes: SmartCollection[]
  locations: SmartCollection[]
}

interface SmartCollectionsContextValue {
  collections: SmartCollection[]
  allCollections: SmartCollection[]
  createCollection: (name: string, icon: SmartCollectionIcon, filter: AssetFilter) => SmartCollection
  updateCollection: (id: string, updates: Partial<Omit<SmartCollection, 'id' | 'isDefault' | 'createdAt'>>) => void
  deleteCollection: (id: string) => boolean
  getCollection: (id: string) => SmartCollection | undefined
  getChildren: (parentId: string) => SmartCollection[]
  getRelatedCollections: (collectionId: string) => RelatedCollections
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

  const getRelatedCollections = useCallback((collectionId: string): RelatedCollections => {
    const empty: RelatedCollections = { characters: [], scenes: [], locations: [] }
    const collection = allCollections.find(c => c.id === collectionId)
    if (!collection?.parentId) return empty

    const parent = collections.find(c => c.id === collection.parentId)
    if (!parent?.groupBy) return empty

    // Get assets matching this child collection
    const matchingAssets = allAssets.filter(a => matchesFilter(a, collection.filter))

    // Determine own dimension from parent's groupBy — skip it in results
    const ownDimension = parent.groupBy

    // Extract unique values from the other two dimensions
    const characterValues = new Set<string>()
    const sceneValues = new Set<string>()
    const locationValues = new Set<string>()

    for (const asset of matchingAssets) {
      if (!asset.aiMeta) continue
      if (ownDimension !== 'characters' && asset.aiMeta.characters) {
        asset.aiMeta.characters.forEach(c => characterValues.add(c))
      }
      if (ownDimension !== 'scenes' && asset.aiMeta.scene) {
        sceneValues.add(asset.aiMeta.scene)
      }
      if (ownDimension !== 'locations' && asset.aiMeta.location) {
        locationValues.add(asset.aiMeta.location)
      }
    }

    // Map values to existing child collections
    const findChildByValue = (dimension: SmartCollectionGroupBy, value: string): SmartCollection | undefined => {
      const slug = slugify(value)
      // Find any parent that groups by this dimension
      const dimensionParent = collections.find(c => c.groupBy === dimension)
      if (!dimensionParent) return undefined
      return allCollections.find(c => c.id === `${dimensionParent.id}--${slug}`)
    }

    return {
      characters: Array.from(characterValues)
        .sort()
        .map(v => findChildByValue('characters', v))
        .filter((c): c is SmartCollection => !!c),
      scenes: Array.from(sceneValues)
        .sort()
        .map(v => findChildByValue('scenes', v))
        .filter((c): c is SmartCollection => !!c),
      locations: Array.from(locationValues)
        .sort()
        .map(v => findChildByValue('locations', v))
        .filter((c): c is SmartCollection => !!c),
    }
  }, [allCollections, collections, allAssets])

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
        getRelatedCollections,
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
