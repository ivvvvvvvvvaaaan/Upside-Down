'use client'

import { useMemo, useState } from 'react'
import { Download, MoreVertical, Trash2, X } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Tooltip } from './tooltip'
import { Dropdown, DropdownMenuItem } from './dropdown'
import { AccessModal } from './access-modal'
import { CollectionMembershipModal } from './collection-membership-modal'
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
  /** Left-side metadata shown when nothing is selected (e.g. "3 assets") */
  metadata?: string
  className?: string
}

export function ContextualActionBar({
  selectedEntities,
  onClearSelection,
  downloadAction,
  removeAction,
  metadata,
  className,
}: ContextualActionBarProps) {
  const { canShare, getGrantableProfiles } = useAccess()
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [shareTarget, setShareTarget] = useState<{ resourceRef: ResourceRef; title: string } | null>(null)
  const [batchResourceRefs, setBatchResourceRefs] = useState<ResourceRef[]>([])

  const hasSelection = selectedEntities.length > 0

  const evaluation = useMemo(() => evaluateSelectionActions({
    selectedEntities,
    canShareResource: canShare,
    getGrantableProfiles,
  }), [selectedEntities, canShare, getGrantableProfiles])

  const selectionLabel = getSelectionCountLabel(selectedEntities)

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

  return (
    <>
      <div className={cn('flex items-center gap-2 min-h-8 -my-2', className)}>
        {hasSelection ? (
          <>
            <span className="text-body-0-regular text-foreground-subtle whitespace-nowrap">{selectionLabel}</span>
            <Button
              variant="icon"
              compact
              onClick={onClearSelection}
              aria-label="Clear selection"
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="flex-1" />

            {downloadAction && (
              <DisabledTooltip reason={!downloadAction.enabled ? downloadAction.reason : undefined}>
                <Button
                  variant="secondary"
                  compact
                  icon={<Download className="w-4 h-4" />}
                  onClick={downloadAction.onClick}
                  disabled={!downloadAction.enabled}
                >
                  {downloadAction.label ?? 'Download'}
                </Button>
              </DisabledTooltip>
            )}
            {evaluation.actions.share.visible && (
              <DisabledTooltip reason={!evaluation.actions.share.enabled ? evaluation.actions.share.reason : undefined}>
                <Button
                  variant="secondary"
                  compact
                  icon={<Image src="/Icons/Icons-share.svg" alt="" width={16} height={16} />}
                  onClick={handleShare}
                  disabled={!evaluation.actions.share.enabled}
                >
                  {evaluation.actions.share.label}
                </Button>
              </DisabledTooltip>
            )}
            {((evaluation.actions.addToCollection.visible && evaluation.actions.addToCollection.enabled) || (removeAction && removeAction.enabled)) && (
              <Dropdown label="More" icon={<MoreVertical className="w-4 h-4" />} iconOnly compact align="end" width="sm">
                {evaluation.actions.addToCollection.visible && evaluation.actions.addToCollection.enabled && (
                  <DropdownMenuItem
                    label={evaluation.actions.addToCollection.label}
                    onClick={() => setShowCollectionModal(true)}
                  />
                )}
                {removeAction && removeAction.enabled && (
                  <DropdownMenuItem
                    label="Remove from collection"
                    onClick={removeAction.onClick}
                    destructive
                  />
                )}
              </Dropdown>
            )}
          </>
        ) : (
          <span className="text-body-0-regular text-foreground-subtle whitespace-nowrap">{metadata}</span>
        )}
      </div>

      <CollectionMembershipModal
        open={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        selectedAssets={evaluation.selectedAssets}
        onComplete={onClearSelection}
      />

      <AccessModal
        open={showAccessModal}
        onClose={() => { setShowAccessModal(false); setShareTarget(null); setBatchResourceRefs([]) }}
        resourceId={shareTarget?.resourceRef.id ?? batchResourceRefs[0]?.id ?? ''}
        resourceRef={shareTarget?.resourceRef ?? batchResourceRefs[0]}
        batchResourceRefs={batchResourceRefs.length > 1 ? batchResourceRefs : undefined}
        title={shareTarget?.title}
      />
    </>
  )
}
