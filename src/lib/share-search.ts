import type { PrincipalRef } from '@/lib/grants'
import { RELEASE_DOMAINS } from '@/lib/grants'
import { PERSONAS } from '@/lib/personas'
import { TEAMS } from '@/lib/teams'

export type ShareSearchResult = {
  key: string
  principal: PrincipalRef
  name: string
  subtitle: string
  kind: 'user' | 'team' | 'domain'
  /** Release domain tier, for grouping in the share dialog */
  domainGroup?: 'Studio' | 'Wide' | 'Other'
}

export function buildShareSearchResults({
  query,
  activeUserId,
  existingUserIds,
  existingTeamIds,
  existingDomainIds,
  limit = 12,
}: {
  query: string
  activeUserId?: string | null
  existingUserIds?: Set<string>
  existingTeamIds?: Set<string>
  existingDomainIds?: Set<string>
  limit?: number
}): ShareSearchResult[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return []

  const userResults: ShareSearchResult[] = PERSONAS
    .filter((persona) =>
      persona.id !== activeUserId &&
      !existingUserIds?.has(persona.id) &&
      (
        persona.name.toLowerCase().includes(trimmed) ||
        persona.email.toLowerCase().includes(trimmed)
      ),
    )
    .map((persona) => ({
      key: `user-${persona.id}`,
      principal: { type: 'user' as const, userId: persona.id },
      name: persona.name,
      subtitle: persona.email,
      kind: 'user' as const,
    }))

  // Hide teams that back a release domain (they show as domain results instead)
  const domainBackingTeamIds = new Set(RELEASE_DOMAINS.flatMap(d => d.granteeTeamIds))

  const teamResults: ShareSearchResult[] = TEAMS
    .filter((team) =>
      !existingTeamIds?.has(team.id) &&
      team.kind !== 'domain' &&
      !domainBackingTeamIds.has(team.id) &&
      team.name.toLowerCase().includes(trimmed),
    )
    .map((team) => ({
      key: `team-${team.id}`,
      principal: { type: 'team' as const, teamId: team.id },
      name: team.name,
      subtitle: `${team.memberUserIds.length} ${team.memberUserIds.length === 1 ? 'member' : 'members'}`,
      kind: 'team' as const,
    }))

  const domainResults: ShareSearchResult[] = RELEASE_DOMAINS
    .filter((domain) =>
      !existingDomainIds?.has(domain.id) &&
      (
        domain.name.toLowerCase().includes(trimmed) ||
        domain.id.toLowerCase().includes(trimmed) ||
        'release'.includes(trimmed) ||
        'domain'.includes(trimmed)
      ),
    )
    .map((domain) => ({
      key: `domain-${domain.id}`,
      principal: { type: 'domain' as const, domainId: domain.id },
      name: domain.name,
      subtitle: `Release to ${domain.group}`,
      kind: 'domain' as const,
      domainGroup: domain.group,
    }))

  // Order: people first, then teams, then domains (Studio before Wide before Other)
  const domainOrder = { Studio: 0, Wide: 1, Other: 2 }
  const sortedDomains = domainResults.sort((a, b) =>
    (domainOrder[a.domainGroup!] ?? 99) - (domainOrder[b.domainGroup!] ?? 99)
  )

  return [...userResults, ...teamResults, ...sortedDomains].slice(0, limit)
}
