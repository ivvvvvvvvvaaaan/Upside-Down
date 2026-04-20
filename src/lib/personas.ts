import type { DomainId } from '@/components/department/types'
import { buildPersonas } from '@/lib/scenario'

export type UserRole =
  | 'studio-exec'
  | 'creative'
  | 'manager'
  | 'artist'
  | 'vendor'

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  title: string
  domainId?: DomainId
  teamIds: string[]
  avatar?: string
  isAdmin?: boolean
  /** Whether this user can view sensitive/restricted media */
  sensitiveMediaCapability?: boolean
}

export const DIRECTORY_UPDATED_EVENT = 'prototype-directory-updated'
export const PERSONAS: User[] = buildPersonas()

const DESKTOP_ELIGIBLE_PERSONA_IDS = [
  'studio-alex',
  'creative-david',
  'vfx-supervisor',
  'vfx-coordinator',
  'editorial-coordinator',
  'editorial-artist',
  'art-artist',
  'camera-dit',
  'audio-supervisor',
  'vendor-framestore',
  'marketing-coordinator',
  'legal-reviewer',
] as const

const DESKTOP_ELIGIBLE_PERSONA_ID_SET = new Set<string>(DESKTOP_ELIGIBLE_PERSONA_IDS)

export function isDesktopEligiblePersona(persona: User | null | undefined): persona is User {
  return !!persona && DESKTOP_ELIGIBLE_PERSONA_ID_SET.has(persona.id)
}

export function getDesktopEligiblePersonas(): User[] {
  return PERSONAS.filter((persona) => DESKTOP_ELIGIBLE_PERSONA_ID_SET.has(persona.id))
}
