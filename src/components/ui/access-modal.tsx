'use client'

import { useState, useCallback } from 'react'
import { Modal } from './modal'
import { Card } from './card'
import { Button } from './button'
import { AccessPanel } from './access-panel'
import type { ResourceRef, Grant } from '@/lib/grants'

export interface AccessModalProps {
  open: boolean
  onClose: () => void
  resourceId: string
  resourceRef?: ResourceRef
  batchResourceRefs?: ResourceRef[]
  inheritedGrants?: { grant: Grant; fromResourceName: string }[]
  title?: string
}

const KIND_LABELS: Record<string, string> = {
  asset: 'Asset',
  folder: 'Workspace',
  collection: 'Collection',
  'smart-collection': 'Smart Collection',
  'review-set': 'Review Set',
  project: 'Project',
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
  const kindLabel = resourceRef ? KIND_LABELS[resourceRef.type] ?? '' : ''
  const heading = isBatch
    ? `Share ${batchResourceRefs.length} items`
    : title ? `Share ${title}` : 'Share'

  // Dirty state: existing grants were modified
  const [dirty, setDirty] = useState(false)
  const [dirtyHandlers, setDirtyHandlers] = useState<{ save: () => void; cancel: () => void } | null>(null)

  // Pending state: new people staged but not yet confirmed
  const [pending, setPending] = useState(false)
  const [pendingHandlers, setPendingHandlers] = useState<{ confirm: () => void; cancel: () => void } | null>(null)

  const onDirtyChange = useCallback((isDirty: boolean, h: { save: () => void; cancel: () => void }) => {
    setDirty(isDirty)
    setDirtyHandlers(isDirty ? h : null)
  }, [])

  const onPendingChange = useCallback((isPending: boolean, h: { confirm: () => void; cancel: () => void }) => {
    setPending(isPending)
    setPendingHandlers(isPending ? h : null)
  }, [])

  const handleClose = () => {
    if (pending && pendingHandlers) pendingHandlers.cancel()
    if (dirty && dirtyHandlers) dirtyHandlers.cancel()
    onClose()
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && handleClose()} size="sm">
      <Modal.Header title={heading} />
      <Modal.Body>
        <AccessPanel
          resourceId={resourceId}
          resourceRef={resourceRef}
          batchResourceRefs={batchResourceRefs}
          inheritedGrants={inheritedGrants}
          onDirtyChange={onDirtyChange}
          onPendingChange={onPendingChange}
        />
      </Modal.Body>
      <Card.Footer>
        {pending && pendingHandlers ? (
          <>
            <Button variant="secondary" onClick={() => { pendingHandlers.cancel() }}>Cancel</Button>
            <Button variant="primary" onClick={() => { pendingHandlers.confirm() }}>Confirm</Button>
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
