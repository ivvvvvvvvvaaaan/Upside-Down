/**
 * Unified Collections Facade
 *
 * Wraps useUserCollections and useSmartCollections behind a single API.
 * Both providers continue to manage their own state — this hook presents
 * a combined view. Consumers that only need the unified view import this;
 * consumers that need flavor-specific operations can still use the
 * underlying hooks directly.
 */

import { useMemo, useCallback } from 'react'
import { useUserCollections } from './useUserCollections'
import { useSmartCollections } from './useSmartCollections'
import type { Asset } from '@/lib/data'
import type {
  Collection,
  CuratedCollection,
  SmartCollectionEntry,
} from '@/lib/collection-types'
import {
  fromUserCollection,
  fromSmartCollection,
} from '@/lib/collection-types'
import type { RelatedCollections } from './useSmartCollections'

export interface UseCollectionsValue {
  /** All collections across all flavors */
  allCollections: Collection[]

  /** Collections visible to the active persona */
  visibleCollections: Collection[]

  /** Look up any collection by ID */
  getCollection: (id: string) => Collection | undefined

  /** Create a curated collection (wraps useUserCollections.createCollection) */
  createCurated: (name: string, assetIds: string[]) => CuratedCollection

  /** Add assets to a curated collection */
  addAssetsToCurated: (id: string, assetIds: string[]) => void

  /** Delete a collection (curated or smart) */
  deleteCollection: (id: string) => boolean

  /** Get children of a smart collection (groupBy sub-collections) */
  getChildren: (parentId: string) => SmartCollectionEntry[]

  /** Get related collections for a smart collection */
  getRelatedCollections: (collectionId: string) => RelatedCollections

  /** Get related collections from an arbitrary asset list */
  getRelatedCollectionsForAssets: (assets: Asset[]) => RelatedCollections

  /** Filter assets by a smart collection's rules */
  filterAssets: (assets: Asset[], collectionId: string) => Asset[]

  /** All assets in the system (persona-scoped) */
  scopedAssets: Asset[]

  /** Whether assets have been loaded */
  assetsLoaded: boolean
  assetsLoading: boolean
  ensureAssetsLoaded: () => Promise<void>
}

export function useCollections(): UseCollectionsValue {
  const userCollections = useUserCollections()
  const smartCollections = useSmartCollections()

  const curatedCollections = useMemo(
    () => userCollections.collections.map(fromUserCollection),
    [userCollections.collections],
  )

  const allCollections = useMemo((): Collection[] => {
    return [...curatedCollections, ...smartCollections.allCollections.map(fromSmartCollection)]
  }, [curatedCollections, smartCollections.allCollections])

  const visibleCollections = useMemo((): Collection[] => {
    return [...curatedCollections, ...smartCollections.visibleCollections.map(fromSmartCollection)]
  }, [curatedCollections, smartCollections.visibleCollections])

  // Unified lookup — check both providers
  const getCollection = useCallback((id: string): Collection | undefined => {
    const uc = userCollections.getCollection(id)
    if (uc) return fromUserCollection(uc)
    const sc = smartCollections.getCollection(id)
    if (sc) return fromSmartCollection(sc)
    return undefined
  }, [userCollections, smartCollections])

  // Create curated collection (delegates to user collections)
  const createCurated = useCallback((name: string, assetIds: string[]): CuratedCollection => {
    const uc = userCollections.createCollection(name, assetIds)
    return fromUserCollection(uc) as CuratedCollection
  }, [userCollections])

  // Add assets to curated collection
  const addAssetsToCurated = useCallback((id: string, assetIds: string[]) => {
    userCollections.addAssetsToCollection(id, assetIds)
  }, [userCollections])

  // Delete — try user collection first, then smart
  const deleteCollection = useCallback((id: string): boolean => {
    const uc = userCollections.getCollection(id)
    if (uc) {
      userCollections.deleteCollection(id)
      return true
    }
    return smartCollections.deleteCollection(id)
  }, [userCollections, smartCollections])

  // Smart-collection-specific operations (pass through)
  const getChildren = useCallback((parentId: string): SmartCollectionEntry[] => {
    return smartCollections.getChildren(parentId).map(fromSmartCollection)
  }, [smartCollections])

  const getRelatedCollections = useCallback((collectionId: string): RelatedCollections => {
    return smartCollections.getRelatedCollections(collectionId)
  }, [smartCollections])

  const getRelatedCollectionsForAssets = useCallback((assets: Asset[]): RelatedCollections => {
    return smartCollections.getRelatedCollectionsForAssets(assets)
  }, [smartCollections])

  const filterAssets = useCallback((assets: Asset[], collectionId: string): Asset[] => {
    return smartCollections.filterAssets(assets, collectionId)
  }, [smartCollections])

  return {
    allCollections,
    visibleCollections,
    getCollection,
    createCurated,
    addAssetsToCurated,
    deleteCollection,
    getChildren,
    getRelatedCollections,
    getRelatedCollectionsForAssets,
    filterAssets,
    scopedAssets: smartCollections.scopedAssets,
    assetsLoaded: smartCollections.assetsLoaded,
    assetsLoading: smartCollections.assetsLoading,
    ensureAssetsLoaded: smartCollections.ensureAssetsLoaded,
  }
}
