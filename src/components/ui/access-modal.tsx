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
  /** Batch mode: share to multiple resources at once */
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
    : title ? `Share ${title} ${kindLabel}`.trim() : 'Share'

  const [dirty, setDirty] = useState(false)
  const [handlers, setHandlers] = useState<{ save: () => void; cancel: () => void } | null>(null)

  const onDirtyChange = useCallback((isDirty: boolean, h: { save: () => void; cancel: () => void }) => {
    setDirty(isDirty)
    setHandlers(isDirty ? h : null)
  }, [])

  const handleClose = () => {
    if (dirty && handlers) {
      handlers.cancel()
    }
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
        />
      </Modal.Body>
      <Card.Footer>
        {dirty && handlers ? (
          <>
            <Button variant="secondary" onClick={() => { handlers.cancel(); onClose() }}>Cancel</Button>
            <Button variant="primary" onClick={() => { handlers.save(); onClose() }}>Save</Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>Close</Button>
        )}
      </Card.Footer>
    </Modal>
  )
}
