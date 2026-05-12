'use client'

import { cn, getInitials, pluralize } from '@/lib/utils'
import { Tag } from './tag'
import { CHARACTER_ROLE_LABEL } from '@/lib/ontology-meta'
import type { NarrativeCharacterMeta } from '@/lib/ontology-meta'

/**
 * Bespoke card for the Character casting list. Vertical headshot-first
 * layout (think IMDb Cast & Crew / Netflix cast strip) — circular avatar,
 * name below, plus role-aware metadata. Sizes scale so a casting page can
 * lead with hero-sized leads, drop to supporting, and trail off into small
 * recurring/guest avatars without forcing them all into the same grid cell.
 */

export type CharacterCastingCardSize = 'sm' | 'md' | 'lg'

interface SizeConfig {
  avatar: string
  card: string
  name: string
}

const SIZE_CONFIG: Record<CharacterCastingCardSize, SizeConfig> = {
  lg: { avatar: 'w-32 h-40', card: 'w-40', name: 'text-body-1-bold' },
  md: { avatar: 'w-24 h-32', card: 'w-32', name: 'text-body-0-bold' },
  sm: { avatar: 'w-16 h-20', card: 'w-28', name: 'text-body-0-regular' },
}

// Section heading already says "Lead" / "Supporting" — kept off the cards.
const SHOW_ROLE_CHIP = false

const ROLE_VARIANT: Record<NarrativeCharacterMeta['role'], 'positive' | 'announcement' | undefined> = {
  lead: 'positive',
  supporting: 'announcement',
  recurring: undefined,
  guest: undefined,
}

export interface CharacterCastingCardProps {
  name: string
  avatarSrc?: string
  /** Number of media assets associated with this character (for the subtitle). */
  assetCount: number
  /** Character role from narrative ontology — drives the chip color at lg size. */
  role?: NarrativeCharacterMeta['role']
  size?: CharacterCastingCardSize
  isSelected?: boolean
  primary?: boolean
  onClick?: (event: React.MouseEvent) => void
  onDoubleClick?: (event: React.MouseEvent) => void
}

export function CharacterCastingCard({
  name,
  avatarSrc,
  assetCount,
  role,
  size = 'md',
  isSelected = false,
  primary = false,
  onClick,
  onDoubleClick,
}: CharacterCastingCardProps) {
  const config = SIZE_CONFIG[size]
  const assetCountLabel = pluralize(assetCount, 'asset')
  const roleVariant = role ? ROLE_VARIANT[role] : undefined

  return (
    <button
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        'group self-start flex flex-col items-start gap-2 text-left',
        config.card,
        'focus:outline-none',
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded bg-surface-selected-subtle flex-shrink-0',
          config.avatar,
          // Selection rings around the portrait. Multi-selected items get a
          // tight indigo ring against the edge; primary adds a small halo
          // (ring-offset) so the focused one reads slightly stronger. Keyboard
          // focus shows as a focus ring on the avatar (matches shape) rather
          // than on the wider button bounds.
          isSelected && !primary && 'ring-2 ring-border-selected',
          primary && 'ring-2 ring-border-selected ring-offset-2 ring-offset-background',
          !isSelected && !primary && 'group-focus-visible:ring-2 group-focus-visible:ring-border-focus',
        )}
      >
        {avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarSrc}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground-dim">
            <span className={cn('text-foreground', size === 'lg' ? 'text-display-1' : size === 'md' ? 'text-heading-2' : 'text-body-1-bold')}>
              {getInitials(name)}
            </span>
          </div>
        )}
        {/* Non-selected: light semi-transparent white border overlay above
            the image, providing edge definition that reads on photos.
            Positioned absolute so it renders on top of the image content. */}
        {!(isSelected || primary) && (
          <div className="pointer-events-none absolute inset-0 rounded border border-white/20" />
        )}
      </div>
      <div className="flex flex-col items-start min-w-0 w-full">
        <p className={cn('truncate w-full text-foreground group-hover:text-foreground-system-link transition-colors', config.name)}>
          {name}
        </p>
        {SHOW_ROLE_CHIP && role && (
          <Tag {...(roleVariant ? { type: roleVariant, variant: 'fill' as const } : { variant: 'glass' as const })}>
            {CHARACTER_ROLE_LABEL[role]}
          </Tag>
        )}
        <p className="text-foreground-dim text-label-1-regular">{assetCountLabel}</p>
      </div>
    </button>
  )
}
