import { beforeEach, describe, expect, it } from 'vitest'
import { PERSONAS } from '@/lib/personas'
import { buildPersonas, buildTeams } from '@/lib/scenario'
import {
  TEAMS,
  addTeamManager,
  createTeam,
  removeUserFromTeam,
} from '@/lib/teams'

function resetDirectory() {
  PERSONAS.splice(0, PERSONAS.length, ...buildPersonas())
  TEAMS.splice(0, TEAMS.length, ...buildTeams())
}

describe('team managers', () => {
  beforeEach(() => {
    resetDirectory()
  })

  it('promoting a manager also ensures team membership', () => {
    const team = TEAMS.find((candidate) => candidate.id === 'editorial')
    const persona = PERSONAS.find((candidate) => candidate.id === 'studio-alex')

    expect(team).toBeDefined()
    expect(persona).toBeDefined()
    expect(team!.memberUserIds).not.toContain(persona!.id)
    expect(persona!.teamIds).not.toContain(team!.id)

    expect(addTeamManager(persona!.id, team!.id)).toBe(true)

    expect(team!.managerUserIds).toContain(persona!.id)
    expect(team!.memberUserIds).toContain(persona!.id)
    expect(persona!.teamIds).toContain(team!.id)
    expect(persona!.domainId).toBe('editorial')
  })

  it('prevents removing the only manager through team membership removal', () => {
    const team = TEAMS.find((candidate) => candidate.id === 'art-design')

    expect(team).toBeDefined()
    expect(team!.managerUserIds).toEqual(['art-artist'])

    expect(removeUserFromTeam('art-artist', team!.id)).toBe(false)

    expect(team!.managerUserIds).toEqual(['art-artist'])
    expect(team!.memberUserIds).toContain('art-artist')
  })

  it('removing a member clears their manager role when other managers remain', () => {
    const team = TEAMS.find((candidate) => candidate.id === 'netflix-post')
    const persona = PERSONAS.find((candidate) => candidate.id === 'audio-supervisor')

    expect(team).toBeDefined()
    expect(persona).toBeDefined()
    expect(team!.managerUserIds).toContain(persona!.id)

    expect(removeUserFromTeam(persona!.id, team!.id)).toBe(true)

    expect(team!.memberUserIds).not.toContain(persona!.id)
    expect(team!.managerUserIds).not.toContain(persona!.id)
    expect(persona!.teamIds).not.toContain(team!.id)
  })

  it('creates new groups with managers included in membership', () => {
    const persona = PERSONAS.find((candidate) => candidate.id === 'studio-alex')

    expect(persona).toBeDefined()

    const team = createTeam('Pipeline Ops', [], 'group', [persona!.id])

    expect(team.managerUserIds).toEqual([persona!.id])
    expect(team.memberUserIds).toEqual([persona!.id])
    expect(persona!.teamIds).toContain(team.id)
  })
})
