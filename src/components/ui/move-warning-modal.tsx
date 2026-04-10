'use client'

import { AlertTriangle } from 'lucide-react'
import { Modal } from './modal'
import { Button } from './button'

export interface MoveWarningModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  fileName: string
  impactedCollections: { id: string; name: string; grantCount: number }[]
}

export function MoveWarningModal({
  open,
  onClose,
  onConfirm,
  fileName,
  impactedCollections,
}: MoveWarningModalProps) {
  const totalPeople = impactedCollections.reduce((sum, c) => sum + c.grantCount, 0)

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) onClose() }} size="xs">
      <Modal.Header
        title="Move will affect shared collections"
        onClose={onClose}
      />
      <Modal.Body>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-body-1-regular text-foreground">
              Moving <span className="text-body-1-bold">{fileName}</span> will remove it from{' '}
              {impactedCollections.length} shared {impactedCollections.length === 1 ? 'collection' : 'collections'}.{' '}
              {totalPeople} {totalPeople === 1 ? 'person' : 'people'} may lose access.
            </p>
          </div>

          <div className="space-y-1">
            {impactedCollections.map((collection) => (
              <div
                key={collection.id}
                className="flex items-center justify-between px-3 py-2 rounded bg-surface-mid"
              >
                <span className="text-body-0-regular text-foreground truncate">{collection.name}</span>
                <span className="text-label-0-regular text-foreground-subtle flex-shrink-0">
                  {collection.grantCount} {collection.grantCount === 1 ? 'share' : 'shares'}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              Move anyway
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  )
}
