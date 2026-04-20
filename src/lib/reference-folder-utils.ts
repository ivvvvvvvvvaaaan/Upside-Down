import { isReferenceFolder, type UnifiedFileNode } from '@/lib/workspace-data'

interface ReferenceFolderResolutionOptions {
  getFolderChildren?: (resourceId: string) => UnifiedFileNode[] | undefined
}

export function resolveReferenceChildren(
  node: UnifiedFileNode,
  options: ReferenceFolderResolutionOptions,
): UnifiedFileNode[] | undefined {
  if (!isReferenceFolder(node)) return node.children
  return options.getFolderChildren?.(node.reference.resourceId) ?? node.children
}

export function materializeReferenceFolders(
  nodes: UnifiedFileNode[],
  options: ReferenceFolderResolutionOptions,
): UnifiedFileNode[] {
  return nodes.map((node) => {
    if (node.type !== 'folder') return node

    const resolvedChildren = isReferenceFolder(node)
      ? resolveReferenceChildren(node, options)
      : node.children
    const children = resolvedChildren
      ? materializeReferenceFolders(resolvedChildren, options)
      : resolvedChildren

    return { ...node, children }
  })
}
