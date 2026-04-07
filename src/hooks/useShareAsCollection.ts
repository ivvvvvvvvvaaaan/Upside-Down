/**
 * Hook: Share as Collection
 *
 * When sharing a folder, auto-creates a curated collection from the folder's
 * contents and returns a resourceRef pointing to the collection.
 * When sharing a collection or asset, passes through directly.
 *
 * This is the unified sharing entry point — everything shared goes through
 * a collection, never through a raw folder.
 */

import { useCallback } from 'react'
import { useUserCollections } from './useUserCollections'
import { getAssetIdsForFolder } from '@/lib/data-client'
import type { ResourceRef } from '@/lib/grants'

export function useShareAsCollection() {
  const { createCollection, getCollection } = useUserCollections()

  /**
   * Given a resourceRef, ensure it points to a collection.
   * If it's a folder, create a collection from its contents first.
   * Returns the collection's resourceRef and name.
   */
  const resolveShareTarget = useCallback((
    resourceRef: ResourceRef,
    label: string,
  ): { resourceRef: ResourceRef; name: string } => {
    // Already a collection or smart-collection — pass through
    if (resourceRef.type === 'collection' || resourceRef.type === 'smart-collection') {
      return { resourceRef, name: label }
    }

    // Folder → create a curated collection from folder contents
    if (resourceRef.type === 'folder') {
      const assetIds = getAssetIdsForFolder(resourceRef.id)
      // Check if we already created a collection for this folder
      const existingName = `${label} (shared)`
      const existing = getCollection(existingName)
      if (existing) {
        return {
          resourceRef: { id: existing.id, type: 'collection' },
          name: existing.name,
        }
      }
      const collection = createCollection(existingName, assetIds)
      return {
        resourceRef: { id: collection.id, type: 'collection' },
        name: collection.name,
      }
    }

    // Asset, cut, etc. — pass through as-is
    return { resourceRef, name: label }
  }, [createCollection, getCollection])

  return { resolveShareTarget }
}
