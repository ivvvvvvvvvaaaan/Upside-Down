import type { DomainId } from '@/components/department/types'
import { buildTeams } from '@/lib/scenario'

export type TeamKind = 'department' | 'domain' | 'team'

export type Team = {
  id: string
  name: string
  kind: TeamKind
  memberUserIds: string[]
  domainId?: DomainId
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

export function addUserToTeam(userId: string, teamId: string): boolean {
  const team = getTeamById(teamId)
  if (!team || team.memberUserIds.includes(userId)) return false
  team.memberUserIds.push(userId)
  return true
}

export function removeUserFromTeam(userId: string, teamId: string): boolean {
  const team = getTeamById(teamId)
  if (!team) return false
  const index = team.memberUserIds.indexOf(userId)
  if (index === -1) return false
  team.memberUserIds.splice(index, 1)
  return true
}

export function createTeam(name: string, memberUserIds: string[] = [], kind: TeamKind = 'team'): Team {
  const id = `team-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const team: Team = { id, name, kind, memberUserIds }
  TEAMS.push(team)
  return team
}
