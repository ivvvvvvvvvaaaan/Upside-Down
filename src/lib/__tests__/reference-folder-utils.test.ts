import { describe, expect, it } from 'vitest'
import type { UnifiedFileNode } from '@/lib/workspace-data'
import { materializeReferenceFolders, resolveReferenceChildren } from '@/lib/reference-folder-utils'

describe('reference folder utils', () => {
  it('returns regular folder children unchanged', () => {
    const node: UnifiedFileNode = {
      id: 'regular-folder',
      name: 'Regular Folder',
      type: 'folder',
      children: [{
        id: 'regular-file',
        name: 'plate.exr',
        type: 'file',
        extension: 'exr',
      }],
    }

    expect(resolveReferenceChildren(node, {})).toBe(node.children)
  })

  it('resolves folder reference mounts from their source workspace folder', () => {
    const node: UnifiedFileNode = {
      id: 'mounted-folder',
      name: 'Vendor Drop',
      type: 'folder',
      reference: {
        resourceId: 'ws-vfx-to-framestore',
        resourceType: 'folder',
      },
    }

    const children = resolveReferenceChildren(node, {
      getFolderChildren: (resourceId) => resourceId === 'ws-vfx-to-framestore'
        ? [{
            id: 'ws-vfx-010-010',
            name: 'seq010_sh010_comp_v8.exr',
            type: 'file',
            extension: 'exr',
          }]
        : undefined,
    })

    expect(children).toEqual([{
      id: 'ws-vfx-010-010',
      name: 'seq010_sh010_comp_v8.exr',
      type: 'file',
      extension: 'exr',
    }])
  })

  it('materializes mounted folder children inside the shared mount tree', () => {
    const nodes: UnifiedFileNode[] = [
      {
        id: 'shared-root',
        name: 'Shared',
        type: 'folder',
        children: [
          {
            id: 'mounted-folder',
            name: 'Vendor Drop',
            type: 'folder',
            reference: {
              resourceId: 'ws-vfx-to-framestore',
              resourceType: 'folder',
            },
          },
        ],
      },
    ]

    const materialized = materializeReferenceFolders(nodes, {
      getFolderChildren: (resourceId) => resourceId === 'ws-vfx-to-framestore'
        ? [{
            id: 'ws-vfx-010-010',
            name: 'seq010_sh010_comp_v8.exr',
            type: 'file',
            extension: 'exr',
          }]
        : undefined,
    })

    expect(materialized[0].children?.[0].children?.map((child) => child.id)).toEqual(['ws-vfx-010-010'])
  })
})
