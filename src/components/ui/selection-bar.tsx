'use client'

import { X, FolderPlus, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface SelectionBarProps {
  selectedCount: number
  onClear: () => void
  onAddToCollection?: () => void
  onShare?: () => void
  className?: string
}

export function SelectionBar({
  selectedCount,
  onClear,
  onAddToCollection,
  onShare,
  className,
}: SelectionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 px-4 py-3 rounded-lg',
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
          icon={<FolderPlus className="w-4 h-4" />}
          onClick={onAddToCollection}
          className="text-white hover:bg-white/20 hover:text-white"
        >
          Add to Collection
        </Button>
        <Button
          variant="tertiary"
          compact
          icon={<Share2 className="w-4 h-4" />}
          onClick={onShare}
          className="text-white hover:bg-white/20 hover:text-white"
        >
          Share
        </Button>
      </div>
    </div>
  )
}
