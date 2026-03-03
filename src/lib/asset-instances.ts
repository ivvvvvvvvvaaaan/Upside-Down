import type { DepartmentId } from '@/components/department/types'
import type { Asset, AssetType } from '@/lib/data'
import type { WorkspaceFileNode } from '@/lib/workspace-data'

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

  function walk(nodes: WorkspaceFileNode[], pathParts: string[], category: string) {
    for (const node of nodes) {
      if (node.type === 'file' && node.managedZone) {
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
        })
      }
      if (node.type === 'folder' && node.children) {
        const nextCategory = node.zone === 'managed' ? node.name : category
        walk(node.children, [...pathParts, node.name], nextCategory)
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

/** Convert an AssetInstance to an Asset-compatible shape for AssetCard rendering */
export function instanceToAsset(instance: AssetInstance): Asset {
  return {
    id: instance.id,
    name: instance.name,
    type: instance.type,
    department: instance.department,
    created_at: instance.modifiedAt,
  }
}
