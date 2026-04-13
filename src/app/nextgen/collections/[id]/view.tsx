'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { PanelRight, Info, HardDrive, MoreVertical } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import {
  Stack,
  Text,
  Button,
  CardGrid,
  AssetCard,
  ContextualActionBar,
  EmptyState,
  CollectionSidePanel,
  AssetDetailPanel,
  MobileToolbar,
  Dropdown,
  DropdownMenuItem,
  SortDropdown,
  AppearanceDropdown,
} from '@/components/ui'
import { useBreadcrumbExtras } from '@/components/ui/project-breadcrumb'
import { Upload } from 'lucide-react'
import { getGridColumns, useAccess, useAssetSelection, usePersona, useViewPreferences, useUserCollections, useSmartCollections, useMobilePanel, useFileTree } from '@/hooks'
import type { Asset } from '@/lib/data'
import { PERSONAS } from '@/lib/personas'
import { assetToSelectionEntity } from '@/lib/selection-actions'
import { getContextAssetGroups } from '@/lib/context-relationships'
import { resolveCollectionAssets } from '@/lib/data'
import { AccessModal } from '@/components/ui/access-modal'
import type { ResourceRef } from '@/lib/grants'
import type { AssetType } from '@/lib/data'
import { SHARED_MOUNT_FOLDER_ID } from '@/lib/workspace-data'
import { useToast } from '@/components/ui/toast'
import type { DomainId } from '@/components/department/types'

function inferAssetType(ext: string): AssetType {
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'mxf'].includes(ext)) return 'video'
  if (['jpg', 'jpeg', 'png', 'psd', 'tiff', 'exr', 'dpx', 'svg', 'webp'].includes(ext)) return 'image'
  if (['wav', 'mp3', 'aac', 'flac', 'aiff'].includes(ext)) return 'audio'
  return 'text'
}

interface UserCollectionDetailViewProps {
  collectionId: string
}

