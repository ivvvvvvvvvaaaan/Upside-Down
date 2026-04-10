import type { Asset } from '@/lib/data'
import type { ProductionDomainId } from '@/components/department/types'
import { mergeWorkspaceAssets, generateAssetInstances } from '@/lib/asset-instances'
import { DEFAULT_GRANTS, getResourceLabel } from '@/lib/grants'
import { getDomainWorkspaceFiles } from '@/lib/workspace-data'

const ALL_DOMAINS: ProductionDomainId[] = ['art-design', 'vfx', 'camera', 'editorial', 'audio-sound']

export function getPromotedWorkspaceAssets(): Asset[] {
  const domainInstances = ALL_DOMAINS.flatMap((domainId) => {
    const files = getDomainWorkspaceFiles(domainId)
    return generateAssetInstances(files, domainId)
  })

  return mergeWorkspaceAssets([], domainInstances)
}

/**
 * Build shared snapshot assets from DEFAULT_GRANTS (asset-level shares only).
 * No accessMap dependency — reads directly from grants seed data.
 */
function getSharedSnapshotAssets(): Asset[] {
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
        department: grant.resource.domainId,
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
