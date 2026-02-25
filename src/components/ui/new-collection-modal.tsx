'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Folder, Sparkles, ArrowLeft } from 'lucide-react'
import { Modal } from './modal'
import { Card } from './card'
import { Input } from './input'
import { Button } from './button'
import { Tooltip } from './tooltip'
import { cn } from '@/lib/utils'
import type { Asset, AssetFilter } from '@/lib/data'

const PLACEHOLDER_IMAGE = '/assets/Asset-empty-img.png'

type CollectionType = 'manual' | 'smart'

interface NewCollectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called when creating a manual collection */
  onCreateCollection: (name: string) => void
  /** Called when creating a smart collection */
  onCreateSmartCollection?: (name: string, filter: AssetFilter) => void
  /** Pre-selected assets for manual collection */
  selectedAssets?: Asset[]
}

export function NewCollectionModal({
  open,
  onOpenChange,
  onCreateCollection,
  onCreateSmartCollection,
  selectedAssets = [],
}: NewCollectionModalProps) {
  // If assets are selected, go straight to manual form
  const hasSelectedAssets = selectedAssets.length > 0

  const [step, setStep] = useState<'choose' | 'form'>(hasSelectedAssets ? 'form' : 'choose')
  const [collectionType, setCollectionType] = useState<CollectionType>(hasSelectedAssets ? 'manual' : 'manual')

  // Form state
  const [name, setName] = useState('')

  const resetAndClose = () => {
    setName('')
    setStep(hasSelectedAssets ? 'form' : 'choose')
    setCollectionType(hasSelectedAssets ? 'manual' : 'manual')
    onOpenChange(false)
  }

  const handleTypeSelect = (type: CollectionType) => {
    setCollectionType(type)
    setStep('form')
  }

  const handleBack = () => {
    setStep('choose')
    setName('')
  }

  const handleCreate = () => {
    if (!name.trim()) return

    if (collectionType === 'smart' && onCreateSmartCollection) {
      // Create smart collection with empty filter (user will edit after)
      onCreateSmartCollection(name.trim(), {})
    } else {
      onCreateCollection(name.trim())
    }
    resetAndClose()
  }

  // Reset step when modal opens with different context
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setStep(hasSelectedAssets ? 'form' : 'choose')
      setCollectionType(hasSelectedAssets ? 'manual' : 'manual')
    }
    onOpenChange(isOpen)
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange} width={420}>
      {step === 'choose' ? (
        <TypeChoiceStep onSelect={handleTypeSelect} onCancel={resetAndClose} />
      ) : (
        <FormStep
          type={collectionType}
          name={name}
          selectedAssets={selectedAssets}
          onNameChange={setName}
          onBack={hasSelectedAssets ? undefined : handleBack}
          onCancel={resetAndClose}
          onCreate={handleCreate}
          canCreateSmart={!!onCreateSmartCollection}
        />
      )}
    </Modal>
  )
}

/**
 * Step 1: Choose collection type
 */
function TypeChoiceStep({
  onSelect,
  onCancel,
}: {
  onSelect: (type: CollectionType) => void
  onCancel: () => void
}) {
  return (
    <>
      <Card.Body>
        <div className="flex flex-col gap-4">
          <p className="text-body-2-bold text-foreground">
            Create new collection
          </p>
          <p className="text-body-0-regular text-foreground-subtle">
            Choose the type of collection to create
          </p>

          <div className="grid grid-cols-2 gap-3">
            <TypeCard
              icon={<Folder className="w-6 h-6" />}
              title="Manual"
              description="Add assets manually"
              onClick={() => onSelect('manual')}
            />
            <TypeCard
              icon={<Sparkles className="w-6 h-6" />}
              title="Smart"
              description="Auto-filter by rules"
              onClick={() => onSelect('smart')}
            />
          </div>
        </div>
      </Card.Body>
      <Card.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </Card.Footer>
    </>
  )
}

function TypeCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded border border-border-dim',
        'bg-surface-flat hover:bg-surface-highlight hover:border-border-subtle',
        'transition-colors text-center'
      )}
    >
      <div className="text-foreground-subtle">{icon}</div>
      <div>
        <p className="text-body-1-bold text-foreground">{title}</p>
        <p className="text-label-0-regular text-foreground-dim">{description}</p>
      </div>
    </button>
  )
}

/**
 * Step 2: Collection form
 */
function FormStep({
  type,
  name,
  selectedAssets,
  onNameChange,
  onBack,
  onCancel,
  onCreate,
  canCreateSmart,
}: {
  type: CollectionType
  name: string
  selectedAssets: Asset[]
  onNameChange: (name: string) => void
  onBack?: () => void
  onCancel: () => void
  onCreate: () => void
  canCreateSmart: boolean
}) {
  const isManual = type === 'manual'
  const canCreate = name.trim().length > 0 && (isManual || canCreateSmart)

  return (
    <>
      <Card.Body>
        <div className="flex flex-col gap-4">
          {/* Header with back button */}
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="icon" compact onClick={onBack} aria-label="Back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <p className="text-body-2-bold text-foreground">
              {isManual ? 'New manual collection' : 'New smart collection'}
            </p>
          </div>

          {/* Name input */}
          <Input
            label="Name"
            placeholder="Enter collection name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canCreate) onCreate()
            }}
            autoComplete="off"
            data-1p-ignore
            autoFocus
          />

          {/* Smart collection: info message */}
          {!isManual && (
            <p className="text-label-1-regular text-foreground-dim">
              You can add filter rules after creating the collection.
            </p>
          )}

          {/* Manual collection: show selected assets */}
          {isManual && selectedAssets.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-label-1-bold text-foreground-subtle">
                {selectedAssets.length} item{selectedAssets.length !== 1 ? 's' : ''} to add
              </p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {selectedAssets.map((asset) => {
                  const typeTag = asset.type === 'shot' ? 'Shot'
                    : asset.type === 'video' ? (asset.videoMeta?.typeTag || 'Video')
                    : asset.type === 'image' ? (asset.imageMeta?.typeTag || 'Image')
                    : (asset.textMeta?.typeTag || 'Document')

                  return (
                    <Tooltip key={asset.id} label={asset.name} description={typeTag}>
                      <div className="relative w-12 h-9 rounded overflow-hidden bg-surface-2 flex-shrink-0">
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

          {/* Manual collection with no assets: info message */}
          {isManual && selectedAssets.length === 0 && (
            <p className="text-label-1-regular text-foreground-dim">
              You can add assets to this collection later.
            </p>
          )}
        </div>
      </Card.Body>

      <Card.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onCreate}
          disabled={!canCreate}
        >
          Create
        </Button>
      </Card.Footer>
    </>
  )
}
