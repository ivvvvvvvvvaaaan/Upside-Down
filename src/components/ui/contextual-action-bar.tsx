'use client'

import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { AccessModal } from './access-modal'
import { CollectionMembershipModal } from './collection-membership-modal'
import { useAccess } from '@/hooks'
import { useShareAsCollection } from '@/hooks/useShareAsCollection'
import type { ShareTarget } from '@/hooks/useShareAsCollection'
import type { SelectionEntity } from '@/lib/selection-actions'
import type { ResourceRef } from '@/lib/grants'
import { evaluateSelectionActions, getSelectionCountLabel } from '@/lib/selection-actions'

export interface ActionBarAction {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
  disabledReason?: string
  variant?: 'primary' | 'secondary' | 'tertiary'
}

interface ContextualActionBarProps {
  /** Actions shown when nothing is selected (parent resource actions) */
  parentActions?: ActionBarAction[]
  /** Currently selected entities */
  selectedEntities: SelectionEntity[]
  /** Callback to clear the selection */
  onClearSelection: () => void
  /** Left-side metadata shown when nothing is selected (e.g. "3 assets") */
  metadata?: string
  className?: string
}

function ParentActionButton({ action }: { action: ActionBarAction }) {
  return (
    <Button
      variant={action.variant ?? 'tertiary'}
      compact
      icon={action.icon}
      onClick={action.onClick}
      disabled={action.disabled}
      title={action.disabled ? action.disabledReason : undefined}
    >
      {action.label}
    </Button>
  )
}

export function ContextualActionBar({
  parentActions,
  selectedEntities,
  onClearSelection,
  metadata,
  className,
}: ContextualActionBarProps) {
  const { canShare, getGrantableProfiles } = useAccess()
  const { resolveShareTarget } = useShareAsCollection()
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null)
  const [batchResourceRefs, setBatchResourceRefs] = useState<ResourceRef[]>([])

  const hasSelection = selectedEntities.length > 0
  const hasParentActions = parentActions && parentActions.length > 0

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
      const resolved = resolveShareTarget(entity.resourceRef, entity.label)
      setShareTarget(resolved)
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

            {evaluation.actions.addToCollection.visible && (
              <Button
                variant="secondary"
                compact
                icon={<Image src="/Icons/Icon-new.svg" alt="" width={16} height={16} />}
                onClick={() => setShowCollectionModal(true)}
                disabled={!evaluation.actions.addToCollection.enabled}
                title={!evaluation.actions.addToCollection.enabled ? evaluation.actions.addToCollection.reason : undefined}
              >
                {evaluation.actions.addToCollection.label}
              </Button>
            )}
            {evaluation.actions.share.visible && (
              <Button
                variant="primary"
                compact
                icon={<Image src="/Icons/Icons-share.svg" alt="" width={16} height={16} />}
                onClick={handleShare}
                disabled={!evaluation.actions.share.enabled}
                title={!evaluation.actions.share.enabled ? evaluation.actions.share.reason : undefined}
              >
                {evaluation.actions.share.label}
              </Button>
            )}
          </>
        ) : (
          <>
            {metadata && (
              <span className="text-body-0-regular text-foreground-subtle whitespace-nowrap">{metadata}</span>
            )}
            <div className="flex-1" />
            {hasParentActions && parentActions!.map((action) => (
              <ParentActionButton key={action.id} action={action} />
            ))}
          </>
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
        resourceRef={shareTarget ? shareTarget.resourceRef as ResourceRef : batchResourceRefs[0]}
        batchResourceRefs={batchResourceRefs.length > 1 ? batchResourceRefs : undefined}
        title={shareTarget?.name}
      />
    </>
  )
}