export function UserCollectionDetailView({ collectionId }: UserCollectionDetailViewProps) {
  const router = useRouter()

  const { activePersona, isAdmin, hydrated } = usePersona()
  const {
    filterByAccess,
    sharesReceivedByMe,
    allProjectShares,
    getVisibleCollection,
    getCurrentUserGrant,
    canShare,
    canUploadToCollection,
  } = useAccess()
  const { getCollection, deleteCollection, addAssetsToCollection } = useUserCollections()
  const { createReferenceFolder } = useFileTree()
  const { showToast } = useToast()
  const { getRelatedCollectionsForAssets, scopedAssets, ensureAssetsLoaded } = useSmartCollections()
  const { selectedIds, primaryId, handleAssetClick, selectOnly, clearSelection } = useAssetSelection()
  const { cardSize, setCardSize, sidePanelOpen, setSidePanelOpen, showTags, setShowTags, metadataFields, setMetadataField } = useViewPreferences()
  const [sortCriteria, setSortCriteria] = useState<import('@/components/ui').SortCriterion[]>([{ field: 'name', direction: 'asc' as const }])
  const { isOpen: panelOpen, toggle: togglePanel, close: closePanel } = useMobilePanel(sidePanelOpen, setSidePanelOpen)
  const { setBreadcrumbExtras, clearBreadcrumbExtras } = useBreadcrumbExtras()

  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  const rawCollection = getCollection(collectionId)
  const collection = getVisibleCollection(collectionId)
  const isOwner = hydrated && (isAdmin || (!!rawCollection && rawCollection.createdBy === activePersona?.email))
  const hasCollectionAccess = hydrated && !!collection
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const collectionResourceRef: ResourceRef = { id: collectionId, type: 'collection' }
  const showShareButton = hasCollectionAccess && canShare(collectionResourceRef)

  // Upload (dropbox) state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAssets, setUploadingAssets] = useState<Map<string, { asset: Asset; processing: boolean }>>(new Map())
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)
  const showUpload = canUploadToCollection(collectionId)

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newEntries = new Map(uploadingAssets)

    fileArray.forEach((file, i) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      const asset: Asset = {
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name.replace(/\.[^.]+$/, ''),
        type: inferAssetType(ext),
        extension: ext,
        thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        created_at: new Date().toISOString(),
      }
      newEntries.set(asset.id, { asset, processing: true })

      // Transition out of processing after staggered delay
      setTimeout(() => {
        setUploadingAssets(prev => {
          const next = new Map(prev)
          const entry = next.get(asset.id)
          if (entry) next.set(asset.id, { ...entry, processing: false })
          return next
        })
      }, 2000 + i * 800)
    })

    setUploadingAssets(newEntries)
    addAssetsToCollection(collectionId, Array.from(newEntries.keys()).filter(id => !uploadingAssets.has(id)))
  }, [uploadingAssets, addAssetsToCollection, collectionId])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files)
    e.target.value = '' // reset so same file can be re-selected
  }, [processFiles])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files)
  }, [processFiles])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (dragCounterRef.current === 1) setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) setIsDragging(false)
  }, [])

  // Merge uploaded assets with resolved collection assets
  const displayAssets = useMemo(() => {
    const uploaded = Array.from(uploadingAssets.values()).map(u => u.asset)
    const uploadedIds = new Set(uploaded.map(a => a.id))
    return [...uploaded, ...assets.filter(a => !uploadedIds.has(a.id))]
  }, [assets, uploadingAssets])

  useEffect(() => {
    void ensureAssetsLoaded()
  }, [ensureAssetsLoaded])

  useEffect(() => {
    clearSelection()
  }, [collectionId, clearSelection])

  // Find who shared this collection with the current user
  const sharedBy = useMemo(() => {
    const shares = isAdmin ? allProjectShares : sharesReceivedByMe
    const share = shares.find(s => s.resourceId === collectionId)
    if (!share || isOwner) return null
    return PERSONAS.find(p => p.id === share.grantedByUserId)?.name ?? share.grantedByUserId
  }, [collectionId, isOwner, isAdmin, sharesReceivedByMe, allProjectShares])

  // Sync collection name to top-level breadcrumb
  const displayName = hasCollectionAccess ? collection?.name : undefined
  useEffect(() => {
    if (displayName) {
      setBreadcrumbExtras([{ label: displayName }])
    }
    return () => clearBreadcrumbExtras()
  }, [displayName, setBreadcrumbExtras, clearBreadcrumbExtras])

  const handleDeleteCollection = () => {
    if (collection && isOwner) {
      deleteCollection(collection.id)
      router.push('/nextgen')
    }
  }



  // Resolve assets using the unified resolution function
  useEffect(() => {
    if (!hydrated) return
    if (!collection || !hasCollectionAccess) {
      setAssets([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const resolved = resolveCollectionAssets(collection)
      setAssets(filterByAccess(resolved))
    } catch (error) {
      console.error('Failed to resolve collection assets:', error)
      setAssets([])
    }
    setLoading(false)
  }, [hydrated, collection, hasCollectionAccess, filterByAccess])

  const handleMenuClick = (asset: Asset) => {
    console.log('Menu clicked for:', asset.name)
  }
  const handlePanelAssetSwitch = (nextAsset: Asset) => {
    if (assets.some((asset) => asset.id === nextAsset.id)) {
      selectOnly(nextAsset)
      setSidePanelOpen(true)
      return
    }
    router.push(`/nextgen/assets/${nextAsset.id}`)
  }

  const selectedAssets = useMemo(() => {
    return assets.filter((asset) => selectedIds.has(asset.id))
  }, [assets, selectedIds])
  const selectedEntities = useMemo(() => selectedAssets.map((asset) => assetToSelectionEntity(asset)), [selectedAssets])
  const primaryAsset = useMemo(() => {
    if (!primaryId) return null
    return assets.find(a => a.id === primaryId) ?? null
  }, [primaryId, assets])
  const primaryAssetContextGroups = useMemo(() => {
    if (!primaryAsset) return undefined
    return getContextAssetGroups(primaryAsset, scopedAssets)
  }, [primaryAsset, scopedAssets])

  const relationships = useMemo(() => {
    if (assets.length === 0) return undefined
    return getRelatedCollectionsForAssets(assets)
  }, [assets, getRelatedCollectionsForAssets])

  // Collection not found
  if ((!collection || !hasCollectionAccess) && !loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Stack spacing="lg">
                <MobileToolbar title="Collection" />
                <EmptyState
                  title="Collection not found"
                  message="This collection may have been deleted or doesn't exist."
                >
                  <Button
                    variant="secondary"
                    onClick={() => router.push('/nextgen/collections')}
                    className="mt-4"
                  >
                    Back to Collections
                  </Button>
                </EmptyState>
              </Stack>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* Main content area */}
      <div
        className="flex-1 min-w-0 flex flex-col relative"
        onDragEnter={showUpload ? handleDragEnter : undefined}
        onDragLeave={showUpload ? handleDragLeave : undefined}
        onDragOver={showUpload ? (e) => { e.preventDefault(); e.stopPropagation() } : undefined}
        onDrop={showUpload ? handleDrop : undefined}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-30 border-2 border-dashed border-indigo-500 rounded-lg bg-indigo-500/5 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-10 h-10 text-indigo-500" />
              <p className="text-body-1-bold text-indigo-500">Drop files to upload</p>
            </div>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Stack spacing="lg">
                <MobileToolbar title={displayName || 'Collection'} actions={
                  <Button
                    variant="icon"
                    size="icon"
                    onClick={togglePanel}
                    aria-label={panelOpen ? 'Close info' : 'Open info'}
                    className={cn(panelOpen && 'bg-surface-3')}
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                } />

                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Text variant="headline-1" weight="bold" className="mb-2 hidden md:block">
                        {displayName || 'Loading...'}
                      </Text>
                      {sharedBy && (
                        <Text variant="body-2" color="secondary">
                          Shared by {sharedBy}
                        </Text>
                      )}
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                      <SortDropdown
                        fields={[
                          { value: 'name', label: 'Name' },
                          { value: 'date-modified', label: 'Date Modified' },
                          { value: 'kind', label: 'Kind' },
                        ]}
                        value={sortCriteria}
                        onChange={setSortCriteria}
                        iconOnly={panelOpen}
                      />
                      <AppearanceDropdown
                        iconOnly={panelOpen}
                        layout="grid"
                        onLayoutChange={() => {}}
                        cardSize={cardSize}
                        onCardSizeChange={setCardSize}
                        showLayoutOptions={false}
                        showTags={showTags}
                        onShowTagsChange={setShowTags}
                        metadataFields={metadataFields}
                        onMetadataFieldChange={setMetadataField}
                      />
                      {showUpload && (
                        <Button
                          variant="secondary"
                          icon={<Upload className="w-4 h-4" />}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Upload
                        </Button>
                      )}
                      {showShareButton && (
                        <Button
                          variant="primary"
                          icon={<Image src="/Icons/Icons-share.svg" alt="" width={16} height={16} />}
                          onClick={() => setShareModalOpen(true)}
                        >
                          Share
                        </Button>
                      )}
                      <Button
                        variant="icon"
                        onClick={togglePanel}
                        aria-label={panelOpen ? 'Close panel' : 'Open panel'}
                        className={cn(panelOpen && 'bg-surface-3')}
                      >
                        <PanelRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <ContextualActionBar
                  selectedEntities={selectedEntities}
                  onClearSelection={clearSelection}
                  metadata={loading ? undefined : `${assets.length} asset${assets.length !== 1 ? 's' : ''}`}
                />

                {loading ? (
                  <CardGrid columns={getGridColumns(cardSize)} gap="4">
                    {[...Array(6)].map((_, i) => (
                      <AssetCard key={i} loading />
                    ))}
                  </CardGrid>
                ) : displayAssets.length > 0 ? (
                  <CardGrid columns={getGridColumns(cardSize)} gap="4">
                    {displayAssets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        selected={selectedIds.has(asset.id)}
                        primary={primaryId === asset.id}
                        onClick={(a, e) => handleAssetClick(a, e, displayAssets)}
                        onMenuClick={handleMenuClick}
                        showDepartment
                        shared={sharedBy ? false : undefined}
                        processing={uploadingAssets.get(asset.id)?.processing}
                      />
                    ))}
                  </CardGrid>
                ) : (
                  <EmptyState
                    title="No assets"
                    message="This collection doesn't have any assets yet"
                  />
                )}

                {/* Hidden file input for upload */}
                {showUpload && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                )}
              </Stack>
            </div>
          </div>
        </div>

      </div>

      {/* Side panel - asset detail when selected, collection settings otherwise */}
      <AssetDetailPanel
        asset={primaryAsset!}
        open={panelOpen && !!primaryAsset}
        onClose={() => { clearSelection(); closePanel() }}
        activeCollectionId={collectionId}
        activeContext={{ type: 'collection', id: collectionId }}
        contextGroups={primaryAssetContextGroups}
        onContextAssetClick={handlePanelAssetSwitch}
      />
      {collection && hasCollectionAccess && (
        <CollectionSidePanel
          collection={collection}
          open={panelOpen && !primaryAsset}
          onClose={closePanel}
          onAction={(action) => {
            if (action.type === 'delete') handleDeleteCollection()
            if (action.type === 'mount') {
              const grant = getCurrentUserGrant(collection.id)
              createReferenceFolder(SHARED_MOUNT_FOLDER_ID, collection.name, {
                resourceId: collection.id,
                resourceType: 'collection',
                shareMode: grant?.shareMode ?? 'live',
                snapshotAssetIds: grant?.snapshotAssetIds,
                domainId: collection.boundDomainId as DomainId | undefined,
              })
              showToast(`Mounted "${collection.name}" to /Shared/${collection.name}`)
            }
          }}
          actionPermissions={{
            canEdit: false,
            canDelete: isOwner,
            canMount: true,
          }}
          relationships={relationships}
        />
      )}

      <AccessModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        resourceId={collectionId}
        resourceRef={collectionResourceRef}
        title={collection?.name}
      />
    </div>
  )
}
