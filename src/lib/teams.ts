import type { DomainId } from '@/components/department/types'
import { PERSONAS, DIRECTORY_UPDATED_EVENT } from '@/lib/personas'
import { buildTeams } from '@/lib/scenario'

export type TeamKind = 'group' | 'domain'

export type Team = {
  id: string
  name: string
  kind: TeamKind
  memberUserIds: string[]
  managerUserIds: string[]
  domainId?: DomainId
  rootFolderId?: string
}

const DEFAULT_TEAMS: Team[] = buildTeams()

export let TEAMS: Team[] = structuredClone(DEFAULT_TEAMS)

export function getTeamById(id: string): Team | undefined {
  return TEAMS.find((t) => t.id === id)
}

export function isUserInTeam(userId: string, teamId: string): boolean {
  const team = getTeamById(teamId)
  return team ? team.memberUserIds.includes(userId) : false
}

export function isUserTeamManager(userId: string, teamId: string): boolean {
  const team = getTeamById(teamId)
  return team ? team.managerUserIds.includes(userId) : false
}

function ensurePersonaMembership(userId: string, team: Team): boolean {
  const persona = PERSONAS.find((candidate) => candidate.id === userId)
  if (!persona) return false
  if (!team.memberUserIds.includes(userId)) {
    team.memberUserIds.push(userId)
  }
  if (!persona.teamIds.includes(team.id)) {
    persona.teamIds = [...persona.teamIds, team.id]
  }
  if (!persona.domainId && team.domainId) {
    persona.domainId = team.domainId
  }
  return true
}

function dispatchDirectoryUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DIRECTORY_UPDATED_EVENT))
  }
}

export function addUserToTeam(userId: string, teamId: string): boolean {
  const team = getTeamById(teamId)
  if (!team || team.memberUserIds.includes(userId)) return false
  if (!ensurePersonaMembership(userId, team)) return false
  dispatchDirectoryUpdated()
  return true
}

export function removeUserFromTeam(userId: string, teamId: string): boolean {
  const team = getTeamById(teamId)
  const persona = PERSONAS.find((candidate) => candidate.id === userId)
  if (!team || !persona) return false
  if (team.managerUserIds.includes(userId) && team.managerUserIds.length <= 1) {
    return false
  }
  const index = team.memberUserIds.indexOf(userId)
  if (index === -1) return false
  team.memberUserIds.splice(index, 1)
  team.managerUserIds = team.managerUserIds.filter((managerId) => managerId !== userId)
  persona.teamIds = persona.teamIds.filter((id) => id !== teamId)
  if (team.domainId && persona.domainId === team.domainId) {
    const nextDomainTeam = TEAMS.find(
      (candidate) => candidate.domainId && candidate.memberUserIds.includes(userId),
    )
    persona.domainId = nextDomainTeam?.domainId
  }
  dispatchDirectoryUpdated()
  return true
}

export function addTeamManager(userId: string, teamId: string): boolean {
  const team = getTeamById(teamId)
  if (!team || team.managerUserIds.includes(userId)) return false
  if (!ensurePersonaMembership(userId, team)) return false
  team.managerUserIds.push(userId)
  dispatchDirectoryUpdated()
  return true
}

export function removeTeamManager(userId: string, teamId: string): boolean {
  const team = getTeamById(teamId)
  if (!team) return false
  const index = team.managerUserIds.indexOf(userId)
  if (index === -1 || team.managerUserIds.length <= 1) return false
  team.managerUserIds.splice(index, 1)
  dispatchDirectoryUpdated()
  return true
}

export function createTeam(
  name: string,
  memberUserIds: string[] = [],
  kind: TeamKind = 'group',
  managerUserIds: string[] = [],
): Team {
  const id = `team-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const normalizedManagerUserIds = Array.from(new Set(managerUserIds))
  const normalizedMemberUserIds = Array.from(new Set([...memberUserIds, ...normalizedManagerUserIds]))
  const team: Team = {
    id,
    name,
    kind,
    memberUserIds: normalizedMemberUserIds,
    managerUserIds: normalizedManagerUserIds,
  }
  TEAMS.push(team)
  for (const userId of normalizedMemberUserIds) {
    ensurePersonaMembership(userId, team)
  }
  dispatchDirectoryUpdated()
  return team
}

export function getWorkspaceOwnerTeam(folderId: string): Team | undefined {
  return TEAMS.find((t) => t.rootFolderId === folderId)
}

export function getDomainOwnerTeam(domainId: string): Team | undefined {
  return TEAMS.find((t) => t.domainId === domainId && t.rootFolderId)
}

export function isUserWorkspaceOwner(userId: string, folderId: string, domainId?: string): boolean {
  const directOwner = getWorkspaceOwnerTeam(folderId)
  if (directOwner) return directOwner.memberUserIds.includes(userId)
  if (domainId) {
    const domainOwner = getDomainOwnerTeam(domainId)
    if (domainOwner) return domainOwner.memberUserIds.includes(userId)
  }
  return false
}
