import { useMemo, useCallback } from 'react'
import { buildCuts, type SeedCut } from '@/lib/scenario'
import type { Asset } from '@/lib/data'
import { seedCutToAsset, compareCutsByStageAndVersion } from '@/lib/cuts'
import { deriveReleaseTagInfo } from '@/lib/release'
import { useAccess } from './useAccess'
import { usePersona } from './usePersona'

export interface AccessibleCutEntry {
  asset: Asset
  seed: SeedCut
  isOwn: boolean
}

export interface VisibleCutEntry extends AccessibleCutEntry {
  visibility: 'accessible' | 'discoverable'
}

export function useCuts() {
  const { grants, getVisibilityState } = useAccess()
  const { isAdmin, activePersona } = usePersona()
  const allSeedCuts = useMemo(() => buildCuts(), [])
  const isEditorialMember = activePersona?.domainId === 'editorial'

  const visibleCuts = useMemo((): VisibleCutEntry[] => {
    return allSeedCuts.flatMap((cut) => {
      const isOwn = isEditorialMember || false
      const visibility = isOwn || isAdmin
        ? 'accessible'
        : getVisibilityState({
            id: cut.id,
            type: 'cut',
            domainId: 'editorial',
          })

      if (visibility === 'hidden') {
        return []
      }

      return [{
        asset: seedCutToAsset(
          cut,
          visibility === 'accessible' ? deriveReleaseTagInfo(cut.id, grants) : undefined,
        ),
        seed: cut,
        isOwn,
        visibility,
      }]
    })
  }, [allSeedCuts, grants, isAdmin, isEditorialMember, getVisibilityState])

  // Group-level access: if you have access to ANY version in a group, you have access to ALL
  const accessibleCuts = useMemo((): AccessibleCutEntry[] => {
    const directlyAccessible = new Set(
      visibleCuts.filter(e => e.visibility === 'accessible').map(e => e.asset.versionGroupId ?? e.asset.id)
    )
    return visibleCuts.filter((entry): entry is AccessibleCutEntry & { visibility: 'accessible' } => {
      const groupId = entry.asset.versionGroupId ?? entry.asset.id
      return directlyAccessible.has(groupId)
    })
  }, [visibleCuts])

  const allCutAssets = useMemo(() => visibleCuts.map((entry) => entry.asset), [visibleCuts])
  const accessibleCutAssets = useMemo(() => {
    return accessibleCuts.map((entry) => entry.asset)
  }, [accessibleCuts])

  /** Find cuts whose constituents include this asset — latest version per stage only */
  const getCutsForAsset = useCallback((assetId: string): Asset[] => {
    const matching = accessibleCutAssets.filter(cut =>
      cut.constituents?.some(cid => cid === assetId)
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

  /** Get all versions in a version group, sorted newest first */
  const getVersionsForGroup = useCallback((groupId: string): Asset[] => {
    return accessibleCutAssets
      .filter(cut => (cut.versionGroupId ?? cut.id) === groupId)
      .sort(compareCutsByStageAndVersion)
  }, [accessibleCutAssets])

  /** Get constituent file IDs for a cut */
  const getConstituentsForCut = useCallback((cutId: string): string[] => {
    const seed = allSeedCuts.find(c => c.id === cutId)
    return seed?.constituents ?? []
  }, [allSeedCuts])

  /** Asset IDs that are constituents of accessible cuts — for cascade access */
  const constituentAccessIds = useMemo(() => {
    const ids = new Set<string>()
    for (const entry of accessibleCuts) {
      for (const cid of entry.seed.constituents) {
        ids.add(cid)
      }
    }
    return ids
  }, [accessibleCuts])

  return {
    allCutAssets,
    visibleCuts,
    accessibleCuts,
    accessibleCutAssets,
    constituentAccessIds,
    getCutsForAsset,
    getConstituentsForCut,
    getVersionsForGroup,
  }
}
