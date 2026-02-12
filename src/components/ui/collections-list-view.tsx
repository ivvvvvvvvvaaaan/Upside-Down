'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import Image from 'next/image'
import type { Collection, Asset } from '@/lib/data'
import { ChevronRight, ChevronDown, MapPin, Clapperboard, Image as ImageIcon, Palette } from 'lucide-react'
import { Tag } from './tag'

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
  collectionType?: 'character' | 'location' | 'scene' | 'art-type'
  assetCount?: number
  mainImage?: string
  avatarSrc?: string
  // Asset fields
  assetType?: 'shot' | 'video' | 'image' | 'text' | 'audio'
  thumbnail?: string
  // Tree structure
  parentId?: string
  isExpanded?: boolean
}

interface CollectionsListViewProps {
  collections: Collection[]
  loading?: boolean
  preloadedAssets?: Record<string, Asset[]>
  preloadFailures?: Set<string>
}

// Custom cell renderer for expand/collapse + thumbnail
function ExpandThumbnailCellRenderer(
  params: ICellRendererParams<TreeRow> & {
    onToggleExpand: (row: TreeRow) => void
  }
) {
  const row = params.data
  if (!row) return null

  const isStatusRow = row.id.endsWith('-error')
    || row.id.endsWith('-loading')
    || row.id.endsWith('-empty')

  const isCollection = row.rowType === 'collection'
  const isCharacter = isCollection && row.collectionType === 'character'

  // Get the appropriate image source
  const imageSrc = isCollection
    ? (isCharacter ? row.avatarSrc : row.mainImage)
    : row.thumbnail

  // Icon fallback for non-character collections
  const CollectionIcon = row.collectionType === 'location' ? MapPin
    : row.collectionType === 'scene' ? Clapperboard
    : row.collectionType === 'art-type' ? Palette
    : ImageIcon

  // Render preview based on type
  const renderPreview = () => {
    if (isCharacter) {
      // Character: circular avatar
      if (row.assetCount === 0) {
        return (
          <div className="w-8 h-8 rounded-full bg-surface-3" />
        )
      }
      if (imageSrc) {
        return (
          <Image
            src={imageSrc}
            alt={row.name}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover block"
          />
        )
      }
      return (
        <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center">
          <span className="text-foreground-subtle text-label-0-bold">
            {row.name.charAt(0)}
          </span>
        </div>
      )
    }

    if (isCollection) {
      // Location/Scene: rectangular preview with icon fallback
      if (imageSrc) {
        return (
          <Image
            src={imageSrc}
            alt={row.name}
            width={48}
            height={32}
            className="w-12 h-8 rounded object-cover block"
          />
        )
      }
      return (
        <div className="w-12 h-8 rounded bg-surface-2 flex items-center justify-center">
          <CollectionIcon className="w-4 h-4 text-foreground-dim" />
        </div>
      )
    }

    // Asset: rectangular thumbnail
    if (imageSrc) {
      return (
        <Image
          src={imageSrc}
          alt={row.name}
          width={48}
          height={32}
          className="w-12 h-8 rounded object-cover block"
        />
      )
    }
    return (
      <div className="w-12 h-8 rounded bg-surface-2 flex items-center justify-center">
        <ImageIcon className="w-4 h-4 text-foreground-dim" />
      </div>
    )
  }

  return (
    <div className="flex items-center h-full gap-1">
      {isCollection ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            params.onToggleExpand(row)
          }}
          type="button"
          aria-label={row.isExpanded ? 'Collapse collection' : 'Expand collection'}
          aria-expanded={row.isExpanded ?? false}
          className="p-1 hover:bg-surface-interactive-hover rounded"
        >
          {row.isExpanded ? (
            <ChevronDown className="w-4 h-4 text-foreground-dim" />
          ) : (
            <ChevronRight className="w-4 h-4 text-foreground-dim" />
          )}
        </button>
      ) : (
        <div className="w-6" />
      )}
      {isStatusRow ? (
        <div className="w-12 h-8" />
      ) : (
        <div className="w-12 h-8 flex items-center justify-center">
          {renderPreview()}
        </div>
      )}
    </div>
  )
}

// Custom cell renderer for type badge using Tag component
function TypeBadgeCellRenderer(params: ICellRendererParams<TreeRow>) {
  const row = params.data
  if (!row) return null

  const labelMap: Record<string, string> = {
    // Collection types
    character: 'Character',
    location: 'Location',
    scene: 'Scene',
    // Asset types
    shot: 'Shot',
    video: 'Video',
    image: 'Image',
    text: 'Text',
  }

  const typeKey = row.rowType === 'collection' ? row.collectionType : row.assetType
  const label = typeKey ? labelMap[typeKey] : null
  if (!label) return null

  return (
    <div className="flex items-center justify-start h-full w-full">
      <Tag size="standard">{label}</Tag>
    </div>
  )
}

