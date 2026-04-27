import type { WorkspaceFileNode } from '@/lib/workspace-data'
import { isCutFolder } from '@/lib/workspace-data'

/**
 * Collect workspace root folders the user owns via team membership.
 * Only returns top-level domain folders the user can access directly.
 * Shared sub-folders from other domains require explicit mounting.
 */
export function collectAccessibleWorkspaceRoots(
  nodes: WorkspaceFileNode[],
  canAccess: (id: string) => boolean,
): WorkspaceFileNode[] {
  return nodes.filter((node) =>
    node.type === 'folder' && !isCutFolder(node) && canAccess(node.id),
  )
}

export function collectSharedFolderIds(
  nodes: WorkspaceFileNode[],
  getResourceGrants: (id: string) => Array<{ templateId?: string }>,
): Set<string> {
  const ids = new Set<string>()

  const walk = (folders: WorkspaceFileNode[]) => {
    for (const node of folders) {
      if (node.type !== 'folder') continue
      if (getResourceGrants(node.id).some((grant) => grant.templateId !== 'manager')) {
        ids.add(node.id)
      }
      if (node.children) {
        walk(node.children as WorkspaceFileNode[])
      }
    }
  }

  walk(nodes)
  return ids
}
