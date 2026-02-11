'use client'

import { useState } from 'react'
import { Modal } from './modal'
import { Input } from './input'
import { Button } from './button'
import { FolderPlus } from 'lucide-react'

interface NewCollectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  onCreateCollection: (name: string) => void
}

export function NewCollectionModal({
  open,
  onOpenChange,
  selectedCount,
  onCreateCollection,
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
    <Modal open={open} onOpenChange={onOpenChange} size="md">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <FolderPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-body-1-bold text-foreground">New Collection</h2>
            <p className="text-label-1-regular text-foreground-subtle">
              {selectedCount} asset{selectedCount !== 1 ? 's' : ''} selected
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="mb-4">
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
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={!collectionName.trim()}
          >
            Create Collection
          </Button>
        </div>
      </div>
    </Modal>
  )
}