// Custom cell renderer for name
function NameCellRenderer(
  params: ICellRendererParams<TreeRow> & {
    onToggleExpand: (row: TreeRow) => void
    onRetryLoad?: (collectionId: string) => void
  }
) {
  const row = params.data
  if (!row) return null

  const isAsset = row.rowType === 'asset'
  const isErrorRow = row.id.endsWith('-error')
  const isLoadingRow = row.id.endsWith('-loading')

  if (isErrorRow) {
    return (
      <button
        onClick={() => {
          if (row.parentId && params.onRetryLoad) {
            params.onRetryLoad(row.parentId)
          }
        }}
        type="button"
        aria-label="Retry loading assets"
        className="text-body-1-regular text-foreground-system-error hover:underline text-left truncate w-full h-full flex items-center justify-start pl-6"
      >
        {row.name}
      </button>
    )
  }

  if (isLoadingRow) {
    return (
      <div className="flex items-center gap-2 text-body-1-regular text-foreground-dim w-full h-full pl-6">
        <span className="w-3 h-3 border-2 border-foreground-dim border-t-transparent rounded-full animate-spin" />
        <span className="truncate">{row.name}</span>
      </div>
    )
  }

  // Collection names expand/collapse the row, asset names are just display
  if (row.rowType === 'collection') {
    return (
      <button
        onClick={() => params.onToggleExpand(row)}
        type="button"
        aria-expanded={row.isExpanded ?? false}
        className="text-body-1-regular text-foreground hover:text-foreground-system-link hover:underline text-left truncate w-full h-full flex items-center justify-start"
      >
        {row.name}
      </button>
    )
  }

  if (isAsset && row.id.endsWith('-empty')) {
    return (
      <span className="text-body-1-regular text-foreground-dim text-left truncate w-full h-full flex items-center justify-start pl-6">
        {row.name}
      </span>
    )
  }

  // Asset name - no click action
  return (
    <span className="text-body-1-regular text-foreground text-left truncate w-full h-full flex items-center justify-start pl-6">
      {row.name}
    </span>
  )
}

// Asset count or empty for assets
function AssetCountCellRenderer(params: ICellRendererParams<TreeRow>) {
  const row = params.data
  if (!row || row.rowType !== 'collection') return null

  return (
    <div className="flex items-center justify-start h-full text-body-1-regular text-foreground-dim w-full">
      {row.assetCount === 0 ? 'No assets' : row.assetCount}
    </div>
  )
}

