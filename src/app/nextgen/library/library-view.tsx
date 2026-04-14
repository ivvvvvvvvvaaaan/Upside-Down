'use client'

import { useState, useMemo, useCallback } from 'react'
import { Film, PanelRight, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { PageHeader, EmptyState, ContextualActionBar, Button, MobileToolbar, CardGrid } from '@/components/ui'
import { AssetCard } from '@/components/ui/asset-card'
import { ReleaseModal } from '@/components/ui/release-modal'
import { useCuts, usePersona, useAssetSelection, useSmartCollections, useViewPreferences, useMobilePanel, useAccess, type VisibleCutEntry, type MetadataFieldVisibility } from '@/hooks'
import type { SeedCut } from '@/lib/scenario'
import { compareCutsByStageAndVersion } from '@/lib/cuts'
import { assetToSelectionEntity } from '@/lib/selection-actions'
import { getContextAssetGroups } from '@/lib/context-relationships'
import type { Asset } from '@/lib/data'
import { ResponsivePanel } from '@/components/ui/responsive-panel'
import { AssetDetailPanelContent } from '@/components/ui/asset-detail-panel'

function EpisodeSection({ episode, cuts, selectedIds, primaryId, onAssetClick, onMenuClick, onRequestAccess, showTags, metadataFields, versionCounts }: {
  episode: string
  cuts: VisibleCutEntry[]
  selectedIds: Set<string>
  primaryId: string | null
  onAssetClick: (asset: Asset, event: React.MouseEvent, allAssets: Asset[]) => void
  onMenuClick?: (asset: Asset) => void
  onRequestAccess: (asset: Asset) => void
  showTags?: boolean
  metadataFields?: MetadataFieldVisibility
  versionCounts?: Map<string, number>
}) {
  const allAssets = cuts.map(c => c.asset)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Film className="w-4 h-4 text-foreground-dim" />
        <h3 className="text-body-1-bold text-foreground">{episode}</h3>
        <span className="text-body-0-regular text-foreground-dim">
          {cuts.length} {cuts.length === 1 ? 'cut' : 'cuts'}
        </span>
      </div>
      <CardGrid columns={4} gap="4">
        {cuts.map((cut) => {
          const count = versionCounts?.get(cut.asset.id) ?? 1
          return (
            <div key={cut.asset.id} className="space-y-1">
              <AssetCard
                asset={cut.asset}
                selected={selectedIds.has(cut.asset.id)}
                primary={primaryId === cut.asset.id}
                onClick={(a, e) => onAssetClick(a, e, allAssets)}
                onMenuClick={onMenuClick ? () => onMenuClick(cut.asset) : undefined}
                restricted={cut.visibility === 'discoverable'}
                onRequestAccess={onRequestAccess}
                showTags={showTags}
                metadataFields={metadataFields}
              />
              {count > 1 && (
                <span className="text-label-0-regular text-foreground-subtle block">
                  {count} versions
                </span>
              )}
            </div>
          )
        })}
      </CardGrid>
    </div>
  )
}

