/**
 * Unified Collections Facade
 *
 * Wraps useUserCollections and useSmartCollections behind a single API.
 * Both providers continue to manage their own state — this hook presents
 * a combined view.
 */

import { useMemo, useCallback } from 'react'
import { useUserCollections } from './useUserCollections'
import type { UserCollection } from './useUserCollections'
import { useSmartCollections, matchesFilter } from './useSmartCollections'
import { useAccess } from './useAccess'
import type { Asset } from '@/lib/data'
import type { Collection, SmartCollectionEntry } from '@/lib/collection-types'
import type { RelatedCollections } from './useSmartCollections'

export interface UseCollectionsValue {
  allCollections: Collection[]
  visibleCollections: Collection[]
  getCollection: (id: string) => Collection | undefined
  createCurated: (name: string, assetIds: string[]) => UserCollection
  addAssetsToCurated: (id: string, assetIds: string[]) => void
  deleteCollection: (id: string) => boolean
  getChildren: (parentId: string) => SmartCollectionEntry[]
  getRelatedCollections: (collectionId: string) => RelatedCollections
  getRelatedCollectionsForAssets: (assets: Asset[]) => RelatedCollections
  filterAssets: (assets: Asset[], collectionId: string) => Asset[]
  getAssetCount: (collectionId: string) => number
  scopedAssets: Asset[]
  assetsLoaded: boolean
  assetsLoading: boolean
  ensureAssetsLoaded: () => Promise<void>
}

export function useCollections(): UseCollectionsValue {
  const userCollections = useUserCollections()
  const smartCollections = useSmartCollections()
  const {
    visibleCollections: accessibleUserCollections,
    getCollectionAssetCount: getCuratedAssetCount,
  } = useAccess()

  const allCollections = useMemo((): Collection[] => {
    return [...userCollections.collections, ...smartCollections.allCollections]
  }, [userCollections.collections, smartCollections.allCollections])

  const visibleCollections = useMemo((): Collection[] => {
    return [...accessibleUserCollections, ...smartCollections.visibleCollections]
  }, [accessibleUserCollections, smartCollections.visibleCollections])

  const getCollection = useCallback((id: string): Collection | undefined => {
    return userCollections.getCollection(id)
      ?? smartCollections.getCollection(id)
  }, [userCollections, smartCollections])

  const createCurated = useCallback((name: string, assetIds: string[]): UserCollection => {
    return userCollections.createCollection(name, assetIds)
  }, [userCollections])

  const addAssetsToCurated = useCallback((id: string, assetIds: string[]) => {
    userCollections.addAssetsToCollection(id, assetIds)
  }, [userCollections])

  const deleteCollection = useCallback((id: string): boolean => {
    const uc = userCollections.getCollection(id)
    if (uc) {
      userCollections.deleteCollection(id)
      return true
    }
    return smartCollections.deleteCollection(id)
  }, [userCollections, smartCollections])

  const getChildren = useCallback((parentId: string): SmartCollectionEntry[] => {
    return smartCollections.getChildren(parentId)
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

  const getAssetCount = useCallback((collectionId: string): number => {
    const curatedCount = getCuratedAssetCount(collectionId)
    if (curatedCount > 0) return curatedCount
    const sc = smartCollections.getCollection(collectionId)
    if (sc) return smartCollections.scopedAssets.filter(a => matchesFilter(a, sc.filter)).length
    return 0
  }, [getCuratedAssetCount, smartCollections])

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
    getAssetCount,
    scopedAssets: smartCollections.scopedAssets,
    assetsLoaded: smartCollections.assetsLoaded,
    assetsLoading: smartCollections.assetsLoading,
    ensureAssetsLoaded: smartCollections.ensureAssetsLoaded,
  }
}
