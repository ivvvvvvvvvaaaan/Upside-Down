'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Modal } from './modal'
import { Card } from './card'
import { Input } from './input'
import { Button } from './button'
import { Tooltip } from './tooltip'
import type { Asset } from '@/lib/data'

const PLACEHOLDER_IMAGE = '/assets/Asset-empty-img.png'

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
    <Modal open={open} onOpenChange={onOpenChange} width={420}>
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
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {selectedAssets.map((asset) => {
                  const typeTag = asset.type === 'shot' ? 'Shot'
                    : asset.type === 'video' ? (asset.videoMeta?.typeTag || 'Video')
                    : asset.type === 'image' ? (asset.imageMeta?.typeTag || 'Image')
                    : (asset.textMeta?.typeTag || 'Document')

                  return (
                    <Tooltip key={asset.id} label={asset.name} description={typeTag}>
                      <div className="relative w-16 h-12 rounded overflow-hidden bg-surface-2 flex-shrink-0">
                        <Image
                          src={asset.thumbnail || PLACEHOLDER_IMAGE}
                          alt={asset.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Tooltip>
                  )
                })}
              </div>
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
