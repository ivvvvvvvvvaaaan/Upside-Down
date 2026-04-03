'use client'

import type { Asset } from '@/lib/data'
import { useResourceSelection } from './useResourceSelection'

export type UseAssetSelectionReturn = ReturnType<typeof useAssetSelection>

export function useAssetSelection() {
  const selection = useResourceSelection<Asset>()

  return {
    ...selection,
    handleAssetClick: selection.handleSelectionClick,
  }
}
