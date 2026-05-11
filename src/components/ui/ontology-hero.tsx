'use client'

import { Clapperboard, MapPin } from 'lucide-react'
import { Text } from './text'
import { getOntologyMeta } from '@/lib/ontology-meta'
import { getCollectionImagesByName } from '@/lib/data-client'
import type {
  NarrativeCharacterMeta,
  NarrativeSceneMeta,
  NarrativeLocationMeta,
} from '@/lib/ontology-meta'

/**
 * OntologyHero — bespoke entity-specific hero sections for narrative ontology pages.
 *
 * Two-column layout: image left, structured label/value metadata right.
 * Characters get circular avatars; scenes and locations get rectangular stills.
 */

export interface OntologyHeroProps {
  name: string
  icon: string
}

const CAST_TIER_LABEL: Record<NarrativeCharacterMeta['role'], string> = {
  lead: 'Lead',
  supporting: 'Supporting',
  recurring: 'Recurring',
  guest: 'Guest',
}

const SETTING_LABEL: Record<NarrativeLocationMeta['setting'], string> = {
  interior: 'Interior',
  exterior: 'Exterior',
  mixed: 'Mixed',
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-label-0-bold text-foreground-dim uppercase">{label}</p>
      <div className="text-body-1-regular text-foreground">{children}</div>
    </div>
  )
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'
}

function CharacterAvatar({ src, name }: { src?: string; name: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="aspect-square w-full rounded-full object-cover"
      />
    )
  }
  return (
    <div className="aspect-square w-full rounded-full bg-gray-500/20 flex items-center justify-center text-gray-500 dark:text-white">
      <span className="text-display-2 font-bold">{getInitials(name)}</span>
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
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr] md:gap-8">
      <CharacterAvatar src={avatarSrc} name={name} />
      <div className="flex flex-col gap-5 min-w-0">
        <div className="flex flex-col gap-1">
          <h2 className="truncate text-heading-2 font-bold">{name}</h2>
          <Text variant="body-1" color="secondary">{CAST_TIER_LABEL[data.role]}</Text>
        </div>
        <MetaRow label="Bio">{data.bio}</MetaRow>
        {data.episodes.length > 0 && (
          <MetaRow label="Episodes">{data.episodes.join(', ')}</MetaRow>
        )}
        {data.notes && (
          <MetaRow label="Production notes">{data.notes}</MetaRow>
        )}
      </div>
    </div>
  )
}

function NarrativeSceneHero({ name, data, mainImage }: { name: string; data: NarrativeSceneMeta; mainImage?: string }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr] md:gap-8">
      <EntityImage
        src={mainImage}
        alt={name}
        fallbackIcon={<Clapperboard className="h-10 w-10" />}
      />
      <div className="flex flex-col gap-5 min-w-0">
        <div className="flex flex-col gap-1">
          <h2 className="truncate text-heading-2 font-bold">{name}</h2>
          <Text variant="body-1" color="secondary">{data.episode}{data.pageRange ? ` · ${data.pageRange}` : ''}</Text>
        </div>
        <MetaRow label="Description">{data.description}</MetaRow>
        <div className="grid grid-cols-2 gap-5">
          {data.timeOfDay && <MetaRow label="Time of day">{data.timeOfDay}</MetaRow>}
          {data.mood && <MetaRow label="Mood">{data.mood}</MetaRow>}
        </div>
        {data.notes && (
          <MetaRow label="Production notes">{data.notes}</MetaRow>
        )}
      </div>
    </div>
  )
}

function NarrativeLocationHero({ name, data, mainImage }: { name: string; data: NarrativeLocationMeta; mainImage?: string }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr] md:gap-8">
      <EntityImage
        src={mainImage}
        alt={name}
        fallbackIcon={<MapPin className="h-10 w-10" />}
      />
      <div className="flex flex-col gap-5 min-w-0">
        <div className="flex flex-col gap-1">
          <h2 className="truncate text-heading-2 font-bold">{name}</h2>
          <Text variant="body-1" color="secondary">{SETTING_LABEL[data.setting]}</Text>
        </div>
        <MetaRow label="Description">{data.description}</MetaRow>
        {data.episodes.length > 0 && (
          <MetaRow label="Episodes">{data.episodes.join(', ')}</MetaRow>
        )}
        {data.notes && (
          <MetaRow label="Production notes">{data.notes}</MetaRow>
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
      return <NarrativeSceneHero name={name} data={meta.data} mainImage={mainImage} />
    case 'location':
      return <NarrativeLocationHero name={name} data={meta.data} mainImage={mainImage} />
    default:
      return null
  }
}
