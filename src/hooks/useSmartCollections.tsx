'use client'

import { createContext, useContext, useState, useCallback, useMemo, useRef, type ReactNode } from 'react'
import type { SmartCollection, SmartCollectionGroupBy, AssetFilter, Asset, SmartCollectionIcon } from '@/lib/data'
import { mergePrototypeAssets } from '@/lib/prototype-assets'
import { matchesFilter, slugify, generateChildCollections } from '@/lib/smart-collection-filters'
import { useAccess } from './useAccess'
import { usePersona } from './usePersona'
import { DEFAULT_SMART_COLLECTIONS } from '@/lib/smart-collection-seeds'

// Re-export for existing consumers
export { matchesFilter } from '@/lib/smart-collection-filters'

export interface RelatedCollections {
  characters: SmartCollection[]
  scenes: SmartCollection[]
  locations: SmartCollection[]
  takes: SmartCollection[]
  cameras: SmartCollection[]
}

interface SmartCollectionsContextValue {
  collections: SmartCollection[]
  visibleCollections: SmartCollection[]
  allCollections: SmartCollection[]
  createCollection: (name: string, icon: SmartCollectionIcon, filter: AssetFilter) => SmartCollection
  updateCollection: (id: string, updates: Partial<Omit<SmartCollection, 'id' | 'visibleToAll' | 'createdAt'>>) => void
  deleteCollection: (id: string) => boolean
  getCollection: (id: string) => SmartCollection | undefined
  getChildren: (parentId: string) => SmartCollection[]
  getRelatedCollections: (collectionId: string) => RelatedCollections
  getRelatedCollectionsForAssets: (assets: Asset[]) => RelatedCollections
  filterAssets: (assets: Asset[], collectionId: string) => Asset[]
  allAssets: Asset[]
  scopedAssets: Asset[]
  assetsLoaded: boolean
  assetsLoading: boolean
  ensureAssetsLoaded: () => Promise<void>
}

const SmartCollectionsContext = createContext<SmartCollectionsContextValue | null>(null)

