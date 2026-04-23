'use client'

import { useState, useMemo, useCallback } from 'react'
import { PanelRight, Info, X, Download, Link2 } from 'lucide-react'
import { ShareIcon } from '@/components/ui/share-icon'
import { useRouter } from 'next/navigation'
import { PageHeader, EmptyState, ContextualActionBar, Button, MobileToolbar, CardGrid, DropdownMenuItem, DropdownMenuDivider } from '@/components/ui'
import { SelectAllRow } from '@/components/ui/select-all-row'
import { AssetCard } from '@/components/ui/asset-card'
import { AccessModal } from '@/components/ui/access-modal'
import { ContextMenu } from '@/components/ui/context-menu'
import { useCuts, usePersona, useAssetSelection, useSmartCollections, useViewPreferences, useMobilePanel, useAccess, type VisibleCutEntry } from '@/hooks'
import { compareCutsByStageAndVersion } from '@/lib/cuts'
import { assetToSelectionEntity, assetToResourceRef } from '@/lib/selection-actions'
import type { ResourceRef } from '@/lib/grants'
import { getContextAssetGroups } from '@/lib/context-relationships'
import type { Asset } from '@/lib/data'
import { ResponsivePanel } from '@/components/ui/responsive-panel'
import { useToast } from '@/components/ui/toast'
import { AssetDetailPanelContent } from '@/components/ui/asset-detail-panel'


