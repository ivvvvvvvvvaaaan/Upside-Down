'use client'

import { useMemo, useState } from 'react'
import { Stack, CardGrid, AssetCard, EmptyState, MobileToolbar, PageHeader, Tag, HawkinsSearch, SortDropdown, AppearanceDropdown } from '@/components/ui'
import type { SortCriterion } from '@/components/ui/sort-dropdown'
import { ContextualActionBar } from '@/components/ui/contextual-action-bar'
import { getGridColumns, useAssetSelection, useViewPreferences, useAccess, useFileTree } from '@/hooks'
import { assetToSelectionEntity } from '@/lib/selection-actions'
import { getAssetsByIds } from '@/lib/data'
import { getAssetIdsForFolderRecursive } from '@/lib/data-client'
import { getDomainWorkspaceFiles } from '@/lib/workspace-data'
import type { DomainId } from '@/components/department/types'
import { PERSONAS } from '@/lib/personas'

interface SharedFolderViewProps {
  folderId: string
}

export function SharedFolderView({ folderId }: SharedFolderViewProps) {
  const { selectedIds, primaryId, handleAssetClick, clearSelection } = useAssetSelection()
  const { cardSize, setCardSize, showTags, setShowTags, metadataFields, setMetadataField } = useViewPreferences()
  const { getResourceGrants, canAccess } = useAccess()
  const { tree } = useFileTree()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { field: 'name', direction: 'asc' },
  ])

  const sortFields = [
    { value: 'name', label: 'Name' },
    { value: 'date-modified', label: 'Date Modified' },
    { value: 'kind', label: 'Kind' },
  ]

  // Find the folder in the tree to get its name and domain
  const folderInfo = useMemo(() => {
    function findNode(nodes: typeof tree, id: string): { name: string; domainId?: DomainId } | null {
      for (const node of nodes) {
        if (node.id === id) return { name: node.name, domainId: node.domainId }
        if (node.children) {
          const found = findNode(node.children, id)
          if (found) return found
        }
      }
      return null
    }
    return findNode(tree, folderId)
  }, [tree, folderId])

  // Resolve assets from the folder
  const assets = useMemo(() => {
    if (!folderInfo?.domainId) return []
    const files = getDomainWorkspaceFiles(folderInfo.domainId)
    const assetIds = getAssetIdsForFolderRecursive(folderId, files)
    return getAssetsByIds(assetIds)
  }, [folderId, folderInfo])

  // Find who shared this folder
  const sharedBy = useMemo(() => {
    const grants = getResourceGrants(folderId)
    if (grants.length === 0) return null
    const grant = grants[0]
    return PERSONAS.find(p => p.id === grant.grantedByUserId)?.name ?? null
  }, [folderId, getResourceGrants])

  const selectedEntities = useMemo(
    () => assets.filter(a => selectedIds.has(a.id)).map(a => assetToSelectionEntity(a)),
    [assets, selectedIds],
  )

  const folderName = folderInfo?.name ?? folderId

  if (!folderInfo) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <EmptyState title="Not Found" message="This folder does not exist." />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!canAccess(folderId)) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <EmptyState title="Access Restricted" message="You don't have access to this folder." />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <Stack spacing="lg">
              <MobileToolbar title={folderName} actions={
                <>
                  <HawkinsSearch
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    collapsible
                  />
                  <SortDropdown
                    fields={sortFields}
                    value={sortCriteria}
                    onChange={setSortCriteria}
                    iconOnly
                  />
                  <AppearanceDropdown
                    iconOnly
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
                </>
              } />

              {/* Row 1: Title + Search + Sort + Appearance */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <PageHeader
                  title={folderName}
                  description={sharedBy ? `Shared by ${sharedBy} · View only` : 'View only'}
                  hideTitleOnMobile
                />
                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                  <HawkinsSearch
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <SortDropdown
                    fields={sortFields}
                    value={sortCriteria}
                    onChange={setSortCriteria}
                    iconOnly
                  />
                  <AppearanceDropdown
                    iconOnly
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
                </div>
              </div>

              {/* Row 2: Item count */}
              <div className="flex items-center justify-between">
                <span className="text-body-0-regular text-foreground-subtle">
                  {assets.length} asset{assets.length !== 1 ? 's' : ''}
                </span>
              </div>

              <ContextualActionBar
                selectedEntities={selectedEntities}
                onClearSelection={clearSelection}
              />

              {assets.length > 0 ? (
                <CardGrid columns={getGridColumns(cardSize)} gap="4">
                  {assets.map(asset => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      selected={selectedIds.has(asset.id)}
                      primary={primaryId === asset.id}
                      onClick={(a, e) => handleAssetClick(a, e, assets)}
                      showDepartment
                      allSelectedIds={selectedIds}
                    />
                  ))}
                </CardGrid>
              ) : (
                <EmptyState
                  title="No assets"
                  message="This folder doesn't have any assets yet"
                />
              )}
            </Stack>
          </div>
        </div>
      </div>
    </div>
  )
}
