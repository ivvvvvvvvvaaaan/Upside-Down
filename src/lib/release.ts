/**
 * Release domain system.
 *
 * Release domains are system-level configuration — they define WHO gets
 * access when content is released to a named audience (Studio Post,
 * Globalization, etc.). Each domain maps to teams/people who receive
 * grants.
 *
 * Release domains are first-class grant principals. The domain owns the
 * release history; the access engine resolves its configured audience.
 */

import type { Grant } from '@/lib/grants'
import { isGrantActive } from '@/lib/grants'
import { buildReleaseDomains } from '@/lib/scenario'
import type { ReleaseDomain } from '@/lib/scenario'

const DOMAINS = buildReleaseDomains()

/** Release domains applicable to a specific asset type (e.g. 'cut') */
function getReleaseDomainsForType(assetType: string): ReleaseDomain[] {
  return DOMAINS.filter(d => d.assetTypes.includes(assetType))
}

/** Grouped by tier for UI rendering */
export function getReleaseDomainsByGroup(assetType?: string): { group: string; domains: ReleaseDomain[] }[] {
  const filtered = assetType ? getReleaseDomainsForType(assetType) : DOMAINS
  const groups = new Map<string, ReleaseDomain[]>()
  for (const d of filtered) {
    const existing = groups.get(d.group) ?? []
    existing.push(d)
    groups.set(d.group, existing)
  }
  const order = ['Studio', 'Wide', 'Other']
  return order
    .filter(g => groups.has(g))
    .map(g => ({ group: g, domains: groups.get(g)! }))
}

/**
 * Derive which release domains have been released to, based on active domain grants.
 */
export function deriveReleasedDomains(
  resourceId: string,
  grants: Grant[],
): ReleaseDomain[] {
  const grantedDomainIds = new Set(
    grants
      .filter(g => g.resource.id === resourceId && isGrantActive(g) && g.principal.type === 'domain')
      .map(g => (g.principal as { type: 'domain'; domainId: string }).domainId),
  )

  return DOMAINS.filter(domain => grantedDomainIds.has(domain.id))
}

/** Count of domains that have configured grantees (releasable) */
function getReleasableDomainCount(): number {
  return DOMAINS.filter(d => d.granteeTeamIds.length > 0 || (d.granteeUserIds?.length ?? 0) > 0).length
}

/** Get release summary for display as tags on asset cards */
export function deriveReleaseTagInfo(
  resourceId: string,
  grants: Grant[],
): { labels: string[]; isAll: boolean } {
  const released = deriveReleasedDomains(resourceId, grants)
  const releasableCount = getReleasableDomainCount()
  const isAll = releasableCount > 0 && released.length >= releasableCount
  return {
    labels: released.map(d => d.name),
    isAll,
  }
}
