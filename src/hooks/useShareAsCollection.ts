/**
 * Hook: Share as Collection
 *
 * When sharing a folder, auto-creates a workspace collection bound to the
 * folder path. The collection resolves assets from the folder at query time —
 * when new files land in the folder, the collection's contents update.
 *
 * For snapshot shares (vendor handoffs, time-boxed access), the sharer
 * toggles snapshot mode in the share modal. The grant then freezes the
 * asset list at share time via snapshotAssetIds.
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
  /** Current asset IDs (for snapshot mode — caller freezes these on the grant) */
  currentAssetIds?: string[]
}

export function useShareAsCollection() {
  const { collections, createWorkspaceCollection } = useUserCollections()

  /**
   * Given a resourceRef, ensure it points to a collection.
   * If it's a folder, create a workspace collection bound to it.
   */
  const resolveShareTarget = useCallback((
    resourceRef: ResourceRef,
    label: string,
  ): ShareTarget => {
    // Already a collection or smart-collection — pass through
    if (resourceRef.type === 'collection' || resourceRef.type === 'smart-collection') {
      return { resourceRef, name: label, defaultShareMode: 'live' }
    }

    // Folder → create a workspace collection bound to this folder (live by default)
    if (resourceRef.type === 'folder') {
      const collectionName = label
      const existing = collections.find(c => c.name === collectionName && c.boundFolderId === resourceRef.id)
      if (existing) {
        return {
          resourceRef: { id: existing.id, type: 'collection' },
          name: existing.name,
          defaultShareMode: 'live',
          currentAssetIds: getAssetIdsForFolder(resourceRef.id),
        }
      }
      const collection = createWorkspaceCollection(
        collectionName,
        resourceRef.id,
        resourceRef.departmentId ?? '',
      )
      return {
        resourceRef: { id: collection.id, type: 'collection' },
        name: collection.name,
        defaultShareMode: 'live',
        currentAssetIds: getAssetIdsForFolder(resourceRef.id),
      }
    }

    // Asset, cut, etc. — pass through as-is
    return { resourceRef, name: label, defaultShareMode: 'live' }
  }, [collections, createWorkspaceCollection])

  return { resolveShareTarget }
}
