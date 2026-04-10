import { describe, expect, it } from 'vitest'
import { assetToSelectionEntity, collectionToSelectionEntity, evaluateSelectionActions, folderToSelectionEntity } from '@/lib/selection-actions'
import type { AccessProfileId, ResourceRef } from '@/lib/grants'

function createShareContext(canShareIds: string[], grantableProfilesById: Record<string, AccessProfileId[]>) {
  return {
    canShareResource(resource: ResourceRef) {
      return canShareIds.includes(resource.id)
    },
    getGrantableProfiles(resource: ResourceRef) {
      return grantableProfilesById[resource.id] ?? []
    },
  }
}

describe('evaluateSelectionActions', () => {
  it('enables add to collection and share for asset-only selections', () => {
    const asset = assetToSelectionEntity({
      id: 'asset-1',
      name: 'Hero Pose',
      type: 'image',
    }, { resourceId: 'asset-1' })

    const result = evaluateSelectionActions({
      selectedEntities: [asset],
      ...createShareContext(['asset-1'], { 'asset-1': ['view', 'edit'] }),
    })

    expect(result.selectionKind).toBe('asset')
    expect(result.actions.addToCollection.visible).toBe(true)
    expect(result.actions.addToCollection.enabled).toBe(true)
    expect(result.actions.share.visible).toBe(true)
    expect(result.actions.share.enabled).toBe(true)
    expect(result.shareMode).toBe('single')
  })

  it('disables mixed selections with a clear reason', () => {
    const asset = assetToSelectionEntity({
      id: 'asset-1',
      name: 'Hero Pose',
      type: 'image',
    })
    const folder = folderToSelectionEntity({
      id: 'folder-1',
      label: 'Shots',
      resourceId: 'folder-1',
      domainId: 'vfx',
    })

    const result = evaluateSelectionActions({
      selectedEntities: [asset, folder],
      ...createShareContext(['asset-1', 'folder-1'], {
        'asset-1': ['view', 'edit'],
        'folder-1': ['edit'],
      }),
    })

    expect(result.selectionKind).toBe('mixed')
    expect(result.actions.addToCollection.enabled).toBe(false)
    expect(result.actions.addToCollection.reason).toContain('Select one type of item')
    expect(result.actions.share.enabled).toBe(false)
    expect(result.actions.share.reason).toContain('Select one type of item')
  })

  it('disables asset collection membership when one asset cannot be added', () => {
    const allowed = assetToSelectionEntity({
      id: 'asset-1',
      name: 'Hero Pose',
      type: 'image',
    })
    const blocked = assetToSelectionEntity({
      id: 'asset-2',
      name: 'Restricted Plate',
      type: 'image',
    }, {
      canAddToCollection: false,
      addToCollectionReason: 'You can only add items you can access to a collection.',
    })

    const result = evaluateSelectionActions({
      selectedEntities: [allowed, blocked],
      ...createShareContext(['asset-1', 'asset-2'], {
        'asset-1': ['view', 'edit'],
        'asset-2': ['view', 'edit'],
      }),
    })

    expect(result.actions.addToCollection.enabled).toBe(false)
    expect(result.actions.addToCollection.reason).toBe('You can only add items you can access to a collection.')
  })

  it('disables batch share when selected items do not have a common role', () => {
    const first = folderToSelectionEntity({
      id: 'folder-1',
      label: 'Shots',
      resourceId: 'folder-1',
      domainId: 'vfx',
    })
    const second = folderToSelectionEntity({
      id: 'folder-2',
      label: 'Plates',
      resourceId: 'folder-2',
      domainId: 'vfx',
    })

    const result = evaluateSelectionActions({
      selectedEntities: [first, second],
      ...createShareContext(['folder-1', 'folder-2'], {
        'folder-1': ['edit'],
        'folder-2': ['view'],
      }),
    })

    expect(result.shareMode).toBe(null)
    expect(result.allowedShareProfiles).toEqual([])
    expect(result.actions.share.enabled).toBe(false)
    expect(result.actions.share.reason).toContain('common permission level')
  })

  it('supports collection-only selections for share', () => {
    const collection = collectionToSelectionEntity({ id: 'collection-1', name: 'Hero Boards' }, 'collection')

    const result = evaluateSelectionActions({
      selectedEntities: [collection],
      ...createShareContext(['collection-1'], { 'collection-1': ['view', 'edit'] }),
    })

    expect(result.selectionKind).toBe('collection')
    expect(result.actions.addToCollection.visible).toBe(false)
    expect(result.actions.share.visible).toBe(true)
    expect(result.actions.share.enabled).toBe(true)
  })
})
