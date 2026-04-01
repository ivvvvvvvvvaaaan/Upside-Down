import type { DepartmentId } from '@/components/department/types'
import type { Asset, AssetType } from '@/lib/data'
import type { WorkspaceFileNode } from '@/lib/workspace-data'
import { getAITagsForFile, toAIMeta } from '@/lib/ai-tags'
import type { AITagResult } from '@/lib/ai-tags'

export interface AssetInstance {
  id: string
  name: string
  sourceFileId: string
  sourceFileName: string
  sourcePath: string
  department: DepartmentId
  category: string
  type: AssetType
  size?: number
  modifiedAt?: string
  modifiedBy?: string
  aiTags?: AITagResult
  sourceFolderId?: string
}

export interface AssetInstanceGroup {
  category: string
  instances: AssetInstance[]
}

const EXTENSION_TO_ASSET_TYPE: Record<string, AssetType> = {
  psd: 'image',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  ai: 'image',
  tiff: 'image',
  exr: 'image',
  tx: 'image',
  mov: 'video',
  mp4: 'video',
  avi: 'video',
  mkv: 'video',
  webm: 'video',
  prproj: 'video',
  mb: 'video',
  hip: 'video',
  nk: 'video',
  wav: 'audio',
  mp3: 'audio',
  aac: 'audio',
  flac: 'audio',
  ptx: 'audio',
  pdf: 'text',
  doc: 'text',
  docx: 'text',
  txt: 'text',
  md: 'text',
  xlsx: 'text',
  csv: 'text',
  zip: 'image',
}

function mapExtensionToType(ext?: string): AssetType {
  if (!ext) return 'text'
  return EXTENSION_TO_ASSET_TYPE[ext.toLowerCase()] ?? 'text'
}

/** Walk managed zones and generate instances for all files within */
export function generateAssetInstances(
  files: WorkspaceFileNode[],
  departmentId: DepartmentId,
): AssetInstance[] {
  const instances: AssetInstance[] = []

  function walk(nodes: WorkspaceFileNode[], pathParts: string[], category: string, managedZoneFolderId?: string) {
    for (const node of nodes) {
      if (node.type === 'file') {
        const name = node.name.replace(/\.[^.]+$/, '')
        instances.push({
          id: `inst-${node.id}`,
          name,
          sourceFileId: node.id,
          sourceFileName: node.name,
          sourcePath: [...pathParts, node.name].join(' / '),
          department: departmentId,
          category,
          type: mapExtensionToType(node.extension),
          size: node.size,
          modifiedAt: node.modifiedAt,
          modifiedBy: node.modifiedBy,
          aiTags: getAITagsForFile(node.id),
          sourceFolderId: managedZoneFolderId,
        })
      }
      if (node.type === 'folder' && node.children) {
        const nextCategory = node.name
        // If this folder is a managed zone, track its ID for all children
        const zoneId = node.zone === 'managed' ? node.id : managedZoneFolderId
        walk(node.children, [...pathParts, node.name], nextCategory, zoneId)
      }
    }
  }

  walk(files, [], '')
  return instances
}

/** Group instances by category (parent managed folder) */
export function groupInstancesByCategory(
  instances: AssetInstance[],
): AssetInstanceGroup[] {
  const map = new Map<string, AssetInstance[]>()
  for (const inst of instances) {
    const list = map.get(inst.category) ?? []
    list.push(inst)
    map.set(inst.category, list)
  }
  return Array.from(map.entries()).map(([category, items]) => ({
    category,
    instances: items,
  }))
}

import { pick, CLIENT_IMAGE_POOL } from '@/lib/image-pool'

/** Only visual media types get preview thumbnails */
function getThumbnail(instance: AssetInstance): string | undefined {
  if (instance.type === 'image' || instance.type === 'video') {
    return pick(CLIENT_IMAGE_POOL, instance.id, 1)[0]
  }
  return undefined
}

/** Convert an AssetInstance to an Asset-compatible shape for AssetCard rendering.
 *  This is the basic mapper — no AI enrichment. Used by workspace grid views. */
export function instanceToAsset(instance: AssetInstance): Asset {
  return {
    id: instance.id,
    name: instance.name,
    type: instance.type,
    department: instance.department,
    created_at: instance.modifiedAt,
    thumbnail: getThumbnail(instance),
  }
}

/** Convert an AssetInstance to a promoted Asset with AI metadata.
 *  Sets typeTag from category/AI, populates aiMeta. Used by department/search views. */
export function promotedInstanceToAsset(instance: AssetInstance): Asset {
  const base: Asset = {
    id: instance.id,
    name: instance.name,
    type: instance.type,
    department: instance.department,
    created_at: instance.modifiedAt,
    modifiedBy: instance.modifiedBy,
    isAutoPromoted: true,
    workspacePath: instance.sourcePath,
    sourceFolderIds: instance.sourceFolderId ? [instance.sourceFolderId] : undefined,
    thumbnail: getThumbnail(instance),
  }

  // Set typeTag from AI tags or fall back to category name
  const typeTag = instance.aiTags?.typeTag ?? instance.category
  if (typeTag) {
    switch (instance.type) {
      case 'image':
        base.imageMeta = { typeTag }
        break
      case 'video':
        base.videoMeta = { typeTag }
        break
      case 'audio':
        base.audioMeta = { typeTag }
        break
      case 'text':
        base.textMeta = { typeTag }
        break
    }
  }

  // Populate AI metadata
  if (instance.aiTags) {
    base.aiMeta = toAIMeta(instance.aiTags)
  }

  return base
}

/** Merge curated API assets with promoted workspace instances.
 *  Simple concatenation — no deduplication since ID namespaces are disjoint. */
export function mergeWorkspaceAssets(
  apiAssets: Asset[],
  instances: AssetInstance[],
): Asset[] {
  const promoted = instances.map(promotedInstanceToAsset)
  return [...apiAssets, ...promoted]
}
