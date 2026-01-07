'use client'

import { useState, useCallback } from 'react'
import type { Asset } from '@/lib/data'

export interface UseAssetSelectionReturn {
  selectedIds: Set<string>
  primaryId: string | null
  lastClickedId: string | null
  handleAssetClick: (asset: Asset, event: React.MouseEvent, assetList: Asset[]) => void
  clearSelection: () => void
  isSelected: (assetId: string) => boolean
  isPrimary: (assetId: string) => boolean
}

/**
 * Hook for managing asset selection with support for:
 * - Single click: Select one asset (becomes primary)
 * - Shift+click: Select range from anchor to clicked
 * - Cmd/Ctrl+click: Toggle individual asset in selection
 */
export function useAssetSelection(): UseAssetSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [primaryId, setPrimaryId] = useState<string | null>(null)
  const [lastClickedId, setLastClickedId] = useState<string | null>(null)

  const handleAssetClick = useCallback((asset: Asset, event: React.MouseEvent, assetList: Asset[]) => {
    const assetIndex = assetList.findIndex(a => a.id === asset.id)

    if (event.shiftKey && lastClickedId) {
      // Shift+click: select range from last clicked to current
      const lastIndex = assetList.findIndex(a => a.id === lastClickedId)
      if (lastIndex !== -1) {
        const start = Math.min(lastIndex, assetIndex)
        const end = Math.max(lastIndex, assetIndex)
        const rangeIds = assetList.slice(start, end + 1).map(a => a.id)
        setSelectedIds(new Set(rangeIds))
        // Primary stays as the original anchor (lastClickedId)
      }
    } else if (event.metaKey || event.ctrlKey) {
      // Cmd/Ctrl+click: toggle individual selection
      setSelectedIds(prev => {
        const next = new Set(prev)
        if (next.has(asset.id)) {
          next.delete(asset.id)
          // If removing primary, set new primary to first remaining
          if (primaryId === asset.id) {
            const remaining = Array.from(next)
            setPrimaryId(remaining.length > 0 ? remaining[0] : null)
          }
        } else {
          next.add(asset.id)
          // If no primary yet, set this as primary
          if (!primaryId || !next.has(primaryId)) {
            setPrimaryId(asset.id)
          }
        }
        return next
      })
      setLastClickedId(asset.id)
    } else {
      // Regular click: single selection (clears others)
      if (selectedIds.has(asset.id) && selectedIds.size === 1) {
        // Clicking already selected single item deselects it
        setSelectedIds(new Set())
        setPrimaryId(null)
        setLastClickedId(null)
      } else {
        setSelectedIds(new Set([asset.id]))
        setPrimaryId(asset.id)
        setLastClickedId(asset.id)
      }
    }
  }, [lastClickedId, primaryId, selectedIds])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setPrimaryId(null)
    setLastClickedId(null)
  }, [])

  const isSelected = useCallback((assetId: string) => selectedIds.has(assetId), [selectedIds])
  const isPrimary = useCallback((assetId: string) => primaryId === assetId, [primaryId])

  return {
    selectedIds,
    primaryId,
    lastClickedId,
    handleAssetClick,
    clearSelection,
    isSelected,
    isPrimary,
  }
}
