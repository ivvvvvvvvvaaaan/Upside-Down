'use client'

import { useState } from 'react'
import { Modal } from './modal'
import { Card } from './card'
import { Input } from './input'
import { Button } from './button'
import type { Asset } from '@/lib/data'

interface NewCollectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateCollection: (name: string) => void
  selectedAssets?: Asset[]
}

export function NewCollectionModal({
  open,
  onOpenChange,
  onCreateCollection,
  selectedAssets = [],
}: NewCollectionModalProps) {
  const [collectionName, setCollectionName] = useState('')

  const handleCreate = () => {
    if (collectionName.trim()) {
      onCreateCollection(collectionName.trim())
      setCollectionName('')
      onOpenChange(false)
    }
  }

  const handleClose = () => {
    setCollectionName('')
    onOpenChange(false)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="sm">
      <Card.Body>
        <div className="flex flex-col gap-6">
          <p className="text-body-2-bold text-foreground">
            Create new collection
          </p>

          <Input
            label="Collection name"
            placeholder="Enter collection name"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
            autoFocus
          />

          {selectedAssets.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-label-1-bold text-foreground-subtle">
                {selectedAssets.length} item{selectedAssets.length !== 1 ? 's' : ''} to add
              </p>
              <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                {selectedAssets.map((asset) => (
                  <li
                    key={asset.id}
                    className="text-body-0-regular text-foreground truncate"
                  >
                    {asset.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card.Body>

      <Card.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleCreate}
          disabled={!collectionName.trim()}
        >
          Create
        </Button>
      </Card.Footer>
    </Modal>
  )
}
