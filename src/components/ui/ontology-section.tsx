'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Folder, Lock, LayoutGrid, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tag } from './tag'
import { Tooltip } from './tooltip'
import { pick, IMAGE_POOL, pickForDimension } from '@/lib/images'
import type { ImageDimension } from '@/lib/images'
import type { SmartCollection, SmartCollectionGroupBy, Asset } from '@/lib/data'
import type { RelatedAssetGroup } from '@/lib/context-relationships'
import { getCutStageLabel } from '@/lib/cuts'

// Info tooltip for section headings

function SectionHeading({ label, tip }: { label: string; tip?: string }) {
  return (
    <h4 className="text-body-0-bold text-foreground-dim flex items-center gap-1.5">
      {label}
      {tip && (
        <Tooltip label={tip}>
          <Info className="w-3 h-3 text-foreground-dim cursor-help" />
        </Tooltip>
      )}
    </h4>
  )
}

const SECTION_TIPS: Record<string, string> = {
  characters: 'People recognized in this asset',
  scenes: 'The scene this asset belongs to',
  locations: 'Where this asset was captured',
  takes: 'This shot was recorded multiple times',
  cameras: 'This moment was covered by multiple cameras',
  'adjacent-takes': 'The same scene was shot in other takes',
  'alternate-angle': 'A different camera captured this same moment',
  cuts: 'This asset is part of these editorial cuts',
  constituents: 'The files assembled into this cut',
  containers: 'Collections and folders containing this asset',
}

// Shared sub-components (extracted from smart-collection-side-panel)

function getCollectionImages(collectionId: string, dimension?: ImageDimension) {
  return {
    mainImage: pickForDimension(dimension, collectionId, 1)[0],
    thumbnails: pickForDimension(dimension, collectionId + '-thumb', 2),
  }
}

