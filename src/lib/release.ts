/**
 * Release domain system.
 *
 * Release domains are system-level configuration — they define WHO gets
 * access when content is released to a named audience (Studio Post,
 * Globalization, etc.). Each domain maps to teams/people who receive
 * grants.
 *
 * Release domains are NOT the same as access groups:
 * - Release domains = system config, per-project, per-asset-type
 * - Access groups = named teams used for recurring manual sharing
 * - A domain REFERENCES teams that get grants, but the domain itself
 *   is the configuration layer above the grant
 */

import type { Grant } from '@/lib/grants'
import { isGrantActive } from '@/lib/grants'
import { buildReleaseDomains } from '@/lib/scenario'
import type { ReleaseDomain } from '@/lib/scenario'

const DOMAINS = buildReleaseDomains()

/** Release domains applicable to a specific asset type (e.g. 'cut') */
function getReleasDomainsForType(assetType: string): ReleaseDomain[] {
  return DOMAINS.filter(d => d.assetTypes.includes(assetType))
}

/** Grouped by tier for UI rendering */
export function getReleaseDomainsByGroup(assetType?: string): { group: string; domains: ReleaseDomain[] }[] {
  const filtered = assetType ? getReleasDomainsForType(assetType) : DOMAINS
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
 * Derive which release domains have been released to, based on active grants.
 * A domain is "released" if ALL of its grantee teams have active grants on the resource.
 * Domains with no grantees are considered released if there's any grant with a matching
 * domain note/tag (for prototype, we skip these — they're wide/other domains without
 * prototype personas).
 */
export function deriveReleasedDomains(
  resourceId: string,
  grants: Grant[],
): ReleaseDomain[] {
  const activeGrants = grants.filter(
    g => g.resource.id === resourceId && isGrantActive(g) && g.principal.type === 'team',
  )
  const grantedTeamIds = new Set(
    activeGrants
      .filter(g => g.principal.type === 'team')
      .map(g => (g.principal as { type: 'team'; teamId: string }).teamId),
  )

  return DOMAINS.filter(domain => {
    if (domain.granteeTeamIds.length === 0) return false
    return domain.granteeTeamIds.every(tid => grantedTeamIds.has(tid))
  })
}

/** Count of domains that have configured grantees (releasable) */
function getReleasableDomainCount(): number {
  return DOMAINS.filter(d => d.granteeTeamIds.length > 0).length
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
