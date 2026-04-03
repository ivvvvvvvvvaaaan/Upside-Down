import type { PrincipalRef } from '@/lib/grants'
import { PERSONAS } from '@/lib/personas'
import { TEAMS } from '@/lib/teams'

export type ShareSearchResult = {
  key: string
  principal: PrincipalRef
  name: string
  subtitle: string
  kind: 'user' | 'team'
}

export function buildShareSearchResults({
  query,
  activeUserId,
  existingUserIds,
  existingTeamIds,
  limit = 8,
}: {
  query: string
  activeUserId?: string | null
  existingUserIds?: Set<string>
  existingTeamIds?: Set<string>
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
      principal: { type: 'user', userId: persona.id },
      name: persona.name,
      subtitle: persona.email,
      kind: 'user',
    }))

  const teamResults: ShareSearchResult[] = TEAMS
    .filter((team) =>
      !existingTeamIds?.has(team.id) &&
      !team.departmentId &&
      team.name.toLowerCase().includes(trimmed),
    )
    .map((team) => ({
      key: `team-${team.id}`,
      principal: { type: 'team', teamId: team.id },
      name: team.name,
      subtitle: `${team.memberUserIds.length} ${team.memberUserIds.length === 1 ? 'member' : 'members'}`,
      kind: 'team',
    }))

  return [...userResults, ...teamResults].slice(0, limit)
}
