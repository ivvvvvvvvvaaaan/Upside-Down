'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Download, FolderInput, Plus, Trash2, X } from 'lucide-react'
import { ShareIcon } from './share-icon'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Tooltip } from './tooltip'
import { InlineActionBar, type ActionMenuItem } from './inline-action-bar'
import { AccessModal } from './access-modal'
import { CollectionMembershipModal } from './collection-membership-modal'
import { FolderPickerModal } from './folder-picker-modal'
import { useAccess } from '@/hooks'
import type { SelectionEntity } from '@/lib/selection-actions'
import type { ResourceRef } from '@/lib/grants'
import { evaluateSelectionActions, getSelectionCountLabel } from '@/lib/selection-actions'

function DisabledTooltip({ reason, children }: { reason?: string; children: React.ReactNode }) {
  if (!reason) return <>{children}</>
  return <Tooltip label={reason} position="top">{children}</Tooltip>
}

interface ContextualActionBarProps {
  /** Currently selected entities */
  selectedEntities: SelectionEntity[]
  /** Callback to clear the selection */
  onClearSelection: () => void
  /** Optional download action for the current selection */
  downloadAction?: {
    enabled: boolean
    onClick: () => void
    reason?: string
    label?: string
  }
  /** Optional remove action for the current selection (e.g. remove from collection) */
  removeAction?: {
    enabled: boolean
    onClick: () => void
    reason?: string
  }
  /** Called when user places assets into a folder via the folder picker */
  onPlaceInFolder?: (folderId: string, folderName: string, assetIds: string[]) => void
  /** Full menu items -- first 3 shown inline as buttons, rest in overflow three-dot menu. When provided, replaces the default inline buttons. */
  menuItems?: ActionMenuItem[]
  /** Render inline (as row content) instead of floating bar */
  inline?: boolean
  className?: string
}

export function ContextualActionBar({
  selectedEntities,
  onClearSelection,
  downloadAction,
  removeAction,
  onPlaceInFolder,
  menuItems,
  inline = false,
  className,
}: ContextualActionBarProps) {
  const { canShare, getGrantableProfiles, getInheritedGrants } = useAccess()
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [shareTarget, setShareTarget] = useState<{ resourceRef: ResourceRef; title: string } | null>(null)
  const [batchResourceRefs, setBatchResourceRefs] = useState<ResourceRef[]>([])

  const hasSelection = selectedEntities.length > 0

  const evaluation = useMemo(() => evaluateSelectionActions({
    selectedEntities,
    canShareResource: canShare,
    getGrantableProfiles,
  }), [selectedEntities, canShare, getGrantableProfiles])

  const selectionLabel = getSelectionCountLabel(selectedEntities)

  const shareInheritedGrants = useMemo(() => {
    if (!shareTarget || batchResourceRefs.length > 1) return undefined
    return getInheritedGrants(shareTarget.resourceRef.id).map(({ grant, fromResourceName }) => ({
      grant,
      fromResourceName,
    }))
  }, [batchResourceRefs.length, getInheritedGrants, shareTarget])

  const handleShare = () => {
    if (!evaluation.actions.share.enabled) return
    if (evaluation.shareMode === 'single') {
      const entity = selectedEntities[0]
      setShareTarget({ resourceRef: entity.resourceRef, title: entity.label })
      setBatchResourceRefs([])
      setShowAccessModal(true)
      return
    }
    if (evaluation.shareMode === 'batch') {
      const refs = selectedEntities.map(e => e.resourceRef)
      setShareTarget(null)
      setBatchResourceRefs(refs)
      setShowAccessModal(true)
    }
  }

  const handleFolderSelect = (folderId: string, folderName: string) => {
    if (!onPlaceInFolder) return
    const assetIds = selectedEntities.map(e => e.resourceRef.id)
    onPlaceInFolder(folderId, folderName, assetIds)
  }

  return (
    <>
      {hasSelection && (
        <div className={inline
          ? cn('flex items-center gap-2', className)
          : 'fixed bottom-6 left-1/2 -translate-x-1/2 z-50'
        }>
          <div className={inline
            ? 'flex items-center gap-2'
            : 'flex items-center gap-2 pl-4 pr-2 py-2 rounded-lg bg-surface-high border border-border-dim shadow-lg'
          }>
            {!inline && (
              <>
                <span className="text-body-0-bold text-foreground whitespace-nowrap">{selectionLabel}</span>
                <Button
                  variant="icon"
                  compact
                  onClick={onClearSelection}
                  aria-label="Clear selection"
                >
                  <X className="w-4 h-4" />
                </Button>
                <div className="w-px h-5 bg-border-dim mx-1" />
              </>
            )}

            {menuItems ? (
              <InlineActionBar items={menuItems} />
            ) : (
              <>
                {evaluation.actions.share.visible && (
                  <DisabledTooltip reason={!evaluation.actions.share.enabled ? evaluation.actions.share.reason : undefined}>
                    <Button
                      variant="secondary"
                      compact
                      icon={<ShareIcon />}
                      onClick={handleShare}
                      disabled={!evaluation.actions.share.enabled}
                    >
                      <span className="hidden md:inline">{evaluation.actions.share.label}</span>
                    </Button>
                  </DisabledTooltip>
                )}
                {onPlaceInFolder && (
                  <Button
                    variant="secondary"
                    compact
                    icon={<FolderInput className="w-4 h-4" />}
                    onClick={() => setShowFolderPicker(true)}
                  >
                    <span className="hidden md:inline">Copy to</span>
                  </Button>
                )}
                {downloadAction && (
                  <DisabledTooltip reason={!downloadAction.enabled ? downloadAction.reason : undefined}>
                    <Button
                      variant="secondary"
                      compact
                      icon={<Download className="w-4 h-4" />}
                      onClick={downloadAction.onClick}
                      disabled={!downloadAction.enabled}
                    >
                      <span className="hidden md:inline">{downloadAction.label ?? 'Download'}</span>
                    </Button>
                  </DisabledTooltip>
                )}
                {evaluation.actions.addToCollection.visible && evaluation.actions.addToCollection.enabled && (
                  <Button
                    variant="secondary"
                    compact
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowCollectionModal(true)}
                  >
                    <span className="hidden md:inline">{evaluation.actions.addToCollection.label}</span>
                  </Button>
                )}
                {removeAction && removeAction.enabled && (
                  <Button
                    variant="secondary"
                    compact
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={removeAction.onClick}
                  >
                    <span className="hidden md:inline">Remove</span>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <CollectionMembershipModal
        open={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        selectedAssets={evaluation.selectedAssets}
        onComplete={onClearSelection}
      />

      <FolderPickerModal
        open={showFolderPicker}
        onClose={() => setShowFolderPicker(false)}
        onSelect={handleFolderSelect}
      />

      <AccessModal
        open={showAccessModal}
        onClose={() => { setShowAccessModal(false); setShareTarget(null); setBatchResourceRefs([]) }}
        resourceId={shareTarget?.resourceRef.id ?? batchResourceRefs[0]?.id ?? ''}
        resourceRef={shareTarget?.resourceRef ?? batchResourceRefs[0]}
        batchResourceRefs={batchResourceRefs.length > 1 ? batchResourceRefs : undefined}
        inheritedGrants={shareInheritedGrants}
        title={shareTarget?.title}
      />
    </>
  )
}
