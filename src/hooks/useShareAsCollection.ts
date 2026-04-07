/**
 * Hook: Share as Collection
 *
 * When sharing a folder, auto-creates a curated collection from the folder's
 * contents and returns a resourceRef pointing to the collection.
 * When sharing a collection or asset, passes through directly.
 *
 * Folder shares default to snapshot mode — the asset list is frozen at share
 * time. This prevents new files added to the folder from auto-leaking to
 * recipients without approval.
 */

import { useCallback } from 'react'
import { useUserCollections } from './useUserCollections'
import { getAssetIdsForFolder } from '@/lib/data-client'
import type { ResourceRef, ShareMode } from '@/lib/grants'

export interface ShareTarget {
  resourceRef: ResourceRef
  name: string
  /** Default share mode for this target */
  defaultShareMode: ShareMode
  /** Asset IDs to freeze for snapshot mode (only for folder → collection conversions) */
  snapshotAssetIds?: string[]
}

export function useShareAsCollection() {
  const { createCollection, getCollection } = useUserCollections()

  /**
   * Given a resourceRef, ensure it points to a collection.
   * If it's a folder, create a collection from its contents first.
   * Returns the collection's resourceRef, name, and default share mode.
   */
  const resolveShareTarget = useCallback((
    resourceRef: ResourceRef,
    label: string,
  ): ShareTarget => {
    // Already a collection or smart-collection — pass through, default to live
    if (resourceRef.type === 'collection' || resourceRef.type === 'smart-collection') {
      return { resourceRef, name: label, defaultShareMode: 'live' }
    }

    // Folder → create a curated collection from folder contents, default to snapshot
    if (resourceRef.type === 'folder') {
      const assetIds = getAssetIdsForFolder(resourceRef.id)
      const existingName = `${label} (shared)`
      const existing = getCollection(existingName)
      if (existing) {
        return {
          resourceRef: { id: existing.id, type: 'collection' },
          name: existing.name,
          defaultShareMode: 'snapshot',
          snapshotAssetIds: assetIds,
        }
      }
      const collection = createCollection(existingName, assetIds)
      return {
        resourceRef: { id: collection.id, type: 'collection' },
        name: collection.name,
        defaultShareMode: 'snapshot',
        snapshotAssetIds: assetIds,
      }
    }

    // Asset, cut, etc. — pass through as-is, no share mode concept
    return { resourceRef, name: label, defaultShareMode: 'live' }
  }, [createCollection, getCollection])

  return { resolveShareTarget }
}
