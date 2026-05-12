'use client'

import { cn, pluralize } from '@/lib/utils'
import { Tooltip } from './tooltip'
import { MapPin } from 'lucide-react'
import type { NarrativeLocationMeta } from '@/lib/ontology-meta'

/**
 * Bespoke card for narrative location collections. A location is a SHARED
 * backdrop — its identity is partly defined by the variety of scenes shot
 * there. So this card uses a multi-angle layout: primary establishing still
 * on top, a small horizontal strip of scene thumbnails below proving the
 * location is reused across moments of the story. INT/EXT badge in the
 * corner matches the script slug-line convention.
 */

export type LocationCardSize = 'sm' | 'md' | 'lg'

interface SizeConfig {
  /** primary thumbnail aspect */
  thumb: string
  /** number of scene thumbnails shown in the strip below the primary */
  sceneStripCount: number
  /** whether to render the scene strip at all (hidden for small cards) */
  showSceneStrip: boolean
  name: string
  meta: string
}

const SIZE_CONFIG: Record<LocationCardSize, SizeConfig> = {
  lg: {
    thumb: 'aspect-video',
    sceneStripCount: 3,
    showSceneStrip: true,
    name: 'text-body-1-bold',
    // Match CollectionCard's metadata text size for folders ("31 items") so
    // counts read consistently across surfaces.
    meta: 'text-label-1-regular',
  },
  md: {
    thumb: 'aspect-video',
    sceneStripCount: 3,
    showSceneStrip: true,
    name: 'text-body-0-bold',
    meta: 'text-label-1-regular',
  },
  sm: {
    thumb: 'aspect-video',
    sceneStripCount: 3,
    showSceneStrip: false,
    name: 'text-body-0-regular',
    meta: 'text-label-1-regular',
  },
}

const SETTING_LABEL: Record<NarrativeLocationMeta['setting'], string> = {
  interior: 'INT',
  exterior: 'EXT',
  mixed: 'INT/EXT',
}

export interface LocationScene {
  name: string
  image?: string
}

export interface LocationCardProps {
  name: string
  mainImage?: string
  assetCount: number
  meta?: NarrativeLocationMeta
  /** Scenes that take place at this location — drives the scene strip below
   *  the primary image. Aggregated from AI tags by the consumer. */
  scenes?: LocationScene[]
  size?: LocationCardSize
  isSelected?: boolean
  primary?: boolean
  onClick?: (event: React.MouseEvent) => void
  onDoubleClick?: (event: React.MouseEvent) => void
}

export function LocationCard({
  name,
  mainImage,
  assetCount,
  meta,
  scenes,
  size = 'md',
  isSelected = false,
  primary = false,
  onClick,
  onDoubleClick,
}: LocationCardProps) {
  const config = SIZE_CONFIG[size]
  const settingLabel = meta ? SETTING_LABEL[meta.setting] : undefined
  const sceneStrip = (scenes ?? []).slice(0, config.sceneStripCount)
  const sceneOverflow = (scenes?.length ?? 0) - sceneStrip.length
  const episodeCount = meta?.episodes.length ?? 0

  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        // Always-on hairline border at 20% (border-dim) + ring layered on top
        // for the primary selection. Brighter than the 4% elevation default so
        // unselected cards still read as cards on dark backgrounds.
        'group relative flex flex-col text-left rounded overflow-hidden transition-colors',
        'border',
        'focus:outline-none',
        isSelected ? 'border-border-selected' : 'border-border-inverse-subtle bg-surface-flat',
        primary && 'ring-2 ring-border-selected',
      )}
    >
      {isSelected && (
        <>
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{ background: 'linear-gradient(to bottom right, rgb(var(--surface-selected)), rgb(var(--surface-selected-hover)))' }}
          />
          <div
            className="absolute inset-0 pointer-events-none z-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgb(var(--surface-selected-hover) / 0.3)' }}
          />
        </>
      )}
      {/* Primary establishing still — full-bleed at the top. */}
      <div className={cn('relative z-10 w-full bg-surface-low overflow-hidden', config.thumb)}>
        {mainImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mainImage} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground-dim">
            <MapPin className="w-8 h-8" />
          </div>
        )}
        {/* INT / EXT / INT/EXT badge — same style as scene page-range pill,
            so the script convention reads consistently across surfaces. */}
        {settingLabel && (
          <div className="absolute bottom-2 right-2 px-1 bg-black/60 rounded flex items-center">
            <span className="text-label-0-bold text-white leading-none">{settingLabel}</span>
          </div>
        )}
      </div>

      {/* Scene strip — the "shared backdrop" signal. Each tile is a scene
          shot at this location, proving the location is reused. Only rendered
          when there are 2+ scenes — a single tile doesn't communicate "stack"
          and just looks like another orphan image. */}
      {config.showSceneStrip && sceneStrip.length >= 2 && (
        <div className="relative z-10 grid grid-flow-col auto-cols-fr gap-px bg-border-dim">
          {sceneStrip.map((scene) => (
            <Tooltip key={scene.name} label={scene.name}>
              <div className="aspect-video bg-surface-low overflow-hidden">
                {scene.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={scene.image} alt={scene.name} className="w-full h-full object-cover" />
                ) : null}
              </div>
            </Tooltip>
          ))}
        </div>
      )}

      {/* Footer — location name, episode count, scene count.
          mt-auto pushes it to the bottom of the card so rows of cards align
          even when the scene strip is absent. */}
      <div className="relative z-10 flex flex-col gap-1 p-3 mt-auto">
        <p className={cn('truncate text-foreground group-hover:text-foreground-system-link transition-colors', config.name)}>
          {name}
        </p>
        <p className={cn('text-foreground-dim', config.meta)}>
          {episodeCount > 0 && (
            <>
              {pluralize(episodeCount, 'episode')}
              {scenes && scenes.length > 0 && ' · '}
            </>
          )}
          {scenes && scenes.length > 0 && (
            <>
              {pluralize(scenes.length, 'scene')}
              {sceneOverflow > 0 && ` (+${sceneOverflow} more)`}
            </>
          )}
          {(!episodeCount && !scenes?.length) && pluralize(assetCount, 'asset')}
        </p>
      </div>
    </button>
  )
}
