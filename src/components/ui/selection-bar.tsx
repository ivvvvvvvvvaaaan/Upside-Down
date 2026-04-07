'use client'

import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { AccessModal } from './access-modal'
import { BatchShareModal } from './batch-share-modal'
import { CollectionMembershipModal } from './collection-membership-modal'
import { useAccess } from '@/hooks'
import { useShareAsCollection } from '@/hooks/useShareAsCollection'
import type { ShareTarget } from '@/hooks/useShareAsCollection'
import type { SelectionEntity } from '@/lib/selection-actions'
import type { ResourceRef } from '@/lib/grants'
import { evaluateSelectionActions, getSelectionCountLabel } from '@/lib/selection-actions'

interface SelectionBarProps {
  selectedEntities: SelectionEntity[]
  onClear: () => void
  className?: string
}

function ActionButton({
  label,
  iconSrc,
  onClick,
  disabled,
  reason,
}: {
  label: string
  iconSrc: string
  onClick: () => void
  disabled?: boolean
  reason?: string
}) {
  return (
    <div title={disabled ? reason : undefined}>
      <Button
        variant="tertiary"
        compact
        icon={<Image src={iconSrc} alt="" width={16} height={16} />}
        onClick={onClick}
        disabled={disabled}
        className="text-white hover:bg-white/20 hover:text-white disabled:bg-white/10 disabled:text-white/60 disabled:hover:bg-white/10 disabled:hover:text-white/60"
      >
        {label}
      </Button>
    </div>
  )
}

export function SelectionBar({
  selectedEntities,
  onClear,
  className,
}: SelectionBarProps) {
  const { canShare, getGrantableProfiles } = useAccess()
  const { resolveShareTarget } = useShareAsCollection()
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [showBatchShareModal, setShowBatchShareModal] = useState(false)
  const [showAccessModal, setShowAccessModal] = useState(false)
  // Resolved share target (may differ from selected entity if folder → collection)
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null)

  const evaluation = useMemo(() => evaluateSelectionActions({
    selectedEntities,
    canShareResource: canShare,
    getGrantableProfiles,
  }), [selectedEntities, canShare, getGrantableProfiles])

  const visibleActions = useMemo(() => [
    evaluation.actions.addToCollection,
    evaluation.actions.share,
  ].filter((action) => action.visible), [evaluation.actions])

  const leadingReason = useMemo(() => {
    const disabledAction = visibleActions.find((action) => !action.enabled && action.reason)
    return disabledAction?.reason
  }, [visibleActions])

  const singleSelectedEntity = evaluation.shareMode === 'single' ? selectedEntities[0] : null
  const selectionLabel = getSelectionCountLabel(selectedEntities)

  if (evaluation.count === 0) return null

  const handleShare = () => {
    if (!evaluation.actions.share.enabled) return
    if (evaluation.shareMode === 'single') {
      const entity = selectedEntities[0]
      // Resolve folder → collection before opening share modal
      const resolved = resolveShareTarget(entity.resourceRef, entity.label)
      setShareTarget(resolved)
      setShowAccessModal(true)
      return
    }
    if (evaluation.shareMode === 'batch') {
      setShowBatchShareModal(true)
    }
  }

  return (
    <>
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div
          className={cn(
            'flex flex-col gap-2 px-4 py-3 rounded-lg pointer-events-auto',
            'bg-indigo-600 text-white shadow-high',
            'animate-in slide-in-from-bottom-4 fade-in duration-200',
            className,
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-body-1-bold">
                {selectionLabel}
              </span>
              <button
                onClick={onClear}
                className="p-1 rounded hover:bg-white/20 transition-colors"
                aria-label="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-6 bg-white/30" />

            <div className="flex items-center gap-2">
              {evaluation.actions.addToCollection.visible && (
                <ActionButton
                  label={evaluation.actions.addToCollection.label}
                  iconSrc="/Icons/Icon-new.svg"
                  onClick={() => setShowCollectionModal(true)}
                  disabled={!evaluation.actions.addToCollection.enabled}
                  reason={evaluation.actions.addToCollection.reason}
                />
              )}
              {evaluation.actions.share.visible && (
                <ActionButton
                  label={evaluation.actions.share.label}
                  iconSrc="/Icons/Icons-share.svg"
                  onClick={handleShare}
                  disabled={!evaluation.actions.share.enabled}
                  reason={evaluation.actions.share.reason}
                />
              )}
            </div>
          </div>

          {leadingReason && (
            <p className="text-label-0-regular text-white/80">
              {leadingReason}
            </p>
          )}
        </div>
      </div>

      <CollectionMembershipModal
        open={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        selectedAssets={evaluation.selectedAssets}
        onComplete={onClear}
      />

      <BatchShareModal
        open={showBatchShareModal}
        onClose={() => setShowBatchShareModal(false)}
        selectedEntities={selectedEntities}
        allowedProfiles={evaluation.allowedShareProfiles}
      />

      {shareTarget && (
        <AccessModal
          open={showAccessModal}
          onClose={() => { setShowAccessModal(false); setShareTarget(null) }}
          resourceId={shareTarget.resourceRef.id}
          resourceRef={shareTarget.resourceRef as ResourceRef}
          title={shareTarget.name}
        />
      )}
    </>
  )
}
