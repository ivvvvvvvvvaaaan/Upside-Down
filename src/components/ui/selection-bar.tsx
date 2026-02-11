'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { NewCollectionModal } from './new-collection-modal'
import type { Asset } from '@/lib/data'

interface SelectionBarProps {
  selectedCount: number
  selectedAssets?: Asset[]
  onClear: () => void
  onCreateCollection?: (name: string) => void
  onShare?: () => void
  className?: string
}

export function SelectionBar({
  selectedCount,
  selectedAssets = [],
  onClear,
  onCreateCollection,
  onShare,
  className,
}: SelectionBarProps) {
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false)

  if (selectedCount === 0) return null

  const handleCreateCollection = (name: string) => {
    if (onCreateCollection) {
      onCreateCollection(name)
    } else {
      console.log('Create collection:', name, 'with assets')
    }
  }

  return (
    <>
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg pointer-events-auto',
            'bg-indigo-600 text-white shadow-high',
            'animate-in slide-in-from-bottom-4 fade-in duration-200',
            className
          )}
        >
          {/* Selection count */}
          <div className="flex items-center gap-2">
            <span className="text-body-1-bold">
              {selectedCount} selected
            </span>
            <button
              onClick={onClear}
              className="p-1 rounded hover:bg-white/20 transition-colors"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/30" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="tertiary"
              compact
              icon={<Image src="/Icons/Icon-new.svg" alt="" width={16} height={16} />}
              onClick={() => setShowNewCollectionModal(true)}
              className="text-white hover:bg-white/20 hover:text-white"
            >
              Add to Collection
            </Button>
            <Button
              variant="tertiary"
              compact
              icon={<Image src="/Icons/Icons-share.svg" alt="" width={16} height={16} />}
              onClick={onShare}
              className="text-white hover:bg-white/20 hover:text-white"
            >
              Share
            </Button>
          </div>
        </div>
      </div>

      <NewCollectionModal
        open={showNewCollectionModal}
        onOpenChange={setShowNewCollectionModal}
        onCreateCollection={handleCreateCollection}
        selectedAssets={selectedAssets}
      />
    </>
  )
}
