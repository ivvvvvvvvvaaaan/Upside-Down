export type ReviewNoteSummary = {
  totalNotes: number
  unresolvedCount: number
  latestSummary: string
  updatedAt: string
  externalUrl: string
  active: boolean
}

// Asset-level review sessions only — collections aggregate from these
const REVIEW_NOTE_SUMMARIES: Record<string, ReviewNoteSummary> = {
  'ws-edit-cut-1': {
    totalNotes: 14,
    unresolvedCount: 3,
    active: true,
    latestSummary: 'David requested Alt B for the pit lane confrontation — Maria revised the timing but Mike flagged a VFX continuity issue at the cut point. Lisa is reviewing both options before locking.',
    updatedAt: '2026-02-14',
    externalUrl: 'https://review.example.com/editorial/ep301-timeline-v4',
  },
  'ws-cam-sel-1': {
    totalNotes: 6,
    unresolvedCount: 1,
    active: true,
    latestSummary: 'David and Lisa both prefer Take B for the emotional beat. Tom noted the focus pull at 00:42 is soft — waiting on confirmation whether to use the backup angle.',
    updatedAt: '2026-02-13',
    externalUrl: 'https://review.example.com/scene-12/take-b-select',
  },
  'ws-edit-exp-2': {
    totalNotes: 9,
    unresolvedCount: 2,
    active: true,
    latestSummary: 'Maria added temp timing markers for the pit stop sequence. Sarah asked for 4 more frames before the tire change to match VFX timing. Lisa approved the rest of the cut.',
    updatedAt: '2026-02-12',
    externalUrl: 'https://review.example.com/editorial/ep301-reference-cut-v4',
  },
  'ws-vfx-010-010': {
    totalNotes: 4,
    unresolvedCount: 0,
    active: false,
    latestSummary: 'All notes resolved. Mike approved the final comp, Sarah confirmed it matches the approved color grade, and Maria verified the editorial cut point lands cleanly.',
    updatedAt: '2026-02-14',
    externalUrl: 'https://review.example.com/vfx/seq010-sh010-comp-v12',
  },
  'ws-edit-vfx-2': {
    totalNotes: 5,
    unresolvedCount: 1,
    active: true,
    latestSummary: 'Mike requested higher-res plates for SEQ010. Sarah noted the audio temp track is out of sync after the crash beat — needs re-export from editorial.',
    updatedAt: '2026-02-13',
    externalUrl: 'https://review.example.com/editorial/vfx-pull-plates',
  },
  'ws-vfx-010-020': {
    totalNotes: 3,
    unresolvedCount: 0,
    active: false,
    latestSummary: 'Mike signed off after the third particle density pass. Sarah confirmed it integrates with the editorial cut. No outstanding notes.',
    updatedAt: '2026-02-07',
    externalUrl: 'https://review.example.com/vfx/seq010-sh020-comp-v08',
  },
  'ws-vfx-020-010': {
    totalNotes: 6,
    unresolvedCount: 4,
    active: true,
    latestSummary: 'David flagged the pit stop timing as too fast — wants 8 more frames before the tire change. Mike agreed but noted it affects the particle sim. Sarah is re-rendering. Lisa asked if this changes the music cue.',
    updatedAt: '2026-02-11',
    externalUrl: 'https://review.example.com/vfx/seq020-sh010-comp-v03',
  },
  'ws-vfx-comp-eleven': {
    totalNotes: 10,
    unresolvedCount: 2,
    active: true,
    latestSummary: 'Sarah noted the helmet visor CG needs tighter tracking on the close-up. Mike is on it. David also wants the halo glow dialed back 20% — feels too stylized for this scene.',
    updatedAt: '2026-02-08',
    externalUrl: 'https://review.example.com/vfx/vitale-halo-gfx-comp-v4',
  },
  'ws-art-concept-1': {
    totalNotes: 7,
    unresolvedCount: 0,
    active: false,
    latestSummary: 'Approved. Priya incorporated David\'s silhouette notes and Alex confirmed it works for the poster key art. Final asset exported.',
    updatedAt: '2026-02-06',
    externalUrl: 'https://review.example.com/art/hero-pose-v3',
  },
  'ws-art-concept-demogorgon': {
    totalNotes: 12,
    unresolvedCount: 3,
    active: true,
    latestSummary: 'David wants the front wing redesigned for better airflow in the reveal shot. Priya pushed back on structural feasibility — they\'re meeting Thursday to align. Alex wants to see both options.',
    updatedAt: '2026-02-05',
    externalUrl: 'https://review.example.com/art/concept-ar24',
  },
  'ws-art-concept-creature': {
    totalNotes: 4,
    unresolvedCount: 1,
    active: true,
    latestSummary: 'David likes the overall form but wants the side pod detail pushed further. Priya is iterating on the aero package.',
    updatedAt: '2026-02-07',
    externalUrl: 'https://review.example.com/art/car-design',
  },
  'ws-cam-sel-billy': {
    totalNotes: 3,
    unresolvedCount: 0,
    active: false,
    latestSummary: 'Lisa confirmed this is the preferred take. David and Tom both signed off — the handheld energy works for the celebration beat.',
    updatedAt: '2026-02-03',
    externalUrl: 'https://review.example.com/camera/ferreira-closeup-select',
  },
  'ws-edit-cut-locked': {
    totalNotes: 16,
    unresolvedCount: 0,
    active: false,
    latestSummary: 'Picture lock approved. Alex signed off, all 16 review notes resolved across editorial, VFX, and sound. Maria exported the final master.',
    updatedAt: '2026-02-04',
    externalUrl: 'https://review.example.com/editorial/ep07-locked-cut',
  },
}

export function getReviewNoteSummary(resourceId: string): ReviewNoteSummary | null {
  return REVIEW_NOTE_SUMMARIES[resourceId] ?? null
}

/**
 * Aggregate review sessions from a collection's assets.
 * Returns a rolled-up summary with totals, the most recent active summary,
 * and a link to the collection-level review.
 */
export function getCollectionReviewSummary(
  collectionId: string,
  assetIds: string[],
): ReviewNoteSummary | null {
  const assetSummaries = assetIds
    .map((id) => REVIEW_NOTE_SUMMARIES[id])
    .filter(Boolean)

  if (assetSummaries.length === 0) return null

  const totalNotes = assetSummaries.reduce((sum, s) => sum + s.totalNotes, 0)
  const unresolvedCount = assetSummaries.reduce((sum, s) => sum + s.unresolvedCount, 0)
  const hasActive = assetSummaries.some((s) => s.active)

  // Pick the most recent active summary, or the most recent overall
  const sorted = [...assetSummaries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const activeSorted = sorted.filter((s) => s.active)
  const latest = activeSorted[0] ?? sorted[0]

  const mostRecent = sorted[0]

  return {
    totalNotes,
    unresolvedCount,
    active: hasActive,
    latestSummary: `${assetSummaries.length} assets reviewed. ${latest.latestSummary}`,
    updatedAt: mostRecent.updatedAt,
    externalUrl: `https://review.example.com/collections/${collectionId}`,
  }
}
