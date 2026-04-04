import { useMemo, useCallback } from 'react'
import { buildCuts, type SeedCut } from '@/lib/scenario'
import { getAssetIdVariants, type Asset } from '@/lib/data'
import { seedCutToAsset, compareCutsByStageAndVersion } from '@/lib/cuts'
import { deriveReleaseTagInfo } from '@/lib/release'
import { useAccess } from './useAccess'
import { usePersona } from './usePersona'

export interface AccessibleCutEntry {
  asset: Asset
  seed: SeedCut
  isOwn: boolean
}

export function useCuts() {
  const { sharesReceivedByMe, allProjectShares, grants } = useAccess()
  const { isAdmin, activePersona } = usePersona()
  const allSeedCuts = useMemo(() => buildCuts(), [])
  const allCutAssets = useMemo(() => allSeedCuts.map((cut) => seedCutToAsset(cut)), [allSeedCuts])
  const allEntries = useMemo(() => {
    return isAdmin ? allProjectShares : sharesReceivedByMe
  }, [isAdmin, allProjectShares, sharesReceivedByMe])
  const grantedCutIds = useMemo(() => {
    return new Set(allEntries.filter((entry) => entry.resourceType === 'cut').map((entry) => entry.resourceId))
  }, [allEntries])
  const isEditorialMember = activePersona?.departmentId === 'editorial'

  const accessibleCuts = useMemo((): AccessibleCutEntry[] => {
    return allSeedCuts.flatMap((cut) => {
      const isOwn = isEditorialMember || false
      const hasGrant = grantedCutIds.has(cut.id)
      if (!isOwn && !hasGrant && !isAdmin) {
        return []
      }

      return [{
        asset: seedCutToAsset(cut, deriveReleaseTagInfo(cut.id, grants)),
        seed: cut,
        isOwn,
      }]
    })
  }, [allSeedCuts, grantedCutIds, grants, isAdmin, isEditorialMember])
  const accessibleCutAssets = useMemo(() => {
    return accessibleCuts.map((entry) => entry.asset)
  }, [accessibleCuts])

  /** Find cuts whose constituents include this asset — latest version per stage only */
  const getCutsForAsset = useCallback((assetId: string): Asset[] => {
    const variants = new Set(getAssetIdVariants(assetId))
    const matching = accessibleCutAssets.filter(cut =>
      cut.constituents?.some(cid => variants.has(cid))
    )
    // Deduplicate: keep only the latest version per versionGroupId
    const groups = new Map<string, Asset[]>()
    for (const cut of matching) {
      const key = cut.versionGroupId ?? cut.id
      const existing = groups.get(key) ?? []
      existing.push(cut)
      groups.set(key, existing)
    }
    return Array.from(groups.values()).map(entries => {
      entries.sort(compareCutsByStageAndVersion)
      return entries[0]
    })
  }, [accessibleCutAssets])

  /** Get constituent file IDs for a cut */
  const getConstituentsForCut = useCallback((cutId: string): string[] => {
    const seed = allSeedCuts.find(c => c.id === cutId)
    return seed?.constituents ?? []
  }, [allSeedCuts])

  return {
    allCutAssets,
    accessibleCuts,
    accessibleCutAssets,
    getCutsForAsset,
    getConstituentsForCut,
  }
}
