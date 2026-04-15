'use client'

import { useMemo } from 'react'
import { Stack, Text, CardGrid, AssetCard, EmptyState, MobileToolbar } from '@/components/ui'
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
  const { cardSize } = useViewPreferences()
  const { getResourceGrants } = useAccess()
  const { tree } = useFileTree()

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

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <Stack spacing="lg">
              <MobileToolbar title={folderName} />

              <div className="hidden md:block">
                <Text variant="headline-1" weight="bold" className="mb-2">
                  {folderName}
                </Text>
                {sharedBy && (
                  <Text variant="body-2" color="secondary">
                    Shared by {sharedBy}
                  </Text>
                )}
              </div>

              <ContextualActionBar
                selectedEntities={selectedEntities}
                onClearSelection={clearSelection}
                metadata={`${assets.length} asset${assets.length !== 1 ? 's' : ''}`}
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
