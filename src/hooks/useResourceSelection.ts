'use client'

import { useState, useCallback } from 'react'

export type SelectableEntity = {
  id: string
}

export interface UseResourceSelectionReturn<T extends SelectableEntity> {
  selectedIds: Set<string>
  primaryId: string | null
  lastClickedId: string | null
  handleSelectionClick: (item: T, event: React.MouseEvent, itemList: T[]) => void
  clearSelection: () => void
  isSelected: (itemId: string) => boolean
  isPrimary: (itemId: string) => boolean
}

/**
 * Hook for managing selection with support for:
 * - Single click: Select one item (becomes primary)
 * - Shift+click: Select range from anchor to clicked
 * - Cmd/Ctrl+click: Toggle individual item in selection
 */
export function useResourceSelection<T extends SelectableEntity>(): UseResourceSelectionReturn<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [primaryId, setPrimaryId] = useState<string | null>(null)
  const [lastClickedId, setLastClickedId] = useState<string | null>(null)

  const handleSelectionClick = useCallback((item: T, event: React.MouseEvent, itemList: T[]) => {
    const itemIndex = itemList.findIndex((candidate) => candidate.id === item.id)

    if (event.shiftKey && lastClickedId) {
      const lastIndex = itemList.findIndex((candidate) => candidate.id === lastClickedId)
      if (lastIndex !== -1) {
        const start = Math.min(lastIndex, itemIndex)
        const end = Math.max(lastIndex, itemIndex)
        const rangeIds = itemList.slice(start, end + 1).map((candidate) => candidate.id)
        setSelectedIds(new Set(rangeIds))
      }
    } else if (event.metaKey || event.ctrlKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(item.id)) {
          next.delete(item.id)
          if (primaryId === item.id) {
            const remaining = Array.from(next)
            setPrimaryId(remaining.length > 0 ? remaining[0] : null)
          }
        } else {
          next.add(item.id)
          if (!primaryId || !next.has(primaryId)) {
            setPrimaryId(item.id)
          }
        }
        return next
      })
      setLastClickedId(item.id)
    } else {
      if (selectedIds.has(item.id) && selectedIds.size === 1) {
        setSelectedIds(new Set())
        setPrimaryId(null)
        setLastClickedId(null)
      } else {
        setSelectedIds(new Set([item.id]))
        setPrimaryId(item.id)
        setLastClickedId(item.id)
      }
    }
  }, [lastClickedId, primaryId, selectedIds])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setPrimaryId(null)
    setLastClickedId(null)
  }, [])

  const isSelected = useCallback((itemId: string) => selectedIds.has(itemId), [selectedIds])
  const isPrimary = useCallback((itemId: string) => primaryId === itemId, [primaryId])

  return {
    selectedIds,
    primaryId,
    lastClickedId,
    handleSelectionClick,
    clearSelection,
    isSelected,
    isPrimary,
  }
}
