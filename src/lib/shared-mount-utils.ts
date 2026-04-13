import { SHARED_MOUNT_FOLDER_ID, isReferenceFolder, type UnifiedFileNode } from '@/lib/workspace-data'

export function assignSharedMountOwner(
  nodes: UnifiedFileNode[],
  mountedByUserId: string | null,
): { nodes: UnifiedFileNode[]; didChange: boolean } {
  let didChange = false

  const nextNodes = nodes.map((node) => {
    if (node.id !== SHARED_MOUNT_FOLDER_ID || node.type !== 'folder' || !node.children) {
      return node
    }

    let childChanged = false
    const nextChildren = node.children.map((child) => {
      if (!isReferenceFolder(child) || child.mountedByUserId !== undefined) {
        return child
      }

      childChanged = true
      return {
        ...child,
        mountedByUserId,
      }
    })

    if (!childChanged) return node

    didChange = true
    return {
      ...node,
      children: nextChildren,
    }
  })

  return { nodes: nextNodes, didChange }
}

export function filterSharedMountsForViewer(
  nodes: UnifiedFileNode[],
  viewerUserId: string | null,
): UnifiedFileNode[] {
  return nodes.flatMap((node) => {
    if (node.id !== SHARED_MOUNT_FOLDER_ID || node.type !== 'folder' || !node.children) {
      return [node]
    }

    const visibleChildren = node.children.filter((child) => {
      if (!isReferenceFolder(child)) return true
      return (child.mountedByUserId ?? null) === viewerUserId
    })

    if (visibleChildren.length === 0) {
      return []
    }

    return [{
      ...node,
      children: visibleChildren,
    }]
  })
}
