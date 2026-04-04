'use client'

import type { Asset } from '@/lib/data'
import { useResourceSelection } from './useResourceSelection'

export function useAssetSelection() {
  const selection = useResourceSelection<Asset>()

  return {
    ...selection,
    handleAssetClick: selection.handleSelectionClick,
  }
}
