import { describe, expect, it } from 'vitest'
import type { UserCollection } from '@/hooks/useUserCollections'
import type { Asset, SmartCollection } from '@/lib/data-client'
import type { UnifiedFileNode } from '@/lib/workspace-data'
import { materializeReferenceFolders, resolveReferenceChildren } from '@/lib/reference-folder-utils'

function makeCollection(overrides: Partial<UserCollection> = {}): UserCollection {
  return {
    flavor: 'collection',
    id: 'collection-1',
    name: 'Mounted Collection',
    assetIds: ['ws-vfx-010-010', 'ws-vfx-020-010'],
    createdAt: new Date('2026-04-08T00:00:00Z'),
    ...overrides,
  }
}

function makeSmartCollection(overrides: Partial<SmartCollection> = {}): SmartCollection {
  return {
    flavor: 'smart',
    id: 'smart-1',
    name: 'Smart Mount',
    icon: 'filter',
    filter: {},
    createdAt: new Date('2026-04-08T00:00:00Z'),
    ...overrides,
  }
}

describe('reference folder utils', () => {
  it('resolves snapshot reference folders from frozen asset ids', () => {
    const node: UnifiedFileNode = {
      id: 'mounted-snapshot',
      name: 'Snapshot Mount',
      type: 'folder',
      reference: {
        resourceId: 'collection-1',
        resourceType: 'collection',
        shareMode: 'snapshot',
        snapshotAssetIds: ['ws-vfx-010-010', 'ws-vfx-020-010'],
      },
    }

    const children = resolveReferenceChildren(node, {
      getCollection: () => undefined,
      filterAssets: () => [],
      filterByAccess: (assets) => assets.filter((asset) => asset.id !== 'ws-vfx-020-010'),
      scopedAssets: [],
    })

    expect(children?.map((child) => child.id)).toEqual(['ws-vfx-010-010'])
    expect(children?.[0]).toMatchObject({
      type: 'file',
      name: expect.stringContaining('.'),
    })
  })

  it('materializes live collection folders inside the tree', () => {
    const nodes: UnifiedFileNode[] = [
      {
        id: 'shared-root',
        name: 'Shared',
        type: 'folder',
        children: [
          {
            id: 'mounted-live',
            name: 'Live Mount',
            type: 'folder',
            reference: {
              resourceId: 'collection-1',
              resourceType: 'collection',
            },
          },
        ],
      },
    ]

    const materialized = materializeReferenceFolders(nodes, {
      getCollection: (id) => id === 'collection-1' ? makeCollection() : undefined,
      filterAssets: () => [],
      filterByAccess: (assets) => assets,
      scopedAssets: [],
    })

    expect(materialized[0].children?.[0].children?.map((child) => child.id)).toEqual([
      'ws-vfx-010-010',
      'ws-vfx-020-010',
    ])
  })

  it('applies access filtering after smart collection matching', () => {
    const scopedAssets: Asset[] = [
      {
        id: 'allowed-asset',
        name: 'Allowed Frame',
        type: 'image',
        extension: 'jpg',
      },
      {
        id: 'blocked-asset',
        name: 'Blocked Frame',
        type: 'image',
        extension: 'jpg',
      },
    ]

    const node: UnifiedFileNode = {
      id: 'mounted-smart',
      name: 'Smart Mount',
      type: 'folder',
      reference: {
        resourceId: 'smart-1',
        resourceType: 'smart-collection',
      },
    }

    const children = resolveReferenceChildren(node, {
      getCollection: (id) => id === 'smart-1' ? makeSmartCollection() : undefined,
      filterAssets: (assets, collectionId) => {
        expect(collectionId).toBe('smart-1')
        return assets
      },
      filterByAccess: (assets) => assets.filter((asset) => asset.id === 'allowed-asset'),
      scopedAssets,
    })

    expect(children?.map((child) => child.id)).toEqual(['allowed-asset'])
  })

  it('resolves folder reference mounts from their source workspace folder', () => {
    const node: UnifiedFileNode = {
      id: 'mounted-folder',
      name: 'Vendor Drop',
      type: 'folder',
      reference: {
        resourceId: 'ws-vfx-vendor-framestore',
        resourceType: 'folder',
      },
    }

    const children = resolveReferenceChildren(node, {
      getCollection: () => undefined,
      filterAssets: () => [],
      filterByAccess: (assets) => assets,
      getFolderChildren: (resourceId) => resourceId === 'ws-vfx-vendor-framestore'
        ? [{
            id: 'ws-vfx-010-010',
            name: 'seq010_sh010_comp_v8.exr',
            type: 'file',
            extension: 'exr',
          }]
        : undefined,
      scopedAssets: [],
    })

    expect(children).toEqual([{
      id: 'ws-vfx-010-010',
      name: 'seq010_sh010_comp_v8.exr',
      type: 'file',
      extension: 'exr',
    }])
  })
})
