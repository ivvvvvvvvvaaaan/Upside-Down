import type { WorkspaceFileNode } from '@/lib/workspace-data'

export function collectAccessibleWorkspaceRoots(
  nodes: WorkspaceFileNode[],
  canAccess: (id: string) => boolean,
): WorkspaceFileNode[] {
  const roots: WorkspaceFileNode[] = []

  const walk = (folders: WorkspaceFileNode[], ancestorAccessible: boolean) => {
    for (const node of folders) {
      if (node.type !== 'folder') continue

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
