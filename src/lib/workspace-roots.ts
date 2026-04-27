import type { WorkspaceFileNode } from '@/lib/workspace-data'
import { isCutFolder } from '@/lib/workspace-data'

/**
 * Collect workspace root folders the user can access.
 * @param shallow — when true, only return top-level domain folders (for Finder: shared sub-folders require explicit mounting).
 *                   when false (default), walk into sub-folders to find the deepest accessible entry point (for nav sidebar).
 */
export function collectAccessibleWorkspaceRoots(
  nodes: WorkspaceFileNode[],
  canAccess: (id: string) => boolean,
  shallow = false,
): WorkspaceFileNode[] {
  if (shallow) {
    return nodes.filter((node) =>
      node.type === 'folder' && !isCutFolder(node) && canAccess(node.id),
    )
  }

  const roots: WorkspaceFileNode[] = []

  const walk = (folders: WorkspaceFileNode[], ancestorAccessible: boolean) => {
    for (const node of folders) {
      if (node.type !== 'folder') continue
      if (isCutFolder(node)) continue

      const accessible = canAccess(node.id)
      if (accessible) {
        if (!ancestorAccessible) {
          roots.push(node)
        }
        continue
      }

      if (node.children) {
        walk(node.children as WorkspaceFileNode[], false)
      }
    }
  }

  walk(nodes, false)
  return roots
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
