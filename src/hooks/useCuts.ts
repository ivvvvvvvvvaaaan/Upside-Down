import { useMemo, useCallback } from 'react'
import { buildCuts, type SeedCut } from '@/lib/scenario'
import { getAssetIdVariants, type Asset } from '@/lib/data'
import { seedCutToAsset, compareCutsByStageAndVersion } from '@/lib/cuts'
import { deriveReleaseTagInfo } from '@/lib/release'
import { useAccess } from './useAccess'
import { usePersona } from './usePersona'
import type { VisibilityState } from './useAccess'

export interface CutEntry {
  asset: Asset
  seed: SeedCut
  isOwn: boolean
  visibilityState: VisibilityState
}

export function useCuts() {
  const { canAccess, getVisibilityState, grants } = useAccess()
  const { isAdmin, activePersona } = usePersona()
  const allSeedCuts = useMemo(() => buildCuts(), [])
  const allCutAssets = useMemo(() => allSeedCuts.map((cut) => seedCutToAsset(cut)), [allSeedCuts])
  const isEditorialMember = activePersona?.departmentId === 'editorial'

  const visibleCuts = useMemo((): CutEntry[] => {
    return allSeedCuts.flatMap((cut) => {
      const isOwn = isEditorialMember || false
      const visibilityState: VisibilityState = isAdmin || isOwn || canAccess(cut.id)
        ? 'accessible'
        : getVisibilityState({ id: cut.id, type: 'cut', departmentId: 'editorial' })

      if (visibilityState === 'hidden') {
        return []
      }

      return [{
        asset: seedCutToAsset(cut, deriveReleaseTagInfo(cut.id, grants)),
        seed: cut,
        isOwn,
        visibilityState,
      }]
    })
  }, [allSeedCuts, grants, isAdmin, isEditorialMember, canAccess, getVisibilityState])

  const accessibleCuts = useMemo(() => {
    return visibleCuts.filter((entry) => entry.visibilityState === 'accessible')
  }, [visibleCuts])

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
    visibleCuts,
    accessibleCuts,
    accessibleCutAssets,
    getCutsForAsset,
    getConstituentsForCut,
  }
}
