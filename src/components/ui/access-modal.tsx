'use client'

import { useState, useCallback } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Modal } from './modal'
import { Card } from './card'
import { Button } from './button'
import { AccessPanel } from './access-panel'
import type { ResourceRef, Grant } from '@/lib/grants'

type HeaderOverride = { title: string; subtitle?: string; onBack: () => void }
type PendingHandlers = {
  confirm: () => void
  cancel: () => void
  confirmLabel?: string
  cancelLabel?: string
}

export interface AccessModalProps {
  open: boolean
  onClose: () => void
  resourceId: string
  resourceRef?: ResourceRef
  batchResourceRefs?: ResourceRef[]
  inheritedGrants?: { grant: Grant; fromResourceName: string }[]
  title?: string
}

export function AccessModal({
  open,
  onClose,
  resourceId,
  resourceRef,
  batchResourceRefs,
  inheritedGrants,
  title,
}: AccessModalProps) {
  const isBatch = batchResourceRefs && batchResourceRefs.length > 1
  const heading = isBatch
    ? `Share ${batchResourceRefs.length} items`
    : title ? `Share ${title}` : 'Share'
  const resourceSubtitle = getResourceSubtitle(resourceRef, batchResourceRefs, title)

  // Dirty state: existing grants were modified
  const [dirty, setDirty] = useState(false)
  const [dirtyHandlers, setDirtyHandlers] = useState<{ save: () => void; cancel: () => void } | null>(null)

  // Pending state: new people staged but not yet confirmed
  const [pending, setPending] = useState(false)
  const [pendingHandlers, setPendingHandlers] = useState<PendingHandlers | null>(null)

  // Header override: lets AccessPanel take over the modal title + back button
  // when running a sub-flow (e.g. the two-step Grant access add).
  const [headerOverride, setHeaderOverride] = useState<HeaderOverride | null>(null)

  const onDirtyChange = useCallback((isDirty: boolean, h: { save: () => void; cancel: () => void }) => {
    setDirty(isDirty)
    setDirtyHandlers(isDirty ? h : null)
  }, [])

  const onPendingChange = useCallback((isPending: boolean, h: PendingHandlers) => {
    setPending(isPending)
    setPendingHandlers(isPending ? h : null)
  }, [])

  const onHeaderChange = useCallback((override: HeaderOverride | null) => {
    setHeaderOverride(override)
  }, [])

  const handleClose = () => {
    if (pending && pendingHandlers) pendingHandlers.cancel()
    if (dirty && dirtyHandlers) dirtyHandlers.cancel()
    onClose()
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && handleClose()} size="sm">
      <Modal.Header
        title={headerOverride?.title ?? heading}
        subtitle={headerOverride ? headerOverride.subtitle ?? resourceSubtitle : undefined}
        backButton={headerOverride ? (
          <Button variant="icon" compact onClick={headerOverride.onBack} aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        ) : undefined}
      />
      <Modal.Body>
        <AccessPanel
          resourceId={resourceId}
          resourceRef={resourceRef}
          batchResourceRefs={batchResourceRefs}
          inheritedGrants={inheritedGrants}
          onDirtyChange={onDirtyChange}
          onPendingChange={onPendingChange}
          onHeaderChange={onHeaderChange}
        />
      </Modal.Body>
      <Card.Footer>
        {pending && pendingHandlers ? (
          <>
            <Button variant="secondary" onClick={() => { pendingHandlers.cancel() }}>{pendingHandlers.cancelLabel ?? 'Cancel'}</Button>
            <Button variant="primary" onClick={() => { pendingHandlers.confirm() }}>{pendingHandlers.confirmLabel ?? 'Confirm'}</Button>
          </>
        ) : dirty && dirtyHandlers ? (
          <>
            <Button variant="secondary" onClick={() => { dirtyHandlers.cancel(); onClose() }}>Cancel</Button>
            <Button variant="primary" onClick={() => { dirtyHandlers.save(); onClose() }}>Save</Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>Close</Button>
        )}
      </Card.Footer>
    </Modal>
  )
}

function getResourceSubtitle(
  resourceRef?: ResourceRef,
  batchResourceRefs?: ResourceRef[],
  title?: string,
): string | undefined {
  if (batchResourceRefs && batchResourceRefs.length > 1) {
    return `${batchResourceRefs.length} items`
  }
  if (!resourceRef || !title) return title

  const resourceTypeLabel = getResourceTypeLabel(resourceRef.type)
  return resourceTypeLabel ? `${resourceTypeLabel} · ${title}` : title
}

function getResourceTypeLabel(type: ResourceRef['type']): string {
  if (type === 'folder') return 'Folder'
  if (type === 'collection' || type === 'smart-collection') return 'Collection'
  if (type === 'cut') return 'Cut'
  if (type === 'asset') return 'Asset'
  if (type === 'review-set') return 'Review set'
  if (type === 'project') return 'Project'
  return 'Item'
}
