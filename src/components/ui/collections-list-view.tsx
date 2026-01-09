'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef, ICellRendererParams, GridApi, RowClickedEvent } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import type { Collection, Asset } from '@/lib/data'
import { ChevronRight, ChevronDown } from 'lucide-react'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

// Skeleton placeholder count for loading states
const SKELETON_ROW_COUNT = 6

// Unified row type for tree structure
type TreeRow = {
  id: string
  name: string
  rowType: 'collection' | 'asset'
  // Collection fields
  collectionType?: 'character' | 'location' | 'scene'
  assetCount?: number
  mainImage?: string
  avatarSrc?: string
  // Asset fields
  assetType?: 'shot' | 'video' | 'image' | 'text'
  thumbnail?: string
  // Tree structure
  parentId?: string
  isExpanded?: boolean
}

interface CollectionsListViewProps {
  collections: Collection[]
  onCollectionClick: (collection: Collection) => void
  loading?: boolean
}

// Custom cell renderer for expand/collapse + thumbnail
function ExpandThumbnailCellRenderer(
  params: ICellRendererParams<TreeRow> & {
    onToggleExpand: (row: TreeRow) => void
  }
) {
  const row = params.data
  if (!row) return null

  const isCollection = row.rowType === 'collection'
  const isAsset = row.rowType === 'asset'

  const imageSrc = isCollection
    ? (row.collectionType === 'character' ? row.avatarSrc : row.mainImage)
    : row.thumbnail

  return (
    <div className="flex items-center h-full gap-1">
      {isCollection ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            params.onToggleExpand(row)
          }}
          className="p-1 hover:bg-surface-interactive-hover rounded"
        >
          {row.isExpanded ? (
            <ChevronDown className="w-4 h-4 text-foreground-dim" />
          ) : (
            <ChevronRight className="w-4 h-4 text-foreground-dim" />
          )}
        </button>
      ) : (
        <div className="w-6" /> // Indent for assets
      )}
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={row.name}
          className="w-8 h-8 rounded object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded bg-surface-low flex items-center justify-center">
          <span className="text-foreground-subtle text-label-0-regular">
            {row.name.charAt(0)}
          </span>
        </div>
      )}
    </div>
  )
}

// Custom cell renderer for type badge
function TypeBadgeCellRenderer(params: ICellRendererParams<TreeRow>) {
  const row = params.data
  if (!row) return null

  if (row.rowType === 'collection' && row.collectionType) {
    const typeColors: Record<string, string> = {
      character: 'bg-indigo-500 dark:bg-indigo-400',
      location: 'bg-green-500 dark:bg-green-400',
      scene: 'bg-blue-500 dark:bg-blue-400',
    }
    const typeLabels: Record<string, string> = {
      character: 'Character',
      location: 'Location',
      scene: 'Scene',
    }
    return (
      <div className="flex items-center h-full">
        <span className={`text-tag-small px-1 py-0 ${typeColors[row.collectionType]} text-white rounded`}>
          {typeLabels[row.collectionType]}
        </span>
      </div>
    )
  }

  if (row.rowType === 'asset' && row.assetType) {
    const assetColors: Record<string, string> = {
      shot: 'bg-gray-600 dark:bg-gray-400',
      video: 'bg-purple-500 dark:bg-purple-400',
      image: 'bg-yellow-500 dark:bg-yellow-400',
      text: 'bg-gray-500 dark:bg-gray-400',
    }
    const assetLabels: Record<string, string> = {
      shot: 'Shot',
      video: 'Video',
      image: 'Image',
      text: 'Text',
    }
    return (
      <div className="flex items-center h-full">
        <span className={`text-tag-small px-1 py-0 ${assetColors[row.assetType]} text-white rounded`}>
          {assetLabels[row.assetType]}
        </span>
      </div>
    )
  }

  return null
}

// Custom cell renderer for name
function NameCellRenderer(
  params: ICellRendererParams<TreeRow> & {
    onCollectionClick: (collection: Collection) => void
    onRetryLoad?: (collectionId: string) => void
  }
) {
  const row = params.data
  if (!row) return null

  const isAsset = row.rowType === 'asset'
  const isErrorRow = row.id.endsWith('-error')

  if (isErrorRow) {
    return (
      <button
        onClick={() => {
          if (row.parentId && params.onRetryLoad) {
            params.onRetryLoad(row.parentId)
          }
        }}
        className="text-body-1-regular text-foreground-system-error hover:underline text-left truncate w-full pl-6"
      >
        {row.name}
      </button>
    )
  }

  return (
    <button
      onClick={() => {
        if (row.rowType === 'collection') {
          params.onCollectionClick({
            id: row.id,
            name: row.name,
            type: row.collectionType!,
            assetCount: row.assetCount || 0,
            mainImage: row.mainImage,
            avatarSrc: row.avatarSrc,
          })
        }
      }}
      className={`text-body-1-regular text-foreground hover:text-foreground-system-link hover:underline text-left truncate w-full ${isAsset ? 'pl-6' : ''}`}
    >
      {row.name}
    </button>
  )
}

// Asset count or empty for assets
function AssetCountCellRenderer(params: ICellRendererParams<TreeRow>) {
  const row = params.data
  if (!row || row.rowType !== 'collection') return null

  return (
    <span className="text-body-1-regular text-foreground-dim">
      {row.assetCount}
    </span>
  )
}

