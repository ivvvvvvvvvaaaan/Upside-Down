'use client'

import { profileLabel, RELEASE_DOMAINS } from '@/lib/grants'
import type { Grant, RoleGroup, AccessProfileId } from '@/lib/grants'
import type { DomainId } from '@/lib/data'
import { PERSONAS } from '@/lib/personas'
import { TEAMS } from '@/lib/teams'

export type AccessDisplaySourceEntry = {
  key: string
  grant: Grant
  sourceName?: string
  readOnly?: boolean
}

export type AccessDisplayEntry = AccessDisplaySourceEntry & {
  name: string
  subtitle?: string
  roleLabel: string
  principalType: 'user' | 'team' | 'domain'
  domainId?: DomainId
  members?: {
    id: string
    name: string
    email?: string
    grantId?: string
    roleLabel?: string
    roleValue?: AccessProfileId
    isCurrentUser?: boolean
  }[]
}

export function buildAccessDisplayEntries(
  entries: AccessDisplaySourceEntry[],
  roleGroups: RoleGroup[],
  activeUserId?: string | null,
): AccessDisplayEntry[] {
  const teamEntriesByScope = new Map<string, AccessDisplaySourceEntry[]>()

  for (const entry of entries) {
    if (entry.grant.principal.type !== 'team') continue
    const scopeKey = entry.sourceName ?? '__direct__'
    const current = teamEntriesByScope.get(scopeKey) ?? []
    current.push(entry)
    teamEntriesByScope.set(scopeKey, current)
  }

  const collapsedUsersByEntryKey = new Map<string, Grant[]>()
  const hiddenUserEntryKeys = new Set<string>()

  for (const entry of entries) {
    if (entry.grant.principal.type !== 'user') continue

    const scopeKey = entry.sourceName ?? '__direct__'
    const matchingTeamEntry = (teamEntriesByScope.get(scopeKey) ?? []).find((teamEntry) => {
      const teamId = teamEntry.grant.principal.type === 'team' ? teamEntry.grant.principal.teamId : null
      const team = teamId ? TEAMS.find((candidate) => candidate.id === teamId) : undefined
      const principal = entry.grant.principal
      return principal.type === 'user' && Boolean(team?.memberUserIds.includes(principal.userId))
    })

    if (!matchingTeamEntry) continue

    hiddenUserEntryKeys.add(entry.key)
    const current = collapsedUsersByEntryKey.get(matchingTeamEntry.key) ?? []
    current.push(entry.grant)
    collapsedUsersByEntryKey.set(matchingTeamEntry.key, current)
  }

  return entries
    .filter((entry) => !hiddenUserEntryKeys.has(entry.key))
    .map((entry) => {
      const { grant } = entry

      if (grant.principal.type === 'user') {
        const principal = grant.principal
        const persona = PERSONAS.find((candidate) => candidate.id === principal.userId)
        return {
          ...entry,
          name: persona?.name ?? principal.userId,
          subtitle: persona?.email,
          roleLabel: profileLabel(grant.templateId, roleGroups),
          principalType: 'user' as const,
          domainId: persona?.domainId,
        }
      }

      if (grant.principal.type === 'domain') {
        const domainPrincipal = grant.principal
        const domain = RELEASE_DOMAINS.find((d) => d.id === domainPrincipal.domainId)
        return {
          ...entry,
          name: domain ? `${domain.name} (${domain.group})` : domainPrincipal.domainId,
          subtitle: undefined,
          roleLabel: profileLabel(grant.templateId, roleGroups),
          principalType: 'domain' as const,
          domainId: undefined,
          members: undefined,
        }
      }

      const teamPrincipal = grant.principal
      const team = TEAMS.find((candidate) => candidate.id === teamPrincipal.teamId)
      const collapsedUsers = collapsedUsersByEntryKey.get(entry.key) ?? []
      const teamRoleLabel = profileLabel(grant.templateId, roleGroups)
      const members = team?.memberUserIds.map((userId) => {
        const persona = PERSONAS.find((candidate) => candidate.id === userId)
        const explicitGrant = collapsedUsers.find((collapsedGrant) =>
          collapsedGrant.principal.type === 'user' && collapsedGrant.principal.userId === userId,
        )
        const explicitRoleLabel = explicitGrant ? profileLabel(explicitGrant.templateId, roleGroups) : undefined

        return {
          id: userId,
          name: persona?.name ?? userId,
          email: persona?.email,
          grantId: explicitGrant?.id,
          roleLabel: explicitRoleLabel && explicitRoleLabel !== teamRoleLabel ? explicitRoleLabel : undefined,
          roleValue: explicitGrant?.templateId,
          isCurrentUser: activeUserId === userId,
        }
      })

      let subtitle = team
        ? `${team.memberUserIds.length} member${team.memberUserIds.length === 1 ? '' : 's'}`
        : undefined

      if (team && activeUserId && team.memberUserIds.includes(activeUserId)) {
        const activeGrant = collapsedUsers.find((collapsedGrant) =>
          collapsedGrant.principal.type === 'user' && collapsedGrant.principal.userId === activeUserId,
        )
        const activeGrantLabel = activeGrant ? profileLabel(activeGrant.templateId, roleGroups) : null
        const youLabel = activeGrantLabel && activeGrantLabel !== teamRoleLabel
          ? `You (${activeGrantLabel})`
          : 'You'
        subtitle = subtitle ? `${subtitle} + ${youLabel}` : youLabel
      }

      return {
        ...entry,
        name: team?.name ?? teamPrincipal.teamId,
        subtitle,
        roleLabel: teamRoleLabel,
        principalType: 'team' as const,
        domainId: team?.domainId,
        members,
      }
    })
}