export function LibraryView() {
  const { hydrated, isAdmin, activePersona } = usePersona()
  const { visibleCuts, accessibleCuts } = useCuts()
  const { requestAccess } = useAccess()
  const { scopedAssets } = useSmartCollections()
  const { sidePanelOpen, setSidePanelOpen, showTags, metadataFields } = useViewPreferences()
  const { isOpen: panelOpen, toggle: togglePanel, close: closePanel } = useMobilePanel(sidePanelOpen, setSidePanelOpen)
  const {
    selectedIds,
    primaryId,
    handleSelectionClick,
    selectOnly,
    clearSelection,
  } = useAssetSelection()
  const [releaseTarget, setReleaseTarget] = useState<SeedCut | null>(null)
  const router = useRouter()

  const isEditorialMember = activePersona?.domainId === 'editorial'

  const canRelease = useMemo(() => {
    return isEditorialMember || isAdmin
  }, [isEditorialMember, isAdmin])

  // Deduplicate: keep only the latest version per episode+stage, track older versions
  const { latestCuts, olderVersionsMap, versionCounts } = useMemo(() => {
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

    // Version counts: total versions per latest cut id
    const counts = new Map<string, number>()
    for (const [, entries] of Array.from(groups)) {
      // entries is already sorted above; entries[0] is the latest
      counts.set(entries[0].asset.id, entries.length)
    }

    return { latestCuts: latest, olderVersionsMap: older, versionCounts: counts }
  }, [visibleCuts])

  // Group by episode, sort by stage + version (latest first)
  const episodes = useMemo(() => {
    const map = new Map<string, VisibleCutEntry[]>()
    for (const cut of latestCuts) {
      const ep = cut.asset.episode ?? 'Unknown'
      const existing = map.get(ep) ?? []
      existing.push(cut)
      map.set(ep, existing)
    }
    for (const entry of Array.from(map)) {
      entry[1].sort((a, b) => compareCutsByStageAndVersion(a.asset, b.asset))
    }
    return Array.from(map).sort((a, b) => a[0].localeCompare(b[0]))
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

  const primaryOlderVersions = useMemo(() => {
    if (!primaryAsset) return undefined
    return olderVersionsMap.get(primaryAsset.id)
  }, [primaryAsset, olderVersionsMap])

  const selectedEntities = useMemo(() => {
    return allCutAssets
      .filter(a => selectedIds.has(a.id))
      .map(a => assetToSelectionEntity(a))
  }, [allCutAssets, selectedIds])

  const handleRequestAccess = useCallback((asset: Asset) => {
    requestAccess(asset.id, { id: asset.id, type: 'cut', domainId: 'editorial' })
  }, [requestAccess])

  const handleAssetClick = (asset: Asset, event: React.MouseEvent, allAssets: Asset[]) => {
    handleSelectionClick(asset, event, allAssets)
  }

  const handleMenuClick = (asset: Asset) => {
    const seed = accessibleCuts.find(c => c.asset.id === asset.id)?.seed
    if (seed && canRelease) setReleaseTarget(seed)
  }
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
              <Button
                variant="icon"
                size="icon"
                onClick={togglePanel}
                aria-label={panelOpen ? 'Close panel' : 'Open panel'}
                
              >
                <Info className="w-4 h-4" />
              </Button>
            } />
            <div className="hidden md:flex items-start justify-between gap-4">
              <PageHeader
                title="Cuts"
                description={
                  visibleCuts.length > 0
                    ? `${visibleCuts.length} cuts across ${episodes.length} ${episodes.length === 1 ? 'episode' : 'episodes'}`
                    : 'Cuts will appear here as they become available'
                }
              />
              <Button
                variant="icon"
                onClick={togglePanel}
                aria-label={panelOpen ? 'Close panel' : 'Open panel'}
                
              >
                <PanelRight className="w-4 h-4" />
              </Button>
            </div>

            <ContextualActionBar
              selectedEntities={selectedEntities}
              onClearSelection={clearSelection}
              metadata={visibleCuts.length > 0 ? `${visibleCuts.length} cut${visibleCuts.length !== 1 ? 's' : ''}` : undefined}
            />

            {episodes.length > 0 ? (
              <div className="space-y-8">
                {episodes.map(([episode, cuts]) => (
                  <EpisodeSection
                    key={episode}
                    episode={episode}
                    cuts={cuts}
                    selectedIds={selectedIds}
                    primaryId={primaryId}
                    onAssetClick={handleAssetClick}
                    onMenuClick={canRelease ? handleMenuClick : undefined}
                    onRequestAccess={handleRequestAccess}
                    showTags={showTags}
                    metadataFields={metadataFields}
                    versionCounts={versionCounts}
                  />
                ))}
              </div>
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
              olderVersions={primaryOlderVersions}
              onContextAssetClick={handlePanelAssetSwitch}
              onVersionSelect={handlePanelAssetSwitch}
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

      <ReleaseModal
        open={!!releaseTarget}
        onClose={() => setReleaseTarget(null)}
        cut={releaseTarget}
      />
    </>
  )
}
