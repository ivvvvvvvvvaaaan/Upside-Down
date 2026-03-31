'use client'

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import type { SmartCollection, SmartCollectionGroupBy, AssetFilter, Asset, SmartCollectionIcon } from '@/lib/data'
import { mergePrototypeAssets } from '@/lib/prototype-assets'
import { matchesFilter, slugify, generateChildCollections } from '@/lib/smart-collection-filters'
import { useAccess } from './useAccess'
import { usePersona } from './usePersona'

// Re-export for existing consumers
export { matchesFilter, slugify, generateChildCollections } from '@/lib/smart-collection-filters'

// System default smart collections — visible to everyone
const SYSTEM_DEFAULTS: SmartCollection[] = [
  {
    id: 'smart-character',
    name: 'Character',
    icon: 'character',
    filter: { aiHasCharacters: true },
    isDefault: true,
    createdAt: new Date('2026-01-15'),
    groupBy: 'characters',
  },
  {
    id: 'smart-scene',
    name: 'Scene',
    icon: 'scene',
    filter: { aiHasScene: true },
    isDefault: true,
    createdAt: new Date('2026-01-15'),
    groupBy: 'scenes',
  },
  {
    id: 'smart-location',
    name: 'Location',
    icon: 'location',
    filter: { aiHasLocation: true },
    isDefault: true,
    createdAt: new Date('2026-01-15'),
    groupBy: 'locations',
  },
  {
    id: 'smart-shot',
    name: 'Shot',
    icon: 'shot',
    filter: { types: ['shot'] },
    isDefault: true,
    createdAt: new Date('2026-01-15'),
  },
  {
    id: 'smart-sequence',
    name: 'Sequence',
    icon: 'sequence',
    filter: { typeTags: ['Sequence', 'CG Sequence', 'Edit Sequence'] },
    isDefault: true,
    createdAt: new Date('2026-01-15'),
  },
]

// Seed user-created smart collections — each owned by a specific persona
const SEED_USER_COLLECTIONS: SmartCollection[] = [
  {
    id: 'smart-finals',
    name: 'Finals',
    icon: 'shot',
    filter: { isFinal: true },
    createdBy: 'schen@netflix.com',
    createdAt: new Date('2026-02-05'),
  },
  {
    id: 'smart-key-art',
    name: 'Key Art',
    icon: 'scene',
    filter: { isKeyArt: true },
    createdBy: 'psharma@netflix.com',
    createdAt: new Date('2026-02-08'),
  },
  {
    id: 'smart-low-conf',
    name: 'Needs AI Review',
    icon: 'filter',
    filter: { aiConfidenceBelow: 0.7 },
    createdBy: 'mtorres@netflix.com',
    createdAt: new Date('2026-02-10'),
  },
]

const DEFAULT_SMART_COLLECTIONS: SmartCollection[] = [...SYSTEM_DEFAULTS, ...SEED_USER_COLLECTIONS]

export interface RelatedCollections {
  characters: SmartCollection[]
  scenes: SmartCollection[]
  locations: SmartCollection[]
}

interface SmartCollectionsContextValue {
  collections: SmartCollection[]
  visibleCollections: SmartCollection[]
  allCollections: SmartCollection[]
  createCollection: (name: string, icon: SmartCollectionIcon, filter: AssetFilter) => SmartCollection
  updateCollection: (id: string, updates: Partial<Omit<SmartCollection, 'id' | 'isDefault' | 'createdAt'>>) => void
  deleteCollection: (id: string) => boolean
  getCollection: (id: string) => SmartCollection | undefined
  getChildren: (parentId: string) => SmartCollection[]
  getRelatedCollections: (collectionId: string) => RelatedCollections
  filterAssets: (assets: Asset[], collectionId: string) => Asset[]
  allAssets: Asset[]
  scopedAssets: Asset[]
  assetsLoading: boolean
}

const SmartCollectionsContext = createContext<SmartCollectionsContextValue | null>(null)

export function SmartCollectionsProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<SmartCollection[]>(DEFAULT_SMART_COLLECTIONS)
  const [allAssets, setAllAssets] = useState<Asset[]>([])
  const [assetsLoading, setAssetsLoading] = useState(true)
  const { filterByAccess } = useAccess()
  const { activePersona } = usePersona()
  const personaEmail = activePersona?.email

  // Collections visible to the active persona: defaults + own creations (admin sees all)
  const visibleCollections = useMemo(() => {
    if (!activePersona) return collections
    return collections.filter(c => c.isDefault || c.createdBy === personaEmail)
  }, [collections, activePersona, personaEmail])

  // Scoped assets: filtered by folder access when a persona is active
  const scopedAssets = useMemo(() => {
    return filterByAccess(allAssets)
  }, [allAssets, filterByAccess])

  // Fetch all assets on mount (API + promoted workspace instances + shared folders)
  useEffect(() => {
    const fetchAll = async () => {
      setAssetsLoading(true)
      try {
        const response = await fetch('/api/assets')
        const apiAssets: Asset[] = response.ok ? await response.json() : []
        setAllAssets(mergePrototypeAssets(apiAssets))
      } catch (error) {
        console.error('Failed to fetch assets for smart collections:', error)
        setAllAssets([])
      }
      setAssetsLoading(false)
    }

    fetchAll()
  }, [])

  // Compute child collections from scoped assets (only for visible parents)
  const childCollections = useMemo(() => {
    if (scopedAssets.length === 0) return []
    return visibleCollections.flatMap(parent => generateChildCollections(parent, scopedAssets))
  }, [visibleCollections, scopedAssets])

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
      createdBy: personaEmail,
      createdAt: new Date(),
    }
    setCollections(prev => [...prev, newCollection])
    return newCollection
  }, [personaEmail])

  const updateCollection = useCallback((
    id: string,
    updates: Partial<Omit<SmartCollection, 'id' | 'isDefault' | 'createdAt'>>
  ) => {
    setCollections(prev => prev.map(c =>
      c.id === id ? { ...c, ...updates } : c
    ))
  }, [])

  const deleteCollection = useCallback((id: string): boolean => {
    const target = collections.find(c => c.id === id)
    if (!target || target.isDefault) return false
    if (target.createdBy && target.createdBy !== personaEmail) return false
    setCollections(prev => prev.filter(c => c.id !== id))
    return true
  }, [collections, personaEmail])

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

    // Get assets matching this child collection (scoped to persona access)
    const matchingAssets = scopedAssets.filter(a => matchesFilter(a, collection.filter))

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
  }, [allCollections, collections, scopedAssets])

  const filterAssets = useCallback((assets: Asset[], collectionId: string): Asset[] => {
    const collection = allCollections.find(c => c.id === collectionId)
    if (!collection) {
      return []
    }
    return assets.filter(asset => matchesFilter(asset, collection.filter))
  }, [allCollections])

  return (
    <SmartCollectionsContext.Provider
      value={useMemo(() => ({
        collections,
        visibleCollections,
        allCollections,
        createCollection,
        updateCollection,
        deleteCollection,
        getCollection,
        getChildren,
        getRelatedCollections,
        filterAssets,
        allAssets,
        scopedAssets,
        assetsLoading,
      }), [collections, visibleCollections, allCollections, createCollection, updateCollection, deleteCollection, getCollection, getChildren, getRelatedCollections, filterAssets, allAssets, scopedAssets, assetsLoading])}
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
