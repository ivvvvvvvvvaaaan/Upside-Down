'use client'

import { useState, useEffect } from 'react'
import { Modal } from './modal'
import { Card } from './card'
import { Input } from './input'
import { Button } from './button'

interface NewFolderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string) => void
}

export function NewFolderModal({ open, onOpenChange, onCreate }: NewFolderModalProps) {
  const [name, setName] = useState('')

  // Reset name when modal closes
  useEffect(() => {
    if (!open) setName('')
  }, [open])

  const canCreate = name.trim().length > 0

  const handleCreate = () => {
    if (!canCreate) return
    onCreate(name.trim())
    onOpenChange(false)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="xs">
      <Modal.Header title="New folder" />
      <Card.Body>
        <Input
          label="Folder name"
          placeholder="Untitled Folder"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canCreate) handleCreate()
          }}
          autoComplete="off"
          data-1p-ignore
          autoFocus
        />
      </Card.Body>
      <Card.Footer>
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleCreate} disabled={!canCreate}>
          Create
        </Button>
      </Card.Footer>
    </Modal>
  )
}
