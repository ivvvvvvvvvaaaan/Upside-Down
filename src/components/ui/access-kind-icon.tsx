'use client'

import { FileText, Film, Folder, Layers } from 'lucide-react'
import type { AccessEntryKind } from '@/lib/access'

interface AccessKindIconProps {
  kind: AccessEntryKind
  size?: 'sm' | 'md'
}

const SIZE_CLASS = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
} as const

export function AccessKindIcon({ kind, size = 'sm' }: AccessKindIconProps) {
  const className = `${SIZE_CLASS[size]} text-foreground-dim flex-shrink-0`

  if (kind === 'folder') return <Folder className={className} />
  if (kind === 'collection' || kind === 'smart-collection') return <Layers className={className} />
  if (kind === 'cut') return <Film className={className} />
  return <FileText className={className} />
}
