'use client'

import { useState, useMemo } from 'react'
import { Film } from 'lucide-react'
import { PageHeader, EmptyState } from '@/components/ui'
import { AssetCard } from '@/components/ui/asset-card'
import { ReleaseModal } from '@/components/ui/release-modal'
import { AppLayout } from '@/components/layouts'
import { useAccess, usePersona } from '@/hooks'
import type { Asset, CutStage } from '@/lib/data'
import { buildCuts } from '@/lib/scenario'
import type { SeedCut } from '@/lib/scenario'
import { deriveReleaseTagInfo } from '@/lib/release'
import { pick, IMAGE_POOL } from '@/lib/images'

const STAGE_LABELS: Record<string, string> = {
  'locked-cut': 'Locked Cut',
  'netflix-cut': 'Netflix Cut',
  'final-cut': 'Final Cut',
  'emf': 'EMF',
}

const STAGE_ORDER: CutStage[] = [
  'locked-cut', 'netflix-cut', 'final-cut', 'emf',
]

function abbrev(name: string): string {
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase()
}

/** Build compact release tags: [ALL] or [SC][+2] */
function buildReleaseTags(info: { labels: string[]; isAll: boolean }): Asset['tags'] {
  if (info.labels.length === 0) return []
  if (info.isAll) return [{ label: 'ALL', source: 'system' }]
  const tags: Asset['tags'] = [{ label: abbrev(info.labels[0]), source: 'system' }]
  if (info.labels.length > 1) {
    tags.push({ label: `+${info.labels.length - 1}`, source: 'system' })
  }
  return tags
}

/** Convert a seed cut into an Asset, with release tags derived from live grants */
function cutToAsset(cut: SeedCut, releaseInfo: { labels: string[]; isAll: boolean }): Asset {
  const thumbnail = pick(IMAGE_POOL, cut.id)[0]
  const stageLabel = STAGE_LABELS[cut.stage] ?? cut.stage
  const typeTag = cut.stage === 'locked-cut' && cut.version > 0
    ? `${stageLabel} v${cut.version}`
    : stageLabel

  const tags: Asset['tags'] = [
    { label: typeTag, source: 'system' },
    ...buildReleaseTags(releaseInfo),
  ]

  return {
    id: cut.id,
    name: cut.name,
    type: 'video',
    kind: 'cut',
    stage: cut.stage as CutStage,
    version: cut.version,
    episode: cut.episode,
    constituents: cut.constituents,
    thumbnail,
    tags,
    videoMeta: { duration: cut.duration },
    department: 'editorial',
    created_at: cut.date,
    modifiedBy: cut.createdBy,
  }
}

type CutWithMeta = {
  asset: Asset
  seed: SeedCut
  isOwn: boolean
}

function EpisodeSection({ episode, cuts, onRelease }: {
  episode: string
  cuts: CutWithMeta[]
  onRelease?: (cut: SeedCut) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Film className="w-4 h-4 text-foreground-dim" />
        <h3 className="text-body-1-bold text-foreground">{episode}</h3>
        <span className="text-body-0-regular text-foreground-dim">
          {cuts.length} {cuts.length === 1 ? 'version' : 'versions'}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cuts.map((cut) => (
          <AssetCard
            key={cut.asset.id}
            asset={cut.asset}
            onMenuClick={onRelease ? () => onRelease(cut.seed) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

export function LibraryView() {
  const { sharesReceivedByMe, allProjectShares, grants, canShare } = useAccess()
  const { hydrated, isAdmin, activePersona } = usePersona()
  const [releaseTarget, setReleaseTarget] = useState<SeedCut | null>(null)

  const allCuts = useMemo(() => buildCuts(), [])
  const cutsByIdMap = useMemo(() => new Map(allCuts.map(c => [c.id, c])), [allCuts])

  const allEntries = useMemo(() => {
    return isAdmin ? allProjectShares : sharesReceivedByMe
  }, [isAdmin, allProjectShares, sharesReceivedByMe])

  // Cuts accessible via grants (shared to me or my teams)
  const grantedCutIds = useMemo(() => {
    return new Set(allEntries.filter(e => e.resourceType === 'cut').map(e => e.resourceId))
  }, [allEntries])

  // Cuts from own department (editorial users see their own cuts)
  const isEditorialMember = activePersona?.departmentId === 'editorial'

  // Can this user release cuts?
  const canRelease = useMemo(() => {
    // Editorial members can release, or anyone with share permission
    return isEditorialMember || isAdmin
  }, [isEditorialMember, isAdmin])

  // All cuts the user can see, with release status derived from live grants
  const accessibleCuts = useMemo((): CutWithMeta[] => {
    const seen = new Set<string>()
    const result: CutWithMeta[] = []

    for (const cut of allCuts) {
      if (seen.has(cut.id)) continue
      const isOwn = isEditorialMember || false
      const hasGrant = grantedCutIds.has(cut.id)
      const isAdminAccess = isAdmin

      if (isOwn || hasGrant || isAdminAccess) {
        seen.add(cut.id)
        const releaseInfo = deriveReleaseTagInfo(cut.id, grants)
        result.push({ asset: cutToAsset(cut, releaseInfo), seed: cut, isOwn })
      }
    }

    return result
  }, [allCuts, isEditorialMember, grantedCutIds, isAdmin, grants])

  // Group by episode, sort by stage + version (latest first)
  const episodes = useMemo(() => {
    const map = new Map<string, CutWithMeta[]>()
    for (const cut of accessibleCuts) {
      const ep = cut.asset.episode ?? 'Unknown'
      const existing = map.get(ep) ?? []
      existing.push(cut)
      map.set(ep, existing)
    }
    for (const entry of Array.from(map)) {
      entry[1].sort((a, b) => {
        const stageDiff = STAGE_ORDER.indexOf(b.asset.stage ?? 'locked-cut') - STAGE_ORDER.indexOf(a.asset.stage ?? 'locked-cut')
        if (stageDiff !== 0) return stageDiff
        return (b.asset.version ?? 0) - (a.asset.version ?? 0)
      })
    }
    return Array.from(map).sort((a, b) => a[0].localeCompare(b[0]))
  }, [accessibleCuts])

  if (!hydrated) {
    return <AppLayout><div className="flex-1" /></AppLayout>
  }

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
          <PageHeader
            title="Cuts"
            description={
              accessibleCuts.length > 0
                ? `${accessibleCuts.length} cuts across ${episodes.length} ${episodes.length === 1 ? 'episode' : 'episodes'}`
                : 'Cuts will appear here as they become available'
            }
          />

          {episodes.length > 0 ? (
            <div className="space-y-8">
              {episodes.map(([episode, cuts]) => (
                <EpisodeSection
                  key={episode}
                  episode={episode}
                  cuts={cuts}
                  onRelease={canRelease ? setReleaseTarget : undefined}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No cuts yet"
              message={isEditorialMember
                ? 'Upload or assemble cuts in your workspace — they will appear here automatically.'
                : 'Cuts shared to you or your teams will appear here.'}
            />
          )}
        </div>
      </div>

      <ReleaseModal
        open={!!releaseTarget}
        onClose={() => setReleaseTarget(null)}
        cut={releaseTarget}
      />
    </AppLayout>
  )
}
