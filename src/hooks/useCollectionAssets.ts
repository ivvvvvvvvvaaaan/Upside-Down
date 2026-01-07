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
  loadCollection: (collection: Collection) => Promise<void>
  goBack: () => void
}

/**
 * Hook for managing collection detail view with asset loading
 */
export function useCollectionAssets(options?: UseCollectionAssetsOptions): UseCollectionAssetsReturn {
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)

  const loadCollection = useCallback(async (collection: Collection) => {
    options?.onNavigate?.()
    setSelectedCollection(collection)
    setLoading(true)
    try {
      const response = await fetch(`/api/collections/${collection.id}/assets`)
      const fetchedAssets = await response.json()
      setAssets(fetchedAssets)
    } catch (error) {
      console.error('Failed to load assets:', error)
      setAssets([])
    }
    setLoading(false)
  }, [options])

  const goBack = useCallback(() => {
    options?.onNavigate?.()
    setSelectedCollection(null)
    setAssets([])
  }, [options])

  return {
    selectedCollection,
    assets,
    loading,
    loadCollection,
    goBack,
  }
}
