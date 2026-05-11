'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Music, FileText, FileCode, Subtitles } from 'lucide-react'
import { pick, IMAGE_POOL } from '@/lib/images'
import type { Asset, MediaAssetType } from '@/lib/data'

/**
 * Display label for each Media Asset Type — surfaces the work-product
 * classification from the asset-taxonomy spec next to file thumbnails.
 */
const MEDIA_ASSET_TYPE_LABELS: Record<MediaAssetType, string> = {
  // Editorial / picture
  'editorial-cut': 'Editorial Cut',
  'textless-master': 'Textless Master',
  'cut': 'Cut',
  'reel': 'Reel',
  // Footage
  'camera-clip': 'Camera Clip',
  'dailies-proxy': 'Dailies Proxy',
  'proxy': 'Proxy',
  // Audio
  'audio-clip': 'Audio Clip',
  'adr': 'ADR',
  'foley': 'Foley',
  'score': 'Score',
  'sound-mix': 'Sound Mix',
  // Art / pre-production
  'concept-art': 'Concept Art',
  'storyboard': 'Storyboard',
  'reference-image': 'Reference',
  'production-photo': 'Production Photo',
  'lookbook': 'Lookbook',
  // VFX
  'vfx-plate': 'VFX Plate',
  'vfx-comp': 'VFX Comp',
  // Side-cars
  'edl': 'EDL',
  'closed-captions': 'Captions',
  'project-file': 'Project File',
  'document': 'Document',
}

export function getMediaAssetTypeLabel(asset: Asset): string | undefined {
  if (!asset.mediaAssetType) return undefined
  const base = MEDIA_ASSET_TYPE_LABELS[asset.mediaAssetType]
  if (!base) return undefined
  // Sound mixes carry their channel layout on audioMeta.typeTag — surface it.
  if (asset.mediaAssetType === 'sound-mix' && asset.audioMeta?.typeTag) {
    return `${base} · ${asset.audioMeta.typeTag}`
  }
  return base
}

/**
 * Pick the right preview for a Media Asset based on its type. Image-typed assets
 * use their thumbnail; audio uses a music icon; side-car formats (EDL, captions,
 * project files, docs) use a document icon so they're not visually confused with
 * playable picture.
 */
export function AssetThumbnailMedia({ asset }: { asset: Asset }) {
  const t = asset.mediaAssetType
  const isCaptions = t === 'closed-captions'
  const isCodeDoc = t === 'edl' || t === 'project-file'
  const isPlainDoc = t === 'document'
  const isAudio = asset.type === 'audio' || t === 'audio-clip' || t === 'adr' || t === 'foley' || t === 'score' || t === 'sound-mix'

  if (isCaptions || isCodeDoc || isPlainDoc) {
    const Icon = isCaptions ? Subtitles : isCodeDoc ? FileCode : FileText
    return (
      <div className="flex items-center justify-center h-full gap-1 bg-surface-low">
        <Icon className="w-5 h-5 text-foreground-dim" />
        {asset.extension && (
          <span className="text-label-0-bold text-foreground-dim uppercase">{asset.extension}</span>
        )}
      </div>
    )
  }

  if (isAudio) {
    return (
      <div className="flex items-center justify-center h-full bg-surface-low">
        <Music className="w-6 h-6 text-foreground-dim" />
      </div>
    )
  }

  const thumbnail = asset.thumbnail ?? pick(IMAGE_POOL, asset.id, 1)[0]
  if (thumbnail) {
    return <Image src={thumbnail} alt={asset.name} fill sizes="110px" className="object-cover" />
  }
  return <div className="h-full bg-surface-low" />
}

/**
 * Compact card for a Media Asset — used in horizontal strips inside detail
 * panels. Shows a type-specific preview + filename + `mediaAssetType` label.
 */
export function AssetThumbnailCard({ asset, onClick }: { asset: Asset; onClick?: (asset: Asset) => void }) {
  const typeLabel = getMediaAssetTypeLabel(asset)
  const content = (
    <div className="shrink-0 w-[110px] rounded overflow-hidden border border-border-dim hover:border-border-subtle transition-colors relative group">
      <div className="h-16 relative bg-surface-2">
        <AssetThumbnailMedia asset={asset} />
      </div>
      <div className="px-1 py-1 flex flex-col gap-0.5">
        <span className="text-label-0-regular text-foreground truncate block group-hover:text-foreground-system-link transition-colors">
          {asset.name}
        </span>
        {typeLabel && (
          <span className="text-label-0-regular text-foreground-dim truncate block">
            {typeLabel}
          </span>
        )}
      </div>
    </div>
  )

  if (onClick) {
    return <button key={asset.id} onClick={() => onClick(asset)} className="text-left">{content}</button>
  }
  return <Link key={asset.id} href={`/nextgen/assets/${asset.id}`}>{content}</Link>
}
