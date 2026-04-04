import type { DepartmentId } from '@/components/department/types'
import { buildTeams } from '@/lib/scenario'

export type Team = {
  id: string
  name: string
  memberUserIds: string[]
  departmentId?: DepartmentId
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
