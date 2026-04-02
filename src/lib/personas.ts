import type { DepartmentId } from '@/components/department/types'
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
  departmentId?: DepartmentId
  teamIds: string[]
  avatar?: string
  isAdmin?: boolean
}

/** Backward-compat alias — use User instead */
export type Persona = User

export const PERSONAS: User[] = buildPersonas()

export const DESKTOP_ELIGIBLE_PERSONA_IDS = [
  'vfx-coordinator',
  'editorial-artist',
  'editorial-coordinator',
  'art-artist',
  'vfx-supervisor',
  'vendor-framestore',
] as const

const DESKTOP_ELIGIBLE_PERSONA_ID_SET = new Set<string>(DESKTOP_ELIGIBLE_PERSONA_IDS)

/** Find a persona by email */
export function getPersonaForEmail(email: string): User | undefined {
  return PERSONAS.find((p) => p.email === email)
}

/** Get display name for an email, falling back to the email itself */
export function getPersonaName(email: string): string {
  return getPersonaForEmail(email)?.name ?? email
}

/** Get initials from a name (e.g. "Sarah Chen" -> "SC") */
export function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export function isDepartmentRole(role: UserRole): boolean {
  return role === 'manager' || role === 'artist'
}

export function isDepartmentPersona(persona: User | null | undefined): persona is User & { departmentId: DepartmentId } {
  return !!persona && isDepartmentRole(persona.role) && !!persona.departmentId
}

export function isDesktopEligiblePersona(persona: User | null | undefined): persona is User {
  return !!persona && DESKTOP_ELIGIBLE_PERSONA_ID_SET.has(persona.id)
}

export function getDesktopEligiblePersonas(): User[] {
  return PERSONAS.filter((persona) => DESKTOP_ELIGIBLE_PERSONA_ID_SET.has(persona.id))
}

export function getDepartmentMemberEmails(departmentId: DepartmentId): string[] {
  return PERSONAS
    .filter((persona) => persona.departmentId === departmentId && isDepartmentRole(persona.role))
    .map((persona) => persona.email)
}
