'use client'

import { cn, getInitials, pluralize } from '@/lib/utils'
import { Sun, Moon, CloudSun } from 'lucide-react'
import { Tag } from './tag'
import { Tooltip } from './tooltip'
import type { NarrativeSceneMeta } from '@/lib/ontology-meta'

/**
 * Pick an icon to accompany a free-form time-of-day string ("Day", "Night",
 * "Sunset", etc.). Used by scene cards and the scene hero so the same icon
 * appears across both surfaces.
 */
export function getTimeOfDayIcon(timeOfDay: string, className?: string) {
  const cls = className ?? 'w-3 h-3'
  const lower = timeOfDay.toLowerCase()
  if (lower.includes('night') || lower.includes('evening')) return <Moon className={cls} />
  if (lower.includes('dawn') || lower.includes('dusk') || lower.includes('sunset') || lower.includes('sunrise')) return <CloudSun className={cls} />
  return <Sun className={cls} />
}

/**
 * Bespoke card for narrative scene collections — designed to read like a
 * script page rather than a generic data row. Slugline-style title (mono-
 * spaced uppercase), page range, and a paragraph preview of the scene's
 * description give it the feel of glancing at the actual script.
 *
 * Three sizes track the casting list's hierarchy: lg / md / sm.
 */

export type SceneScriptCardSize = 'sm' | 'md' | 'lg'

interface SizeConfig {
  /** thumbnail aspect + height */
  thumb: string
  slug: string
  pageRange: string
  description: string
  showDescription: boolean
  showChips: boolean
  maxDescriptionLines: 2 | 3
}

const SIZE_CONFIG: Record<SceneScriptCardSize, SizeConfig> = {
  lg: {
    thumb: 'aspect-video',
    slug: 'text-heading-3 uppercase',
    pageRange: 'text-label-0-regular text-foreground-dim',
    description: 'text-body-1-regular text-foreground',
    showDescription: true,
    showChips: true,
    maxDescriptionLines: 3,
  },
  md: {
    thumb: 'aspect-video',
    slug: 'text-body-1-bold uppercase',
    pageRange: 'text-label-0-regular text-foreground-dim',
    description: 'text-body-0-regular text-foreground-dim',
    showDescription: true,
    showChips: true,
    maxDescriptionLines: 2,
  },
  sm: {
    thumb: 'aspect-video',
    slug: 'text-body-0-bold uppercase',
    pageRange: 'text-label-0-regular text-foreground-dim',
    description: 'text-label-0-regular text-foreground-dim',
    showDescription: false,
    showChips: false,
    maxDescriptionLines: 2,
  },
}

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

/**
 * Tall portrait card for a character in the scene's casting row. Vertical
 * orientation (3:4 aspect) reads as a casting/credits card rather than a
 * generic avatar chip — fits the "index card with cast list" metaphor.
 */
function CharacterMiniCard({ character }: { character: SceneCharacter }) {
  return (
    <Tooltip label={character.name}>
      <div className="flex flex-col gap-1 w-9 flex-shrink-0">
        <div className="relative h-12 rounded overflow-hidden bg-surface-selected-subtle">
          {character.avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={character.avatarSrc} alt={character.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-label-0-bold text-foreground-dim">
              {getInitials(character.name, 1)}
            </div>
          )}
          {/* Light semi-transparent border overlay on the photo, matching the
              casting-card portrait treatment. */}
          <div className="pointer-events-none absolute inset-0 rounded border border-white/20" />
        </div>
        <span className="text-label-0-regular text-foreground-dim truncate text-center w-full">
          {getFirstName(character.name)}
        </span>
      </div>
    </Tooltip>
  )
}

export interface SceneCharacter {
  name: string
  avatarSrc?: string
}

export interface SceneScriptCardProps {
  name: string
  mainImage?: string
  assetCount: number
  meta?: NarrativeSceneMeta
  /**
   * Characters that appear in this scene, derived from AI tags on the
   * assets associated with it. Drives the character avatar row at the
   * bottom of the card. Pass at most 4–5 for visual scanability; we
   * truncate the rest with an "+N" badge.
   */
  characters?: SceneCharacter[]
  size?: SceneScriptCardSize
  isSelected?: boolean
  primary?: boolean
  onClick?: (event: React.MouseEvent) => void
  onDoubleClick?: (event: React.MouseEvent) => void
}

export function SceneScriptCard({
  name,
  mainImage,
  assetCount,
  meta,
  characters,
  size = 'md',
  isSelected = false,
  primary = false,
  onClick,
  onDoubleClick,
}: SceneScriptCardProps) {
  const config = SIZE_CONFIG[size]
  const description = meta?.description
  const truncationClass = config.maxDescriptionLines === 3
    ? 'line-clamp-3'
    : 'line-clamp-2'
  // Cap the character row to keep cards scannable; the rest collapse into a +N.
  const visibleCharacters = (characters ?? []).slice(0, 4)
  const overflow = (characters?.length ?? 0) - visibleCharacters.length

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
      {/* Visual still — full-bleed at the top of the card. */}
      <div className={cn('relative z-10 w-full bg-surface-low overflow-hidden', config.thumb)}>
        {mainImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mainImage} alt={name} className="w-full h-full object-cover" />
        ) : null}
        {/* Page-range badge — styled to match the duration/timecode overlay
            on AssetCard so the script reference reads as the same kind of
            "where in the runtime" hint. Bottom-right, small black pill. */}
        {meta?.pageRange && (
          <div className="absolute bottom-2 right-2 px-1 bg-black/60 rounded flex items-center">
            <span className="text-label-0-bold text-white leading-none">{meta.pageRange}</span>
          </div>
        )}
      </div>

      {/* Script body — slugline + paragraph preview, padded like a page margin. */}
      <div className="relative z-10 flex flex-col gap-2 p-4">
        <p className={cn('truncate text-foreground group-hover:text-foreground-system-link transition-colors', config.slug)}>
          {name}
        </p>
        {config.showChips && meta && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag variant="border">{meta.episode}</Tag>
            {meta.timeOfDay && (
              <Tag variant="glass">
                <span className="inline-flex items-center gap-1">
                  {getTimeOfDayIcon(meta.timeOfDay)}
                  {meta.timeOfDay}
                </span>
              </Tag>
            )}
          </div>
        )}
        {config.showDescription && description && (
          <p className={cn(config.description, truncationClass)}>
            {description}
          </p>
        )}
        <p className="text-label-1-regular text-foreground-subtle mt-1">
          {pluralize(assetCount, 'asset')}
        </p>
        {/* Character row — the "casting" footer. Tall portrait cards (3:4)
            with first-name labels. Labelled "Cast" so the row reads as its
            own section, not as a list of the assets above. Hidden at sm
            size to keep small cards compact. */}
        {size !== 'sm' && visibleCharacters.length > 0 && (
          <div className="flex flex-col gap-1 mt-2">
            <p className="text-label-1-regular text-foreground-dim">Characters</p>
            <div className="flex items-start gap-2">
              {visibleCharacters.map((c) => (
                <CharacterMiniCard key={c.name} character={c} />
              ))}
              {overflow > 0 && (
                <span className="text-label-0-regular text-foreground-dim self-center">+{overflow}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </button>
  )
}
