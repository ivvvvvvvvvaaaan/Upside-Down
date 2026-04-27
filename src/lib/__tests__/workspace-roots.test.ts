import { describe, expect, it } from 'vitest'
import { collectAccessibleWorkspaceRoots, collectSharedFolderIds } from '@/lib/workspace-roots'
import type { WorkspaceFileNode } from '@/lib/workspace-data'

const tree: WorkspaceFileNode[] = [
  {
    id: 'ws-vfx',
    name: 'VFX',
    type: 'folder',
    children: [
      {
        id: 'ws-vfx-shots',
        name: 'Shots',
        type: 'folder',
        children: [],
      },
      {
        id: 'ws-vfx-vendor',
        name: 'Vendor Deliveries',
        type: 'folder',
        children: [
          {
            id: 'ws-vfx-framestore',
            name: 'Framestore',
            type: 'folder',
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: 'ws-art',
    name: 'Art',
    type: 'folder',
    children: [],
  },
]

describe('workspace-roots', () => {
  it('returns top-level accessible roots when the ancestor is visible', () => {
    const roots = collectAccessibleWorkspaceRoots(
      tree,
      (id) => id === 'ws-vfx' || id === 'ws-vfx-shots' || id === 'ws-art',
    )

    expect(roots.map((node) => node.id)).toEqual(['ws-vfx', 'ws-art'])
  })

  it('deep-walks to find shared subfolders by default (nav sidebar)', () => {
    const roots = collectAccessibleWorkspaceRoots(
      tree,
      (id) => id === 'ws-vfx-framestore',
    )

    expect(roots.map((node) => node.id)).toEqual(['ws-vfx-framestore'])
  })

  it('only returns top-level roots in shallow mode (Finder)', () => {
    const roots = collectAccessibleWorkspaceRoots(
      tree,
      (id) => id === 'ws-vfx-framestore',
      true,
    )

    expect(roots.map((node) => node.id)).toEqual([])
  })

  it('collects shared folder ids from non-manager grants', () => {
    const sharedIds = collectSharedFolderIds(tree, (id) => {
      if (id === 'ws-vfx-framestore') return [{ templateId: 'viewer' }]
      if (id === 'ws-art') return [{ templateId: 'manager' }]
      return []
    })

    expect(Array.from(sharedIds)).toEqual(['ws-vfx-framestore'])
  })
})
