import { getAssetsByIds, resolveCollectionAssets } from '@/lib/data'
import type { Asset } from '@/lib/data'
import { isCollection, isSmart, type Collection } from '@/lib/collection-types'
import { isReferenceFolder, type UnifiedFileNode } from '@/lib/workspace-data'

interface ReferenceFolderResolutionOptions {
  getCollection: (id: string) => Collection | undefined
  filterAssets: (assets: Asset[], collectionId: string) => Asset[]
  filterByAccess: (assets: Asset[]) => Asset[]
  scopedAssets: Asset[]
  /** Override default collection asset resolution (e.g. to use live file tree) */
  resolveAssets?: (collection: Collection) => Asset[]
  getFolderChildren?: (resourceId: string) => UnifiedFileNode[] | undefined
}

function assetToFileNode(asset: Asset): UnifiedFileNode {
  return {
    id: asset.id,
    name: asset.name + (asset.extension ? `.${asset.extension}` : ''),
    type: 'file',
    extension: asset.extension,
    modifiedAt: asset.created_at,
    modifiedBy: asset.modifiedBy,
    domainId: asset.department,
  }
}

function resolveReferenceFolderAssets(
  node: UnifiedFileNode,
  options: ReferenceFolderResolutionOptions,
): Asset[] {
  if (!isReferenceFolder(node)) return []

  const snapshotAssetIds = node.reference.shareMode === 'snapshot'
    ? node.reference.snapshotAssetIds
    : undefined
  if (snapshotAssetIds && snapshotAssetIds.length > 0) {
    return options.filterByAccess(getAssetsByIds(snapshotAssetIds))
  }

  const collection = options.getCollection(node.reference.resourceId)
  if (!collection) return []

  if (isCollection(collection)) {
    const assets = options.resolveAssets
      ? options.resolveAssets(collection)
      : resolveCollectionAssets(collection)
    return options.filterByAccess(assets)
  }

  if (isSmart(collection)) {
    return options.filterByAccess(options.filterAssets(options.scopedAssets, collection.id))
  }

  return []
}

export function resolveReferenceChildren(
  node: UnifiedFileNode,
  options: ReferenceFolderResolutionOptions,
): UnifiedFileNode[] | undefined {
  if (!isReferenceFolder(node)) return node.children
  if (node.reference.resourceType === 'folder') {
    return options.getFolderChildren?.(node.reference.resourceId) ?? node.children
  }
  return resolveReferenceFolderAssets(node, options).map(assetToFileNode)
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
