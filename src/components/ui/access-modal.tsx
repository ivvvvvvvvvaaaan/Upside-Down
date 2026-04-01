'use client'

import { X } from 'lucide-react'
import { Modal } from './modal'
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

export function AccessModal({
  open,
  onClose,
  resourceId,
  resourceRef,
  inheritedGrants,
  title,
}: AccessModalProps) {
  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()} size="sm">
      <div className="flex items-center justify-between p-4 border-b border-border-dim">
        <span className="text-body-1-bold text-foreground">
          {title ? `Access — ${title}` : 'Access'}
        </span>
        <Button variant="icon" compact onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-4 max-h-[60vh] overflow-y-auto">
        <AccessPanel
          resourceId={resourceId}
          resourceRef={resourceRef}
          inheritedGrants={inheritedGrants}
        />
      </div>
    </Modal>
  )
}