export function CollectionsListView({ collections, onCollectionClick, loading = false }: CollectionsListViewProps) {
  const gridRef = useRef<AgGridReact<TreeRow>>(null)
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())
  const [loadedAssets, setLoadedAssets] = useState<Record<string, Asset[]>>({})
  const [failedCollections, setFailedCollections] = useState<Set<string>>(new Set())

  // Convert collections and their assets to tree rows
  const rowData = useMemo(() => {
    const rows: TreeRow[] = []

    collections.forEach((collection) => {
      // Add collection row
      rows.push({
        id: collection.id,
        name: collection.name,
        rowType: 'collection',
        collectionType: collection.type,
        assetCount: collection.assetCount,
        mainImage: collection.mainImage,
        avatarSrc: collection.avatarSrc,
        isExpanded: expandedCollections.has(collection.id),
      })

      // Add asset rows if collection is expanded
      if (expandedCollections.has(collection.id) && loadedAssets[collection.id]) {
        if (failedCollections.has(collection.id)) {
          // Show error row for failed collections
          rows.push({
            id: `${collection.id}-error`,
            name: 'Failed to load assets. Click to retry.',
            rowType: 'asset',
            parentId: collection.id,
          })
        } else {
          loadedAssets[collection.id].forEach((asset) => {
            rows.push({
              id: `${collection.id}-${asset.id}`,
              name: asset.name,
              rowType: 'asset',
              assetType: asset.type,
              thumbnail: asset.thumbnail,
              parentId: collection.id,
            })
          })
        }
      }
    })

    return rows
  }, [collections, expandedCollections, loadedAssets, failedCollections])

  // Toggle expand/collapse
  const handleToggleExpand = useCallback(async (row: TreeRow) => {
    if (row.rowType !== 'collection') return

    const collectionId = row.id
    const isCurrentlyExpanded = expandedCollections.has(collectionId)

    if (isCurrentlyExpanded) {
      // Collapse
      setExpandedCollections((prev) => {
        const next = new Set(prev)
        next.delete(collectionId)
        return next
      })
    } else {
      // Expand - fetch assets if not loaded or previously failed
      if (!loadedAssets[collectionId] || failedCollections.has(collectionId)) {
        // Clear previous failure state
        setFailedCollections((prev) => {
          const next = new Set(prev)
          next.delete(collectionId)
          return next
        })

        try {
          const response = await fetch(`/api/collections/${collectionId}/assets`)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const assets = await response.json()
          setLoadedAssets((prev) => ({ ...prev, [collectionId]: assets }))
        } catch (error) {
          console.error('Failed to load assets:', error)
          setFailedCollections((prev) => new Set(prev).add(collectionId))
          setLoadedAssets((prev) => ({ ...prev, [collectionId]: [] }))
        }
      }
      setExpandedCollections((prev) => new Set(prev).add(collectionId))
    }
  }, [expandedCollections, loadedAssets, failedCollections])

  // Retry loading assets for a failed collection
  const handleRetryLoad = useCallback(async (collectionId: string) => {
    // Clear the error state
    setFailedCollections((prev) => {
      const next = new Set(prev)
      next.delete(collectionId)
      return next
    })

    try {
      const response = await fetch(`/api/collections/${collectionId}/assets`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const assets = await response.json()
      setLoadedAssets((prev) => ({ ...prev, [collectionId]: assets }))
    } catch (error) {
      console.error('Failed to load assets:', error)
      setFailedCollections((prev) => new Set(prev).add(collectionId))
      setLoadedAssets((prev) => ({ ...prev, [collectionId]: [] }))
    }
  }, [])

  const columnDefs = useMemo<ColDef<TreeRow>[]>(() => [
    {
      headerName: '',
      field: 'mainImage',
      width: 80,
      sortable: false,
      cellRenderer: (params: ICellRendererParams<TreeRow>) => (
        <ExpandThumbnailCellRenderer {...params} onToggleExpand={handleToggleExpand} />
      ),
    },
    {
      headerName: 'Name',
      field: 'name',
      flex: 1,
      minWidth: 200,
      cellRenderer: (params: ICellRendererParams<TreeRow>) => (
        <NameCellRenderer {...params} onCollectionClick={onCollectionClick} onRetryLoad={handleRetryLoad} />
      ),
    },
    {
      headerName: 'Type',
      field: 'collectionType',
      width: 120,
      cellRenderer: TypeBadgeCellRenderer,
    },
    {
      headerName: 'Assets',
      field: 'assetCount',
      width: 100,
      cellRenderer: AssetCountCellRenderer,
    },
  ], [onCollectionClick, handleToggleExpand, handleRetryLoad])

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
  }), [])

  const getRowId = useCallback((params: { data: TreeRow }) => params.data.id, [])

  // Style asset rows differently
  const getRowClass = useCallback((params: { data: TreeRow | undefined }) => {
    if (params.data?.rowType === 'asset') {
      return 'bg-surface-low'
    }
    return ''
  }, [])

  const gridHeight = Math.min(600, rowData.length * 40 + 40)

  // Show skeleton while loading
  if (loading) {
    return (
      <div className="w-full space-y-1 animate-breathe">
        {[...Array(SKELETON_ROW_COUNT)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 h-10 px-2">
            <div className="w-8 h-8 rounded bg-surface-3" />
            <div className="flex-1 h-4 rounded bg-surface-3" style={{ maxWidth: '200px' }} />
            <div className="w-16 h-4 rounded bg-surface-3" />
            <div className="w-12 h-4 rounded bg-surface-3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="ag-theme-alpine w-full" style={{ height: gridHeight }}>
      <AgGridReact<TreeRow>
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={getRowId}
        getRowClass={getRowClass}
        rowHeight={40}
        headerHeight={40}
        suppressCellFocus
        suppressRowClickSelection
        animateRows
      />
    </div>
  )
}
