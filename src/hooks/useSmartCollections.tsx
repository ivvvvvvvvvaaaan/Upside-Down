'use client'

import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect, type ReactNode } from 'react'
import type { SmartCollection, SmartCollectionGroupBy, AssetFilter, Asset, SmartCollectionIcon } from '@/lib/data'
import { mergePrototypeAssets } from '@/lib/prototype-assets'
import { matchesFilter, slugify, generateChildCollections } from '@/lib/smart-collection-filters'
import { listNarrativeScenes, listNarrativeCharacters, listNarrativeLocations } from '@/lib/ontology-meta'
import { useAccess } from './useAccess'
import { usePersona } from './usePersona'
import { useFileTree } from './useFileTree'
import {
  getSmartCollectionsStorageKey,
  loadStoredSmartCollections,
  persistSmartCollections,
} from '@/lib/smart-collection-store'

// Re-export for existing consumers
export { matchesFilter } from '@/lib/smart-collection-filters'

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

function mergeSmartCollectionAssets(apiAssets: Asset[], liveAssets: Asset[]): Asset[] {
  const byId = new Map<string, Asset>()
  for (const asset of mergePrototypeAssets(apiAssets)) byId.set(asset.id, asset)
  for (const asset of liveAssets) byId.set(asset.id, asset)
  return Array.from(byId.values())
}

export function SmartCollectionsProvider({ children }: { children: ReactNode }) {
  const [collections, setCollectionsState] = useState<SmartCollection[]>(loadStoredSmartCollections)
  const [apiAssets, setApiAssets] = useState<Asset[]>([])
  const [assetLoadState, setAssetLoadState] = useState<'idle' | 'loading' | 'loaded'>('idle')
  const assetLoadPromiseRef = useRef<Promise<void> | null>(null)
  const { filterByAccess, canEditAcl } = useAccess()
  const { activePersona } = usePersona()
  const { allAssets: liveAssets } = useFileTree()
  const personaEmail = activePersona?.email

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== getSmartCollectionsStorageKey()) return
      setCollectionsState(loadStoredSmartCollections())
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])


  const setCollections = useCallback((
    action: SmartCollection[] | ((prev: SmartCollection[]) => SmartCollection[]),
  ) => {
    setCollectionsState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action
      persistSmartCollections(next)
      return next
    })
  }, [])

  // Smart collections are either global defaults or personal authoring tools.
  // Sharing snapshots them into curated collections, so recipients should not
  // gain direct visibility into another user's live smart collection.
  const visibleCollections = useMemo(() => {
    if (!activePersona) return collections
    return collections.filter((collection) =>
      collection.visibleToAll ||
      collection.createdBy === personaEmail,
    )
  }, [collections, activePersona, personaEmail])

  const allAssets = useMemo(() => {
    return mergeSmartCollectionAssets(apiAssets, liveAssets)
  }, [apiAssets, liveAssets])

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
        setApiAssets(apiAssets)
      } catch (error) {
        console.error('Failed to fetch assets for smart collections:', error)
        setApiAssets([])
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

  // Compute child collections from scoped assets (only for visible parents).
  // Augment with ontology-defined entries so all narrative scenes/characters/
  // locations appear even when no asset has been tagged with them yet —
  // ontology is the source of truth, AI tags fill in matching assets.
  const childCollections = useMemo(() => {
    const assetDerived = scopedAssets.length === 0
      ? []
      : visibleCollections.flatMap(parent => generateChildCollections(parent, scopedAssets))

    const augmented: typeof assetDerived = [...assetDerived]
    const seen = new Set(assetDerived.map(c => c.id))

    for (const parent of visibleCollections) {
      let ontologyNames: string[] = []
      let filterKey: keyof AssetFilter | null = null
      if (parent.groupBy === 'scenes') {
        ontologyNames = listNarrativeScenes().map(([name]) => name)
        filterKey = 'aiScene'
      } else if (parent.groupBy === 'characters') {
        ontologyNames = listNarrativeCharacters().map(([name]) => name)
        filterKey = 'aiCharacters'
      } else if (parent.groupBy === 'locations') {
        ontologyNames = listNarrativeLocations().map(([name]) => name)
        filterKey = 'aiLocation'
      }
      if (!filterKey || ontologyNames.length === 0) continue

      for (const name of ontologyNames) {
        const id = `${parent.id}--${slugify(name)}`
        if (seen.has(id)) continue
        const childFilter: AssetFilter = {}
        if (filterKey === 'aiCharacters') {
          childFilter.aiCharacters = [name]
        } else if (filterKey === 'aiLocation') {
          childFilter.aiLocation = name
        } else if (filterKey === 'aiScene') {
          childFilter.aiScene = name
        }
        augmented.push({
          flavor: 'smart' as const,
          id,
          name,
          icon: parent.icon,
          filter: childFilter,
          visibleToAll: true,
          createdAt: parent.createdAt,
          parentId: parent.id,
        })
        seen.add(id)
      }
    }

    return augmented
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
      flavor: 'smart',
      id: `smart-${Date.now()}`,
      name,
      icon,
      filter,
      visibleToAll: false,
      createdBy: personaEmail,
      createdAt: new Date(),
    }
    setCollections(prev => [...prev, newCollection])
    return newCollection
  }, [personaEmail, setCollections])

  const updateCollection = useCallback((
    id: string,
    updates: Partial<Omit<SmartCollection, 'id' | 'visibleToAll' | 'createdAt'>>
  ) => {
    setCollections(prev => prev.map((collection) => {
      if (collection.id !== id) return collection

      const resourceRef = { id, type: 'smart-collection' as const }
      const isOwner = !activePersona || collection.createdBy === personaEmail
      const canManage = isOwner || canEditAcl(resourceRef)
      if (!canManage) return collection

      return { ...collection, ...updates }
    }))
  }, [activePersona, personaEmail, canEditAcl, setCollections])

  const deleteCollection = useCallback((id: string): boolean => {
    const target = collections.find(c => c.id === id)
    if (!target || target.visibleToAll) return false
    const resourceRef = { id, type: 'smart-collection' as const }
    const isOwner = !activePersona || target.createdBy === personaEmail
    if (!isOwner && !canEditAcl(resourceRef)) return false
    setCollections(prev => prev.filter(c => c.id !== id))
    return true
  }, [collections, personaEmail, activePersona, canEditAcl, setCollections])

  const getCollection = useCallback((id: string): SmartCollection | undefined => {
    return [...visibleCollections, ...childCollections].find(c => c.id === id)
  }, [visibleCollections, childCollections])

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
    return relationshipMap.get(collectionId) ?? { characters: [], scenes: [], locations: [] }
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
