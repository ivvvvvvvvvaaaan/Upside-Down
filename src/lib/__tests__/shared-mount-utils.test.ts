import { describe, expect, it } from 'vitest'
import type { UnifiedFileNode } from '@/lib/workspace-data'
import { assignSharedMountOwner, filterSharedMountsForViewer } from '@/lib/shared-mount-utils'

function makeTree(children: UnifiedFileNode[]): UnifiedFileNode[] {
  return [
    {
      id: 'ws-vfx',
      name: 'VFX',
      type: 'folder',
      children: [],
    },
    {
      id: 'ws-shared-mounts',
      name: 'Shared',
      type: 'folder',
      children,
    },
  ]
}

describe('shared mount utils', () => {
  it('assigns the current persona to legacy shared mounts without an owner', () => {
    const legacyTree = makeTree([
      {
        id: 'mount-1',
        name: 'Framestore',
        type: 'folder',
        reference: {
          resourceId: 'ws-vfx-to-framestore',
          resourceType: 'folder',
        },
        children: [],
      },
    ])

    const migrated = assignSharedMountOwner(legacyTree, 'vendor-framestore')

    expect(migrated.didChange).toBe(true)
    expect(migrated.nodes[1].children?.[0]).toMatchObject({
      id: 'mount-1',
      mountedByUserId: 'vendor-framestore',
    })
  })

  it('shows each viewer only their own shared reference mounts', () => {
    const tree = makeTree([
      {
        id: 'mount-sarah',
        name: 'Framestore',
        type: 'folder',
        mountedByUserId: 'schen',
        reference: {
          resourceId: 'ws-vfx-to-framestore',
          resourceType: 'folder',
        },
        children: [],
      },
      {
        id: 'mount-james',
        name: 'Framestore',
        type: 'folder',
        mountedByUserId: 'vendor-framestore',
        reference: {
          resourceId: 'ws-vfx-to-framestore',
          resourceType: 'folder',
        },
        children: [],
      },
    ])

    const jamesTree = filterSharedMountsForViewer(tree, 'vendor-framestore')
    const sarahTree = filterSharedMountsForViewer(tree, 'schen')

    expect(jamesTree[1].children?.map((child) => child.id)).toEqual(['mount-james'])
    expect(sarahTree[1].children?.map((child) => child.id)).toEqual(['mount-sarah'])
  })

  it('hides the shared root entirely when the viewer has no visible mounts', () => {
    const tree = makeTree([
      {
        id: 'mount-james',
        name: 'Framestore',
        type: 'folder',
        mountedByUserId: 'vendor-framestore',
        reference: {
          resourceId: 'ws-vfx-to-framestore',
          resourceType: 'folder',
        },
        children: [],
      },
    ])

    const mikeTree = filterSharedMountsForViewer(tree, 'vfx-supervisor')

    expect(mikeTree.find((node) => node.id === 'ws-shared-mounts')).toBeUndefined()
  })
})
