/**
 * Retained UI helpers for kind label/tag rendering.
 * The access model is now in grants.ts.
 */

export type AccessEntryKind = 'folder' | 'asset' | 'cut' | 'collection' | 'smart-collection' | 'review-set' | 'project'

export function kindLabel(kind: AccessEntryKind): string {
  if (kind === 'folder') return 'Collection'
  if (kind === 'cut') return 'Cut'
  if (kind === 'collection') return 'Collection'
  if (kind === 'smart-collection') return 'Collection'
  if (kind === 'review-set') return 'Review Set'
  if (kind === 'project') return 'Project'
  return 'Asset'
}

export function kindTagType(kind: AccessEntryKind): 'positive' | 'neutral' | 'announcement' | 'informative' {
  if (kind === 'folder') return 'positive'
  if (kind === 'cut') return 'informative'
  if (kind === 'collection') return 'announcement'
  if (kind === 'smart-collection') return 'announcement'
  if (kind === 'review-set') return 'informative'
  if (kind === 'project') return 'informative'
  return 'neutral'
}