export function CollectionsListView({
  collections,
  loading = false,
  preloadedAssets,
  preloadFailures,
}: CollectionsListViewProps) {
  const gridRef = useRef<AgGridReact<TreeRow>>(null)
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())
  const [localLoadedAssets, setLocalLoadedAssets] = useState<Record<string, Asset[]>>({})
  const [localFailedCollections, setLocalFailedCollections] = useState<Set<string>>(new Set())
  const [loadingCollections, setLoadingCollections] = useState<Set<string>>(new Set())

  const loadedAssets = useMemo(
    () => ({ ...(preloadedAssets ?? {}), ...localLoadedAssets }),
    [preloadedAssets, localLoadedAssets]
  )
  const failedCollections = useMemo(() => {
    const next = new Set(localFailedCollections)
    if (preloadFailures) {
      preloadFailures.forEach((collectionId) => {
        const hasLoaded = Object.prototype.hasOwnProperty.call(loadedAssets, collectionId)
        if (!hasLoaded) {
          next.add(collectionId)
        }
      })
    }
    return next
  }, [localFailedCollections, preloadFailures, loadedAssets])

  // Convert collections and their assets to tree rows
  const rowData = useMemo(() => {
    const rows: TreeRow[] = []

    collections.forEach((collection) => {
      const assets = loadedAssets[collection.id] ?? []
      const hasLoaded = Object.prototype.hasOwnProperty.call(loadedAssets, collection.id)
      const isFailed = failedCollections.has(collection.id)
      const isLoading = loadingCollections.has(collection.id)

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

      if (!expandedCollections.has(collection.id)) {
        return
      }

      if (isLoading && assets.length === 0) {
        rows.push({
          id: `${collection.id}-loading`,
          name: 'Loading assets...',
          rowType: 'asset',
          parentId: collection.id,
        })
        return
      }

      if (isFailed) {
        rows.push({
          id: `${collection.id}-error`,
          name: 'Failed to load assets. Click to retry.',
          rowType: 'asset',
          parentId: collection.id,
        })
        return
      }

      if (hasLoaded && assets.length > 0) {
        assets.forEach((asset) => {
          rows.push({
            id: `${collection.id}-${asset.id}`,
            name: asset.name,
            rowType: 'asset',
            assetType: asset.type,
            thumbnail: asset.thumbnail,
            parentId: collection.id,
          })
        })
        return
      }

      if (hasLoaded) {
        rows.push({
          id: `${collection.id}-empty`,
          name: 'No assets in this collection.',
          rowType: 'asset',
          parentId: collection.id,
        })
      }
    })

    return rows
  }, [collections, expandedCollections, loadedAssets, failedCollections, loadingCollections])

  const fetchCollectionAssets = useCallback(async (collectionId: string, force = false) => {
    const hasLoaded = Object.prototype.hasOwnProperty.call(loadedAssets, collectionId)

    if (!force && hasLoaded && !failedCollections.has(collectionId)) return

    let shouldFetch = false
    setLoadingCollections((prev) => {
      if (prev.has(collectionId)) return prev
      const next = new Set(prev)
      next.add(collectionId)
      shouldFetch = true
      return next
    })

    if (!shouldFetch) return

      setLocalFailedCollections((prev) => {
        const next = new Set(prev)
        next.delete(collectionId)
        return next
      })

    try {
      const response = await fetch(`/api/collections/${collectionId}/assets`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const assets = await response.json()
      setLocalLoadedAssets((prev) => ({ ...prev, [collectionId]: assets }))
    } catch (error) {
      console.error('Failed to load assets:', error)
      setLocalFailedCollections((prev) => new Set(prev).add(collectionId))
      setLocalLoadedAssets((prev) => ({ ...prev, [collectionId]: [] }))
    } finally {
      setLoadingCollections((prev) => {
        const next = new Set(prev)
        next.delete(collectionId)
        return next
      })
    }
  }, [loadedAssets, failedCollections])

  // Toggle expand/collapse
  const handleToggleExpand = useCallback((row: TreeRow) => {
    if (row.rowType !== 'collection') return

    const collectionId = row.id
    const isCurrentlyExpanded = expandedCollections.has(collectionId)

    if (isCurrentlyExpanded) {
      setExpandedCollections((prev) => {
        const next = new Set(prev)
        next.delete(collectionId)
        return next
      })
      return
    }

    setExpandedCollections((prev) => new Set(prev).add(collectionId))

    const hasLoaded = Object.prototype.hasOwnProperty.call(loadedAssets, collectionId)
    if (!hasLoaded || failedCollections.has(collectionId)) {
      void fetchCollectionAssets(collectionId, failedCollections.has(collectionId))
    }
  }, [expandedCollections, loadedAssets, failedCollections, fetchCollectionAssets])

  // Retry loading assets for a failed collection
  const handleRetryLoad = useCallback(async (collectionId: string) => {
    await fetchCollectionAssets(collectionId, true)
  }, [fetchCollectionAssets])

  const columnDefs = useMemo<ColDef<TreeRow>[]>(() => [
    {
      headerName: '',
      field: 'mainImage',
      width: 100,
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
        <NameCellRenderer {...params} onToggleExpand={handleToggleExpand} onRetryLoad={handleRetryLoad} />
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
  ], [handleRetryLoad, handleToggleExpand])

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
  }), [])

  const getRowId = useCallback((params: { data: TreeRow }) => params.data.id, [])

  // Style asset rows differently
  const getRowClass = useCallback((params: { data: TreeRow | undefined }) => {
    if (params.data?.id.endsWith('-loading')) {
      return 'bg-surface-low text-foreground-dim'
    }
    if (params.data?.rowType === 'asset') {
      return 'bg-surface-low'
    }
    return ''
  }, [])

  // Show skeleton while loading
  if (loading) {
    return (
      <div
        className="w-full space-y-1 animate-breathe"
      >
        {[...Array(SKELETON_ROW_COUNT)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 h-11 px-2">
            <div className="w-4 h-4 rounded bg-surface-3" />
            <div className="w-12 h-8 rounded bg-surface-3" />
            <div className="flex-1 h-4 rounded bg-surface-3" style={{ maxWidth: '200px' }} />
            <div className="w-16 h-4 rounded bg-surface-3" />
            <div className="w-12 h-4 rounded bg-surface-3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="ag-theme-hawkins w-full"
    >
      <AgGridReact<TreeRow>
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={getRowId}
        getRowClass={getRowClass}
        domLayout="autoHeight"
        rowHeight={40}
        headerHeight={40}
        suppressCellFocus
        suppressRowClickSelection
        animateRows
      />
    </div>
  )
}
