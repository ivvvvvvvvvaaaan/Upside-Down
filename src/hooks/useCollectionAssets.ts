'use client'

import { useState, useCallback } from 'react'
import type { Asset, Collection } from '@/lib/data'

export interface UseCollectionAssetsOptions {
  /** Called when navigating (loading collection or going back) - use to clear selection */
  onNavigate?: () => void
}

export interface UseCollectionAssetsReturn {
  selectedCollection: Collection | null
  assets: Asset[]
  loading: boolean
  error: Error | null
  loadCollection: (collection: Collection) => Promise<void>
  retry: () => Promise<void>
  goBack: () => void
}

/**
 * Hook for managing collection detail view with asset loading
 */
export function useCollectionAssets(options?: UseCollectionAssetsOptions): UseCollectionAssetsReturn {
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadCollection = useCallback(async (collection: Collection) => {
    options?.onNavigate?.()
    setSelectedCollection(collection)
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/collections/${collection.id}/assets`)
      if (!response.ok) throw new Error(`Failed to load assets (HTTP ${response.status})`)
      const fetchedAssets = await response.json()
      setAssets(fetchedAssets)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to load assets')
      console.error('Failed to load assets:', errorObj)
      setError(errorObj)
      setAssets([])
    }
    setLoading(false)
  }, [options])

  const retry = useCallback(async () => {
    if (selectedCollection) {
      await loadCollection(selectedCollection)
    }
  }, [selectedCollection, loadCollection])

  const goBack = useCallback(() => {
    options?.onNavigate?.()
    setSelectedCollection(null)
    setAssets([])
    setError(null)
  }, [options])

  return {
    selectedCollection,
    assets,
    loading,
    error,
    loadCollection,
    retry,
    goBack,
  }
}