function CharacterChips({ items, dimension }: { items: SmartCollection[]; dimension?: ImageDimension }) {
  if (items.length === 0) return null
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {items.map(item => {
        const { mainImage } = getCollectionImages(item.id, dimension)
        return (
          <Link key={item.id} href={`/nextgen/collections/${item.id}`}
            className="flex flex-col items-center gap-1 shrink-0 group">
            <div className="w-12 h-12 rounded-full overflow-hidden relative bg-surface-2">
              {mainImage && <Image src={mainImage} alt={item.name} fill sizes="48px" className="object-cover" />}
            </div>
            <span className="text-body-0-regular text-foreground group-hover:text-foreground-system-link text-center transition-colors whitespace-nowrap">
              {item.name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

function EntityCards({ items, dimension }: { items: SmartCollection[]; dimension?: ImageDimension }) {
  if (items.length === 0) return null
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map(item => {
        const { mainImage, thumbnails } = getCollectionImages(item.id, dimension)
        return (
          <Link key={item.id} href={`/nextgen/collections/${item.id}`}
            className="shrink-0 w-[140px] rounded overflow-hidden border border-border-dim group hover:border-border-subtle transition-colors relative">
            <div className="flex h-20 gap-px bg-surface-2">
              <div className="flex-[2] relative">
                {mainImage && <Image src={mainImage} alt={item.name} fill sizes="90px" className="object-cover" />}
              </div>
              {thumbnails.map((t, i) => (
                <div key={i} className="flex-1 relative">
                  <Image src={t} alt="" fill sizes="45px" className="object-cover" />
                </div>
              ))}
            </div>
            <div className="absolute bottom-1 left-1">
              <span className="text-label-0-bold text-white backdrop-blur-md bg-black/40 px-2 py-0.5 rounded-full truncate max-w-[120px] block">
                {item.name}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// Shot Context — asset-to-asset relationships

function AssetThumbnailCard({ asset, onClick }: { asset: Asset; onClick?: (asset: Asset) => void }) {
  const thumbnail = asset.thumbnail ?? pick(IMAGE_POOL, asset.id, 1)[0]
  const content = (
    <div className="shrink-0 w-[100px] rounded overflow-hidden border border-border-dim hover:border-border-subtle transition-colors relative group">
      <div className="h-16 relative bg-surface-2">
        {thumbnail && <Image src={thumbnail} alt={asset.name} fill sizes="100px" className="object-cover" />}
      </div>
      <div className="px-1 py-0.5">
        <span className="text-label-0-regular text-foreground truncate block group-hover:text-foreground-system-link transition-colors">
          {asset.name}
        </span>
      </div>
    </div>
  )

  if (onClick) {
    return <button key={asset.id} onClick={() => onClick(asset)} className="text-left">{content}</button>
  }
  return <Link key={asset.id} href={`/nextgen/assets/${asset.id}`}>{content}</Link>
}

function ShotContextRow({
  group,
  onAssetClick,
}: {
  group: RelatedAssetGroup
  onAssetClick?: (asset: Asset) => void
}) {
  return (
    <section className="space-y-2">
      <SectionHeading label={group.label} tip={SECTION_TIPS[group.type]} />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {group.assets.map(asset => (
          <AssetThumbnailCard key={asset.id} asset={asset} onClick={onAssetClick} />
        ))}
      </div>
    </section>
  )
}

// Cut cards

function CutCards({ cuts }: { cuts: Asset[] }) {
  if (cuts.length === 0) return null
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {cuts.map(cut => {
        const stageLabel = getCutStageLabel(cut.stage)
        const thumbnail = cut.thumbnail ?? pick(IMAGE_POOL, cut.id, 1)[0]
        return (
          <Link
            key={cut.id}
            href="/nextgen/library"
            className="shrink-0 w-[140px] rounded overflow-hidden border border-border-dim group hover:border-border-subtle transition-colors"
          >
            <div className="h-20 relative bg-surface-2">
              {thumbnail && <Image src={thumbnail} alt={cut.name} fill sizes="140px" className="object-cover" />}
              {cut.videoMeta?.duration && (
                <div className="absolute bottom-1 right-1 px-1 bg-black/60 rounded">
                  <span className="text-label-0-bold text-white leading-none">{cut.videoMeta.duration}</span>
                </div>
              )}
            </div>
            <div className="px-2 py-1 space-y-0.5">
              <span className="text-label-0-regular text-foreground truncate block group-hover:text-foreground-system-link transition-colors">
                {cut.name}
              </span>
              <div className="flex items-center gap-1">
                <Tag size="compact" type="informative" variant="border">{stageLabel}</Tag>
                {cut.version != null && <Tag size="compact" type="neutral" variant="border">V{cut.version}</Tag>}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// Container links (workspace folders + user collections)

export interface ContainerItem {
  key: string
  label: string
  href: string | null
  kind: string
  icon: 'folder' | 'collection'
  isShared?: boolean
  /** User cannot browse this container (no access to the folder/collection) */
  locked?: boolean
}

function ContainerCard({ item }: { item: ContainerItem }) {
  const Icon = item.icon === 'folder' ? Folder : LayoutGrid
  const cardClasses = cn(
    'shrink-0 w-[140px] rounded border border-border-dim group transition-colors block',
    !item.locked && 'hover:border-border-subtle',
  )

  const content = (
    <>
      <div className="h-16 bg-surface-2 flex items-center justify-center rounded-t relative">
        <Icon className={cn('w-6 h-6', item.locked ? 'text-foreground' : 'text-foreground-dim')} />
        {item.locked && <Lock className="w-3.5 h-3.5 text-foreground absolute bottom-1.5 right-1.5" />}
      </div>
      <div className="px-2 py-1">
        <span className={cn('text-label-0-regular truncate block', item.locked ? 'text-foreground-dim' : 'text-foreground group-hover:text-foreground-system-link transition-colors')}>
          {item.label}
        </span>
      </div>
    </>
  )

  if (item.href && !item.locked) {
    return <Link href={item.href} className={cardClasses}>{content}</Link>
  }
  return <div className={cardClasses}>{content}</div>
}

function ContainerCards({ items }: { items: ContainerItem[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => <ContainerCard key={item.key} item={item} />)}
    </div>
  )
}

// Main OntologySection

export interface OntologySectionProps {
  /** Semantic dimension links — smart collections grouped by type */
  dimensions?: {
    characters?: SmartCollection[]
    scenes?: SmartCollection[]
    locations?: SmartCollection[]
  }
  /** Hide a dimension (e.g., hide Characters when viewing from a Character collection) */
  suppressDimension?: SmartCollectionGroupBy
  /** Shot-level context groups from context-relationships.ts */
  contextGroups?: RelatedAssetGroup[]
  /** Callback when a context-related asset is clicked */
  onAssetClick?: (asset: Asset) => void
  /** Cuts this entity appears in */
  cuts?: Asset[]
  /** Constituent assets (for cuts — the files that make up this cut) */
  constituents?: Asset[]
  /** Container links (workspace folder + user collections) */
  containers?: ContainerItem[]
}

export function OntologySection({
  dimensions,
  suppressDimension,
  contextGroups,
  onAssetClick,
  cuts,
  constituents,
  containers,
}: OntologySectionProps) {
  const characters = suppressDimension !== 'characters' ? (dimensions?.characters ?? []) : []
  const scenes = suppressDimension !== 'scenes' ? (dimensions?.scenes ?? []) : []
  const locations = suppressDimension !== 'locations' ? (dimensions?.locations ?? []) : []
  const visibleContextGroups = contextGroups ?? []

  const hasDimensions = characters.length > 0 || scenes.length > 0 || locations.length > 0
  const hasContextGroups = visibleContextGroups.length > 0
  const hasCuts = (cuts ?? []).length > 0
  const hasConstituents = (constituents ?? []).length > 0
  const hasContainers = (containers ?? []).length > 0
  const hasAnything = hasDimensions || hasContextGroups || hasCuts || hasConstituents || hasContainers

  if (!hasAnything) {
    return (
      <p className="text-body-0-regular text-foreground-dim">No connections found</p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Semantic dimensions */}
      {characters.length > 0 && (
        <section className="space-y-2">
          <SectionHeading label="Characters" tip={SECTION_TIPS.characters} />
          <CharacterChips items={characters} dimension="characters" />
        </section>
      )}
      {scenes.length > 0 && (
        <section className="space-y-2">
          <SectionHeading label="Scenes" tip={SECTION_TIPS.scenes} />
          <EntityCards items={scenes} dimension="scenes" />
        </section>
      )}
      {locations.length > 0 && (
        <section className="space-y-2">
          <SectionHeading label="Locations" tip={SECTION_TIPS.locations} />
          <EntityCards items={locations} dimension="locations" />
        </section>
      )}
      {/* Shot context — asset-to-asset relationships */}
      {visibleContextGroups.map(group => (
        <ShotContextRow key={group.type} group={group} onAssetClick={onAssetClick} />
      ))}

      {/* Cuts */}
      {hasCuts && (
        <section className="space-y-2">
          <SectionHeading label="Cuts" tip={SECTION_TIPS.cuts} />
          <CutCards cuts={cuts!} />
        </section>
      )}

      {/* Constituents (for cuts — the source files) */}
      {hasConstituents && (
        <section className="space-y-2">
          <SectionHeading label="Source Files" tip={SECTION_TIPS.constituents} />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {constituents!.map(ca => (
              <AssetThumbnailCard key={ca.id} asset={ca} onClick={onAssetClick} />
            ))}
          </div>
        </section>
      )}

      {/* Collections & folders */}
      {hasContainers && (
        <section className="space-y-2">
          <SectionHeading label="Found in" tip={SECTION_TIPS.containers} />
          <ContainerCards items={containers!} />
        </section>
      )}
    </div>
  )
}
