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
  'vfx-coordinator',
  'editorial-artist',
  'editorial-coordinator',
  'art-artist',
  'vfx-supervisor',
  'vendor-framestore',
  'camera-dit',
  'audio-supervisor',
] as const

const DESKTOP_ELIGIBLE_PERSONA_ID_SET = new Set<string>(DESKTOP_ELIGIBLE_PERSONA_IDS)

export function isDesktopEligiblePersona(persona: User | null | undefined): persona is User {
  return !!persona && DESKTOP_ELIGIBLE_PERSONA_ID_SET.has(persona.id)
}

export function getDesktopEligiblePersonas(): User[] {
  return PERSONAS.filter((persona) => DESKTOP_ELIGIBLE_PERSONA_ID_SET.has(persona.id))
}