export function LibraryView() {
  const { hydrated, activePersona } = usePersona()
  const { visibleCuts } = useCuts()
  const { isSensitiveAsset, canShare: canShareResource, createGuestLink } = useAccess()
  const { showToast } = useToast()
  const { scopedAssets } = useSmartCollections()
  const { sidePanelOpen, setSidePanelOpen, showTags, metadataFields } = useViewPreferences()
  const { isOpen: panelOpen, toggle: togglePanel, close: closePanel } = useMobilePanel(sidePanelOpen, setSidePanelOpen)
  const {
    selectedIds,
    primaryId,
    handleSelectionClick,
    selectOnly,
    selectAll,
    clearSelection,
  } = useAssetSelection()
  const [shareTarget, setShareTarget] = useState<{ ref: ResourceRef; title: string } | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; asset: Asset } | null>(null)
  const router = useRouter()

  const isEditorialMember = activePersona?.domainId === 'editorial'

  // Deduplicate: keep only the latest version per episode+stage, track older versions
  const { latestCuts } = useMemo(() => {
    // Group by versionGroupId (episode+stage)
    const groups = new Map<string, VisibleCutEntry[]>()
    for (const cut of visibleCuts) {
      const key = cut.asset.versionGroupId ?? cut.asset.id
      const existing = groups.get(key) ?? []
      existing.push(cut)
      groups.set(key, existing)
    }

    const latest: VisibleCutEntry[] = []
    const older = new Map<string, Asset[]>()

    for (const [, entries] of Array.from(groups)) {
      entries.sort((a, b) => compareCutsByStageAndVersion(a.asset, b.asset))
      latest.push(entries[0]) // highest stage + version first
      if (entries.length > 1) {
        older.set(entries[0].asset.id, entries.slice(1).map(e => e.asset))
      }
    }

    return { latestCuts: latest }
  }, [visibleCuts])

  const episodeCount = useMemo(() => {
    return new Set(latestCuts.map(c => c.asset.episode ?? 'Unknown')).size
  }, [latestCuts])

  const allCutAssets = useMemo(() => latestCuts.map(c => c.asset), [latestCuts])

  const primaryAsset = useMemo(() => {
    if (!primaryId) return null
    return allCutAssets.find(a => a.id === primaryId) ?? null
  }, [primaryId, allCutAssets])

  const contextGroups = useMemo(() => {
    if (!primaryAsset) return undefined
    return getContextAssetGroups(primaryAsset, scopedAssets)
  }, [primaryAsset, scopedAssets])

  const selectedEntities = useMemo(() => {
    return allCutAssets
      .filter(a => selectedIds.has(a.id))
      .map(a => assetToSelectionEntity(a))
  }, [allCutAssets, selectedIds])

  const buildCutMenuItems = useCallback((asset: Asset): import('@/components/ui/inline-action-bar').ActionMenuItem[] => {
    const ref = assetToResourceRef(asset)
    const shareable = canShareResource(ref)
    return [
      { label: 'Share', icon: <ShareIcon className="w-4 h-4" />, onClick: () => setShareTarget({ ref, title: asset.name }), disabled: !shareable },
      { label: 'Copy link', icon: <Link2 className="w-4 h-4" />, disabled: !shareable, onClick: () => {
        const link = createGuestLink(ref, { allowDownload: false, passcode: false, expiresInDays: 7, label: asset.name })
        if (!link) return
        navigator.clipboard.writeText(`${window.location.origin}/nextgen/share/${link.id}`)
        showToast('Link copied', 'success', { label: 'Share settings', onClick: () => setShareTarget({ ref, title: asset.name }) })
      } },
      { label: 'Download', icon: <Download className="w-4 h-4" />, onClick: () => showToast(`Downloading "${asset.name}"...`) },
      { label: 'View details', icon: <Info className="w-4 h-4" />, onClick: () => { selectOnly(asset); setSidePanelOpen(true) } },
    ]
  }, [canShareResource, createGuestLink, showToast, selectOnly, setSidePanelOpen])
  const handlePanelAssetSwitch = (nextAsset: Asset) => {
    if (allCutAssets.some((asset) => asset.id === nextAsset.id)) {
      selectOnly(nextAsset)
      setSidePanelOpen(true)
      return
    }
    router.push(`/nextgen/assets/${nextAsset.id}`)
  }
  if (!hydrated) {
    return <div className="h-full" />
  }

  return (
    <>
      <div className="h-full flex">
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
            <MobileToolbar title="Cuts" actions={
              <>
                <Button
                  variant="icon"
                  size="icon"
                  onClick={togglePanel}
                  aria-label={panelOpen ? 'Close panel' : 'Open panel'}
                >
                  <Info className="w-4 h-4" />
                </Button>
              </>
            } />
            <div className="hidden md:flex items-start justify-between gap-4">
              <PageHeader
                title="Cuts"
                description={
                  allCutAssets.length > 0
                    ? `${allCutAssets.length} cut${allCutAssets.length !== 1 ? 's' : ''} across ${episodeCount} ${episodeCount === 1 ? 'episode' : 'episodes'}`
                    : 'Cuts will appear here as they become available'
                }
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="icon" onClick={togglePanel} aria-label={panelOpen ? 'Close panel' : 'Open panel'}>
                  <PanelRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between min-h-8">
              <SelectAllRow
                selectedCount={selectedIds.size}
                totalCount={allCutAssets.length}
                onSelectAll={() => selectAll(allCutAssets)}
                onClearSelection={clearSelection}
                label={`${allCutAssets.length} cut${allCutAssets.length !== 1 ? 's' : ''}`}
              />
              {selectedIds.size > 0 && (
                <ContextualActionBar
                  selectedEntities={selectedEntities}
                  onClearSelection={clearSelection}
                  downloadAction={{
                    enabled: true,
                    onClick: () => showToast(`Downloading ${selectedIds.size} cut${selectedIds.size !== 1 ? 's' : ''}...`),
                    label: `Download ${selectedIds.size} Cut${selectedIds.size !== 1 ? 's' : ''}`,
                  }}
                />
              )}
            </div>

            {allCutAssets.length > 0 ? (
              <CardGrid
                columns={4}
                gap="4"
                onContextMenu={(e) => {
                  const card = (e.target as HTMLElement).closest('[data-asset-id]')
                  if (!card) return
                  const assetId = card.getAttribute('data-asset-id')
                  const asset = assetId ? allCutAssets.find(a => a.id === assetId) : null
                  if (asset) {
                    e.preventDefault()
                    setContextMenu({ x: e.clientX, y: e.clientY, asset })
                  }
                }}
              >
                {allCutAssets.map((asset) => (
                    <div key={asset.id} data-asset-id={asset.id}>
                      <AssetCard
                        asset={asset}
                        selected={selectedIds.has(asset.id)}
                        primary={primaryId === asset.id}
                        onClick={(a, e) => handleSelectionClick(a, e, allCutAssets)}
                        menuContent={
                          <div className="py-1">
                            {buildCutMenuItems(asset).map((item, i) => (
                              <div key={i}>
                                <DropdownMenuItem icon={item.icon} label={item.label} onClick={item.onClick} disabled={item.disabled} />
                                {item.dividerAfter && <DropdownMenuDivider />}
                              </div>
                            ))}
                          </div>
                        }
                        showTags={showTags}
                        metadataFields={metadataFields}
                        sensitive={isSensitiveAsset(asset.id)}
                        allSelectedIds={selectedIds}
                      />
                    </div>
                ))}
              </CardGrid>
            ) : (
              <EmptyState
                title="No cuts yet"
                message={isEditorialMember
                  ? 'Upload or assemble cuts in your workspace — they will appear here automatically.'
                  : 'Cuts shared to you or your teams will appear here.'}
              />
            )}
            </div>
          </div>
        </div>

        <ResponsivePanel open={panelOpen} onClose={closePanel}>
          {primaryAsset ? (
            <AssetDetailPanelContent
              asset={primaryAsset}
              onClose={() => { clearSelection(); closePanel() }}
              contextGroups={contextGroups}
              onContextAssetClick={handlePanelAssetSwitch}
            />
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 p-4 border-b border-border-dim">
                <span className="text-body-0-bold text-foreground">Info</span>
                <Button variant="icon" compact onClick={closePanel} className="flex-shrink-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 min-h-0 flex items-center justify-center p-6">
                <EmptyState
                  title="Select a cut"
                  message="Choose a cut to preview details, versions, and related context."
                  className="max-w-[260px] py-0"
                />
              </div>
            </>
          )}
        </ResponsivePanel>
      </div>

      {shareTarget && (
        <AccessModal
          open
          onClose={() => setShareTarget(null)}
          resourceId={shareTarget.ref.id}
          resourceRef={shareTarget.ref}
          title={shareTarget.title}
        />
      )}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={buildCutMenuItems(contextMenu.asset)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  )
}