export function SmartCollectionsProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<SmartCollection[]>(DEFAULT_SMART_COLLECTIONS)
  const [allAssets, setAllAssets] = useState<Asset[]>([])
  const [assetLoadState, setAssetLoadState] = useState<'idle' | 'loading' | 'loaded'>('idle')
  const assetLoadPromiseRef = useRef<Promise<void> | null>(null)
  const { filterByAccess, canAccess, createGrant } = useAccess()
  const { activePersona } = usePersona()
  const personaEmail = activePersona?.email
  const personaId = activePersona?.id

  const canManageCollection = useCallback((collection: SmartCollection | undefined): boolean => {
    if (!collection) return false
    if (collection.visibleToAll) return false
    return collection.createdBy === personaEmail
  }, [personaEmail])

  // Collections visible to the active persona: defaults + own creations + ACL-shared collections
  const visibleCollections = useMemo(() => {
    if (!activePersona) return collections
    return collections.filter((collection) =>
      collection.visibleToAll ||
      collection.createdBy === personaEmail ||
      canAccess(collection.id),
    )
  }, [collections, activePersona, personaEmail, canAccess])

  // Scoped assets: filtered by folder access when a persona is active
  const scopedAssets = useMemo(() => {
    return filterByAccess(allAssets)
  }, [allAssets, filterByAccess])

  const ensureAssetsLoaded = useCallback(async () => {
    if (assetLoadState === 'loaded') return
    if (assetLoadPromiseRef.current) return assetLoadPromiseRef.current

    const loadPromise = (async () => {
      setAssetLoadState('loading')
      try {
        const response = await fetch('/api/assets')
        const apiAssets: Asset[] = response.ok ? await response.json() : []
        setAllAssets(mergePrototypeAssets(apiAssets))
      } catch (error) {
        console.error('Failed to fetch assets for smart collections:', error)
        setAllAssets([])
      } finally {
        setAssetLoadState('loaded')
        assetLoadPromiseRef.current = null
      }
    })()

    assetLoadPromiseRef.current = loadPromise
    return loadPromise
  }, [assetLoadState])
  const assetsLoaded = assetLoadState === 'loaded'
  const assetsLoading = assetLoadState === 'loading'

  // Compute child collections from scoped assets (only for visible parents)
  const childCollections = useMemo(() => {
    if (scopedAssets.length === 0) return []
    return visibleCollections.flatMap(parent => generateChildCollections(parent, scopedAssets))
  }, [visibleCollections, scopedAssets])

  // All collections = parents + children
  const allCollections = useMemo(() => {
    return [...visibleCollections, ...childCollections]
  }, [visibleCollections, childCollections])

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
      visibleToAll: false,
      createdBy: personaEmail,
      createdAt: new Date(),
    }
    setCollections(prev => [...prev, newCollection])
    if (personaId) {
      createGrant(
        { id: newCollection.id, type: 'smart-collection' },
        { type: 'user', userId: personaId },
        'manager',
      )
    }
    return newCollection
  }, [personaEmail, personaId, createGrant])

  const updateCollection = useCallback((
    id: string,
    updates: Partial<Omit<SmartCollection, 'id' | 'visibleToAll' | 'createdAt'>>
  ) => {
    setCollections(prev => prev.map((collection) => {
      if (collection.id !== id) return collection
      if (!canManageCollection(collection)) return collection
      return { ...collection, ...updates }
    }))
  }, [canManageCollection])

  const deleteCollection = useCallback((id: string): boolean => {
    const target = collections.find(c => c.id === id)
    if (!canManageCollection(target)) return false
    setCollections(prev => prev.filter(c => c.id !== id))
    return true
  }, [collections, canManageCollection])

  const getCollection = useCallback((id: string): SmartCollection | undefined => {
    return allCollections.find(c => c.id === id)
  }, [allCollections])

  const getChildren = useCallback((parentId: string): SmartCollection[] => {
    return childCollections.filter(c => c.parentId === parentId)
  }, [childCollections])

  // Build a child collection lookup by dimension+slug for O(1) access
  const childCollectionIndex = useMemo(() => {
    const index = new Map<string, SmartCollection>()
    for (const child of childCollections) {
      index.set(child.id, child)
    }
    return index
  }, [childCollections])

  const findChildByValue = useCallback((dimension: SmartCollectionGroupBy, value: string): SmartCollection | undefined => {
    const slug = slugify(value)
    const dimensionParent = collections.find(c => c.groupBy === dimension)
    if (!dimensionParent) return undefined
    return childCollectionIndex.get(`${dimensionParent.id}--${slug}`)
  }, [collections, childCollectionIndex])

  // Extract dimension values from a set of assets, optionally skipping one dimension
  const extractDimensions = useCallback((assets: Asset[], skipDimension?: SmartCollectionGroupBy): RelatedCollections => {
    const characterValues = new Set<string>()
    const sceneValues = new Set<string>()
    const locationValues = new Set<string>()
    const takeValues = new Set<string>()
    const cameraValues = new Set<string>()

    for (const asset of assets) {
      if (skipDimension !== 'characters' && asset.aiMeta?.characters) {
        asset.aiMeta.characters.forEach(c => characterValues.add(c))
      }
      if (skipDimension !== 'scenes' && asset.aiMeta?.scene) {
        sceneValues.add(asset.aiMeta.scene)
      }
      if (skipDimension !== 'locations' && asset.aiMeta?.location) {
        locationValues.add(asset.aiMeta.location)
      }
      if (skipDimension !== 'takes' && asset.shotMeta?.take) {
        takeValues.add(asset.shotMeta.take)
      }
      if (skipDimension !== 'cameras' && asset.shotMeta?.camera) {
        cameraValues.add(asset.shotMeta.camera)
      }
    }

    return {
      characters: Array.from(characterValues).sort()
        .map(v => findChildByValue('characters', v))
        .filter((c): c is SmartCollection => !!c),
      scenes: Array.from(sceneValues).sort()
        .map(v => findChildByValue('scenes', v))
        .filter((c): c is SmartCollection => !!c),
      locations: Array.from(locationValues).sort()
        .map(v => findChildByValue('locations', v))
        .filter((c): c is SmartCollection => !!c),
      takes: Array.from(takeValues).sort()
        .map(v => findChildByValue('takes', v))
        .filter((c): c is SmartCollection => !!c),
      cameras: Array.from(cameraValues).sort()
        .map(v => findChildByValue('cameras', v))
        .filter((c): c is SmartCollection => !!c),
    }
  }, [findChildByValue])

  // Pre-compute relationship map for all eligible collections
  const relationshipMap = useMemo(() => {
    const map = new Map<string, RelatedCollections>()

    for (const collection of allCollections) {
      // Parent collections (have groupBy) — skip, they represent an entire dimension
      if (collection.groupBy) continue

      if (collection.parentId) {
        // Child of a dimension parent — skip own dimension
        const parent = collections.find(c => c.id === collection.parentId)
        if (!parent?.groupBy) continue
        const matchingAssets = scopedAssets.filter(a => matchesFilter(a, collection.filter))
        map.set(collection.id, extractDimensions(matchingAssets, parent.groupBy))
      } else {
        // User-created smart collection (no parentId, no groupBy) — show all dimensions
        const matchingAssets = scopedAssets.filter(a => matchesFilter(a, collection.filter))
        map.set(collection.id, extractDimensions(matchingAssets))
      }
    }

    return map
  }, [allCollections, collections, scopedAssets, extractDimensions])

  const getRelatedCollections = useCallback((collectionId: string): RelatedCollections => {
    return relationshipMap.get(collectionId) ?? { characters: [], scenes: [], locations: [], takes: [], cameras: [] }
  }, [relationshipMap])

  // Compute relationships from an arbitrary list of assets (for user collections)
  const getRelatedCollectionsForAssets = useCallback((assets: Asset[]): RelatedCollections => {
    return extractDimensions(assets)
  }, [extractDimensions])

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
        getRelatedCollectionsForAssets,
        filterAssets,
        allAssets,
        scopedAssets,
        assetsLoaded,
        assetsLoading,
        ensureAssetsLoaded,
      }), [collections, visibleCollections, allCollections, createCollection, updateCollection, deleteCollection, getCollection, getChildren, getRelatedCollections, getRelatedCollectionsForAssets, filterAssets, allAssets, scopedAssets, assetsLoaded, assetsLoading, ensureAssetsLoaded])}
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
