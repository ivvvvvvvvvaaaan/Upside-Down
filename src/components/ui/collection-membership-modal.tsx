'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Modal } from './modal'
import { Card } from './card'
import { Button } from './button'
import { Input } from './input'
import { Select } from './select'
import { usePersona, useUserCollections } from '@/hooks'
import type { Asset } from '@/lib/data'

const PLACEHOLDER_IMAGE = '/assets/Asset-empty-img.png'

interface CollectionMembershipModalProps {
  open: boolean
  onClose: () => void
  selectedAssets: Asset[]
  onComplete?: () => void
}

type Mode = 'existing' | 'new'

export function CollectionMembershipModal({
  open,
  onClose,
  selectedAssets,
  onComplete,
}: CollectionMembershipModalProps) {
  const { activePersona } = usePersona()
  const { collections, createCollection, addAssetsToCollection } = useUserCollections()
  const [mode, setMode] = useState<Mode>('existing')
  const [collectionId, setCollectionId] = useState('')
  const [name, setName] = useState('')

  const editableCollections = useMemo(() => {
    if (!activePersona) return collections
    return collections.filter((collection) => !collection.createdBy || collection.createdBy === activePersona.email)
  }, [collections, activePersona])

  useEffect(() => {
    if (!open) return
    const nextMode: Mode = editableCollections.length > 0 ? 'existing' : 'new'
    setMode(nextMode)
    setCollectionId(editableCollections[0]?.id ?? '')
    setName('')
  }, [open, editableCollections])

  const collectionOptions = useMemo(() => editableCollections.map((collection) => ({
    value: collection.id,
    label: collection.name,
  })), [editableCollections])

  const handleSubmit = () => {
    const assetIds = selectedAssets.map((asset) => asset.id)
    if (assetIds.length === 0) return

    if (mode === 'existing') {
      if (!collectionId) return
      addAssetsToCollection(collectionId, assetIds)
    } else {
      if (!name.trim()) return
      createCollection(name.trim(), assetIds)
    }

    onComplete?.()
    onClose()
  }

  return (
    <Modal open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()} width={420}>
      <Modal.Header title="Add to Collection" />
      <Modal.Body>
        <div className="space-y-4">
          {editableCollections.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant={mode === 'existing' ? 'primary' : 'secondary'}
                compact
                onClick={() => setMode('existing')}
              >
                Add to existing
              </Button>
              <Button
                variant={mode === 'new' ? 'primary' : 'secondary'}
                compact
                onClick={() => setMode('new')}
              >
                New collection
              </Button>
            </div>
          )}

          {mode === 'existing' ? (
            <Select
              label="Collection"
              options={collectionOptions}
              value={collectionId}
              onChange={(value) => setCollectionId(value)}
            />
          ) : (
            <Input
              label="Name"
              placeholder="Enter collection name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && handleSubmit()}
              autoComplete="off"
              data-1p-ignore
            />
          )}

          <div className="space-y-2">
            <p className="text-label-1-bold text-foreground-subtle">
              {selectedAssets.length} item{selectedAssets.length === 1 ? '' : 's'}
            </p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {selectedAssets.map((asset) => (
                <div key={asset.id} className="relative w-12 h-9 rounded overflow-hidden bg-surface-2 flex-shrink-0">
                  <Image
                    src={asset.thumbnail || PLACEHOLDER_IMAGE}
                    alt={asset.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal.Body>
      <Card.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={
            selectedAssets.length === 0 ||
            (mode === 'existing' ? !collectionId : !name.trim())
          }
        >
          {mode === 'existing' ? 'Add' : 'Create'}
        </Button>
      </Card.Footer>
    </Modal>
  )
}
