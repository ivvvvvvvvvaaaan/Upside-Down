'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Info, ChevronLeft } from 'lucide-react'
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
  onCreateCollection: (name: string) => void
  onCreateSmartCollection?: (name: string, filter: AssetFilter) => void
  selectedAssets?: Asset[]
}

export function NewCollectionModal({
  open,
  onOpenChange,
  onCreateCollection,
  onCreateSmartCollection,
  selectedAssets = [],
}: NewCollectionModalProps) {
  const hasSelectedAssets = selectedAssets.length > 0

  const [step, setStep] = useState<0 | 1>(hasSelectedAssets ? 1 : 0)
  const [collectionType, setCollectionType] = useState<CollectionType | null>(hasSelectedAssets ? 'manual' : null)
  const [name, setName] = useState('')

  // Track animation direction: 1 = forward, -1 = backward
  const [direction, setDirection] = useState<1 | -1>(1)
  // Track whether we've started animating (to avoid initial animation)
  const [ready, setReady] = useState(false)

  const canCreateSmart = !!onCreateSmartCollection
  const isManual = collectionType === 'manual'
  const canCreate = name.trim().length > 0 && collectionType !== null && (isManual || canCreateSmart)

  // Refs for measuring step content heights
  const step0Ref = useRef<HTMLDivElement>(null)
  const step1Ref = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined)

  // Measure height of current step
  const measureHeight = useCallback(() => {
    const ref = step === 0 ? step0Ref : step1Ref
    if (ref.current) {
      setContainerHeight(ref.current.scrollHeight)
    }
  }, [step])

  useEffect(() => {
    measureHeight()
  }, [measureHeight, step, selectedAssets.length, collectionType])

  // Focus name input when arriving at step 1
  const nameInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (step === 1 && ready) {
      // Delay to let the slide animation start before focusing
      const timer = setTimeout(() => nameInputRef.current?.focus(), 150)
      return () => clearTimeout(timer)
    }
  }, [step, ready])

  const resetAndClose = () => {
    setName('')
    setStep(hasSelectedAssets ? 1 : 0)
    setCollectionType(hasSelectedAssets ? 'manual' : null)
    setReady(false)
    onOpenChange(false)
  }

  const handleTypeSelect = (type: CollectionType) => {
    setCollectionType(type)
    setDirection(1)
    setReady(true)
    setStep(1)
  }

  const handleBack = () => {
    setDirection(-1)
    setReady(true)
    setStep(0)
  }

  const handleCreate = () => {
    if (!name.trim()) return

    if (collectionType === 'smart' && onCreateSmartCollection) {
      onCreateSmartCollection(name.trim(), {})
    } else {
      onCreateCollection(name.trim())
    }
    resetAndClose()
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setStep(hasSelectedAssets ? 1 : 0)
      setCollectionType(hasSelectedAssets ? 'manual' : null)
      setName('')
      setReady(false)
    }
    onOpenChange(isOpen)
  }

  // Slide transform based on step and direction
  const slideOffset = step === 0 ? '0%' : '-100%'

  return (
    <Modal open={open} onOpenChange={handleOpenChange} width={420}>
      {/* Animated body - clips overflow for slide effect */}
      <div className="overflow-hidden">
        <div
          className="transition-[height] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
          style={{ height: containerHeight ? `${containerHeight}px` : 'auto' }}
        >
          <div
            className={cn(
              'flex',
              ready && 'transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]'
            )}
            style={{ transform: `translateX(${slideOffset})` }}
          >
            {/* Step 0: Type selection */}
            <div className="w-full flex-shrink-0" ref={step0Ref}>
              <div className="p-6 flex flex-col gap-4">
                <p className="text-body-2-bold text-foreground">
                  New Collection
                </p>
                <p className="text-body-0-regular text-foreground-subtle">
                  What kind of collection?
                </p>

                <div className="flex flex-col gap-2">
                  <TypeOption
                    selected={collectionType === 'manual'}
                    title="Manual collection"
                    description="Curate assets by hand"
                    onClick={() => handleTypeSelect('manual')}
                  />
                  <TypeOption
                    selected={collectionType === 'smart'}
                    title="Smart collection"
                    description="Auto-populate with filter rules"
                    onClick={() => handleTypeSelect('smart')}
                  />
                </div>
              </div>
            </div>

            {/* Step 1: Name & details */}
            <div className="w-full flex-shrink-0" ref={step1Ref}>
              <div className="p-6 flex flex-col gap-4">
                {/* Header with back button */}
                <div className="flex items-center gap-2">
                  {!hasSelectedAssets && (
                    <Button variant="icon" compact onClick={handleBack} aria-label="Back">
                      <ChevronLeft />
                    </Button>
                  )}
                  <p className="text-body-2-bold text-foreground">
                    {isManual ? 'Manual collection' : 'Smart collection'}
                  </p>
                </div>

                {/* Name input */}
                <Input
                  ref={nameInputRef}
                  label="Name"
                  placeholder="Enter collection name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canCreate) handleCreate()
                  }}
                  autoComplete="off"
                  data-1p-ignore
                  autoFocus={hasSelectedAssets}
                />

                {/* Manual: selected assets preview */}
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

                {/* Manual: no assets info */}
                {isManual && selectedAssets.length === 0 && (
                  <p className="text-label-1-regular text-foreground-dim">
                    You can add assets to this collection later.
                  </p>
                )}

                {/* Smart: info message */}
                {!isManual && (
                  <div className="flex items-start gap-2 text-foreground-dim">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="text-label-1-regular">
                      You can add filter rules after creating the collection.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with animated button transitions */}
      <Card.Footer>
        {step === 0 ? (
          <Button variant="secondary" onClick={resetAndClose}>
            Cancel
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={hasSelectedAssets ? resetAndClose : handleBack}>
              {hasSelectedAssets ? 'Cancel' : 'Back'}
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={!canCreate}
            >
              Create
            </Button>
          </>
        )}
      </Card.Footer>
    </Modal>
  )
}

function TypeOption({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded cursor-pointer text-left',
        'transition-all duration-200',
        selected
          ? 'bg-primary/5'
          : 'hover:bg-surface-highlight'
      )}
    >
      {/* Radio dot */}
      <div
        className={cn(
          'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors duration-200',
          selected ? 'border-primary' : 'border-border-subtle'
        )}
      >
        <div
          className={cn(
            'w-2 h-2 rounded-full bg-primary transition-transform duration-200',
            selected ? 'scale-100' : 'scale-0'
          )}
        />
      </div>

      <div className="flex flex-col">
        <span className="text-body-1-bold text-foreground">{title}</span>
        <span className="text-label-1-regular text-foreground-dim">{description}</span>
      </div>
    </button>
  )
}
