'use client'

import { Clapperboard, MapPin } from 'lucide-react'
import { Tag } from './tag'
import { getOntologyMeta, CHARACTER_ROLE_LABEL } from '@/lib/ontology-meta'
import { getCollectionImagesByName } from '@/lib/data-client'
import { cn, getInitials, pickAvatarGradient } from '@/lib/utils'
import { getTimeOfDayIcon } from './scene-script-card'
import type {
  NarrativeCharacterMeta,
  NarrativeSceneMeta,
  NarrativeLocationMeta,
} from '@/lib/ontology-meta'

/**
 * OntologyHero — bespoke entity-specific hero sections for narrative ontology pages.
 *
 * Replaces the label/value database-read layout with:
 *  - Bigger, more cinematic image / avatar
 *  - Role/setting as a chip near the title (not a sub-label)
 *  - Chip row for short metadata (episodes, page range, time of day)
 *  - Long-form text (description, bio) flows as a paragraph, no label above
 */

export interface OntologyHeroProps {
  name: string
  icon: string
}

const CAST_TIER_VARIANT: Record<NarrativeCharacterMeta['role'], 'positive' | 'announcement' | 'notice' | undefined> = {
  lead: 'positive',
  supporting: 'announcement',
  recurring: undefined,
  guest: undefined,
}

const SETTING_LABEL: Record<NarrativeLocationMeta['setting'], string> = {
  interior: 'Interior',
  exterior: 'Exterior',
  mixed: 'Mixed',
}

function CharacterAvatar({ src, name }: { src?: string; name: string }) {
  // Tall portrait (3:4) matches the casting-list / scene-card character cards
  // so the character read is consistent across surfaces.
  return (
    <div className={cn(
      'relative w-full h-48 md:h-56 rounded overflow-hidden bg-surface-selected-subtle',
      !src && pickAvatarGradient(name),
    )}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-foreground-dim">
          <span className="text-display-1 text-foreground">{getInitials(name)}</span>
        </div>
      )}
      {/* Light semi-transparent border overlay matching the portrait treatment
          on the casting list and scene card character chips. */}
      <div className="pointer-events-none absolute inset-0 rounded border border-white/20" />
    </div>
  )
}

function EntityImage({ src, alt, fallbackIcon }: { src?: string; alt: string; fallbackIcon: React.ReactNode }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className="aspect-video w-full rounded object-cover"
      />
    )
  }
  return (
    <div className="aspect-video w-full rounded bg-surface-low flex items-center justify-center text-foreground-dim">
      {fallbackIcon}
    </div>
  )
}

function NarrativeCharacterHero({ name, data, avatarSrc }: { name: string; data: NarrativeCharacterMeta; avatarSrc?: string }) {
  const roleVariant = CAST_TIER_VARIANT[data.role]
  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-8">
      <div className="w-36 md:w-40 flex-shrink-0">
        <CharacterAvatar src={avatarSrc} name={name} />
      </div>
      <div className="flex flex-col gap-5 min-w-0 md:pt-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-heading-1 text-foreground">{name}</h2>
          <Tag {...(roleVariant ? { type: roleVariant, variant: 'fill' as const } : { variant: 'glass' as const })}>
            {CHARACTER_ROLE_LABEL[data.role]}
          </Tag>
        </div>
        <p className="text-body-1-regular text-foreground">{data.bio}</p>
        {data.episodes.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-label-0-bold text-foreground-dim uppercase">Appears in</p>
            <div className="flex flex-wrap gap-1.5">
              {data.episodes.map(ep => (
                <Tag key={ep} variant="border">{ep}</Tag>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function NarrativeSceneHero({ name, data }: { name: string; data: NarrativeSceneMeta }) {
  // No big preview — a scene's identity is the slugline + script context, not
  // a single image. Skip the empty placeholder; let title, chips, and
  // description carry the page.
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-heading-1 text-foreground">{name}</h2>
      <div className="flex flex-wrap items-center gap-1.5">
        <Tag variant="border">{data.episode}</Tag>
        {data.pageRange && <Tag variant="border">{data.pageRange}</Tag>}
        {data.timeOfDay && (
          <Tag variant="glass">
            <span className="inline-flex items-center gap-1">
              {getTimeOfDayIcon(data.timeOfDay, 'w-3.5 h-3.5')}
              {data.timeOfDay}
            </span>
          </Tag>
        )}
      </div>
      <p className="text-body-1-regular text-foreground max-w-3xl">{data.description}</p>
    </div>
  )
}

function NarrativeLocationHero({ name, data, mainImage }: { name: string; data: NarrativeLocationMeta; mainImage?: string }) {
  // Faded backdrop image rather than a side panel — locations are atmospheric,
  // and the photo provides mood underneath the text without dominating it.
  return (
    <div className="relative overflow-hidden rounded p-6 md:p-8 bg-surface-low">
      {mainImage && (
        <>
          <img
            src={mainImage}
            alt=""
            className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-20"
          />
        </>
      )}
      <div className="relative flex flex-col gap-5 max-w-3xl">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-heading-1 text-foreground">{name}</h2>
          <Tag variant="glass">{SETTING_LABEL[data.setting]}</Tag>
        </div>
        <p className="text-body-1-regular text-foreground">{data.description}</p>
        {data.episodes.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-label-0-bold text-foreground-dim uppercase">Featured in</p>
            <div className="flex flex-wrap gap-1.5">
              {data.episodes.map(ep => (
                <Tag key={ep} variant="border">{ep}</Tag>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function OntologyHero({ name, icon }: OntologyHeroProps) {
  const meta = getOntologyMeta(name, icon)
  if (!meta) return null

  const { avatarSrc, mainImage } = getCollectionImagesByName(name)

  switch (meta.type) {
    case 'character':
      return <NarrativeCharacterHero name={name} data={meta.data} avatarSrc={avatarSrc} />
    case 'scene':
      return <NarrativeSceneHero name={name} data={meta.data} />
    case 'location':
      return <NarrativeLocationHero name={name} data={meta.data} mainImage={mainImage} />
    default:
      return null
  }
}
