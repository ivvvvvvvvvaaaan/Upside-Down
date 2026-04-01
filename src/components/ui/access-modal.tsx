'use client'

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
  inheritedGrants,
  title,
}: AccessModalProps) {
  const kindLabel = resourceRef ? KIND_LABELS[resourceRef.type] ?? '' : ''
  const heading = title ? `Share ${title} ${kindLabel}`.trim() : 'Share'

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()} size="sm">
      <Modal.Header title={heading} />
      <Modal.Body>
        <AccessPanel
          resourceId={resourceId}
          resourceRef={resourceRef}
          inheritedGrants={inheritedGrants}
        />
      </Modal.Body>
      <Card.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Card.Footer>
    </Modal>
  )
}
