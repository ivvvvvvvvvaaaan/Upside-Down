import type { Asset, AssetType, DepartmentId } from '@/lib/data'
import { mergeWorkspaceAssets, generateAssetInstances } from '@/lib/asset-instances'
import { DEFAULT_GRANTS, getResourceLabel } from '@/lib/grants'
import { getDepartmentWorkspaceFiles } from '@/lib/workspace-data'

const ALL_DEPARTMENTS: DepartmentId[] = ['art-design', 'vfx', 'camera', 'editorial', 'audio-sound']

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

function mapExtensionToType(extension?: string): AssetType {
  if (!extension) return 'text'
  return EXTENSION_TO_ASSET_TYPE[extension.toLowerCase()] ?? 'text'
}

export function getPromotedWorkspaceAssets(): Asset[] {
  const departmentInstances = ALL_DEPARTMENTS.flatMap((departmentId) => {
    const files = getDepartmentWorkspaceFiles(departmentId)
    return generateAssetInstances(files, departmentId)
  })

  return mergeWorkspaceAssets([], departmentInstances)
}

/**
 * Build shared snapshot assets from DEFAULT_GRANTS (asset-level shares only).
 * No accessMap dependency — reads directly from grants seed data.
 */
export function getSharedSnapshotAssets(): Asset[] {
  const sharedAssets: Asset[] = []

  // Asset-level shares from DEFAULT_GRANTS (non-collection resources)
  for (const grant of DEFAULT_GRANTS) {
    if (grant.revokedAt) continue
    if (grant.resource.type === 'asset') {
      // Deduplicate by resource id
      if (sharedAssets.some((a) => a.id === grant.resource.id)) continue
      sharedAssets.push({
        id: grant.resource.id,
        name: getResourceLabel(grant.resource.id),
        type: 'video',
        department: grant.resource.departmentId,
        created_at: grant.grantedAt,
      })
    }
  }

  return sharedAssets
}

export function mergePrototypeAssets(apiAssets: Asset[]): Asset[] {
  const seen = new Set<string>()
  const merged = [
    ...mergeWorkspaceAssets(apiAssets, []),
    ...getPromotedWorkspaceAssets(),
    ...getSharedSnapshotAssets(),
  ]

  return merged.filter((asset) => {
    if (seen.has(asset.id)) return false
    seen.add(asset.id)
    return true
  })
}
