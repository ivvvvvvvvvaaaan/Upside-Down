'use client'

import { useCallback } from 'react'
import { useAccess } from './useAccess'
import { useCuts } from './useCuts'
import type { Asset } from '@/lib/data'

/**
 * useAccessCascades
 *
 * Composes the core access provider with domain-specific cascade rules.
 * Currently handles: cut constituent cascade (cut access → constituent assets).
 *
 * Future cascade rules (review sets, release domains, etc.) register here
 * without modifying the core access provider.
 */
export function useAccessCascades() {
  const access = useAccess()
  const { constituentAccessIds } = useCuts()

  const { filterByAccess } = access
  const enhancedFilterByAccess = useCallback(
    (assets: Asset[]) => filterByAccess(assets, constituentAccessIds),
    [filterByAccess, constituentAccessIds]
  )

  return {
    ...access,
    filterByAccess: enhancedFilterByAccess,
  }
}
