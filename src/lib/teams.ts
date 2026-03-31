import type { DepartmentId } from '@/components/department/types'
import { buildTeams } from '@/lib/scenario'

export type Team = {
  id: string
  name: string
  memberUserIds: string[]
  departmentId?: DepartmentId
}

export const TEAMS: Team[] = buildTeams()

export function getTeamsForUser(userId: string): Team[] {
  return TEAMS.filter((t) => t.memberUserIds.includes(userId))
}

export function getTeamById(id: string): Team | undefined {
  return TEAMS.find((t) => t.id === id)
}

export function isUserInTeam(userId: string, teamId: string): boolean {
  const team = getTeamById(teamId)
  return team ? team.memberUserIds.includes(userId) : false
}
