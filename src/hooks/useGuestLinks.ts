'use client'

import { useState, useCallback } from 'react'
import { buildGuestLinks } from '@/lib/scenario'
import type { GuestLinkSeed } from '@/lib/scenario'
import type { Grant, ResourceRef, ResourceType } from '@/lib/grants'
import type { User } from '@/lib/personas'

type CanShareFn = (resource: ResourceRef, currentGrants: Grant[]) => boolean
type CanEditAclFn = (resource: ResourceRef, currentGrants: Grant[]) => boolean

export function useGuestLinks(
  grants: Grant[],
  canShareFn: CanShareFn,
  canEditAclFn: CanEditAclFn,
  activePersona: User | null,
) {
  const [guestLinks, setGuestLinks] = useState<GuestLinkSeed[]>(() => buildGuestLinks())
  const userId = activePersona?.id ?? null

  const getResourceGuestLinks = useCallback((resourceId: string) =>
    guestLinks.filter(l => l.resource.id === resourceId),
  [guestLinks])

  const canManageGuestLinkForState = useCallback((link: GuestLinkSeed, currentGrants: Grant[]): boolean => {
    if (!activePersona) return true
    const resource: ResourceRef = {
      id: link.resource.id,
      type: link.resource.type as ResourceType,
      domainId: link.resource.domainId,
    }
    if (canEditAclFn(resource, currentGrants)) return true
    return Boolean(userId && canShareFn(resource, currentGrants) && link.createdByUserId === userId)
  }, [activePersona, canEditAclFn, canShareFn, userId])

  const canManageGuestLink = useCallback((link: GuestLinkSeed): boolean => {
    return canManageGuestLinkForState(link, grants)
  }, [canManageGuestLinkForState, grants])

  const createGuestLink = useCallback((resource: ResourceRef, options: { allowDownload: boolean; passcode: boolean; expiresInDays: number; label?: string }) => {
    if (!activePersona) return
    if (!canShareFn(resource, grants)) return

    const now = new Date()
    const expires = new Date(now)
    expires.setDate(expires.getDate() + options.expiresInDays)
    const link: GuestLinkSeed = {
      id: `link-${Date.now()}`,
      resource: { id: resource.id, type: resource.type, domainId: resource.domainId },
      label: options.label ?? resource.id,
      permissions: options.allowDownload ? ['open', 'download'] : ['open'],
      templateId: 'link-viewer',
      createdByUserId: activePersona.id,
      createdAt: now.toISOString().slice(0, 10),
      expiresAt: expires.toISOString().slice(0, 10),
      allowDownload: options.allowDownload,
      passcode: options.passcode,
    }
    setGuestLinks((prev) => [...prev, link])
    return link
  }, [activePersona, grants, canShareFn])

  const updateGuestLink = useCallback((linkId: string, updates: Partial<Pick<GuestLinkSeed, 'allowDownload' | 'passcode' | 'expiresAt'>>) => {
    setGuestLinks((prev) => prev.map((link) => {
      if (link.id !== linkId) return link
      if (!canManageGuestLinkForState(link, grants)) return link
      return {
        ...link,
        ...updates,
        permissions: (updates.allowDownload ?? link.allowDownload) ? ['open' as const, 'download' as const] : ['open' as const],
      }
    }))
  }, [grants, canManageGuestLinkForState])

  const revokeGuestLink = useCallback((linkId: string) => {
    setGuestLinks((prev) => {
      const link = prev.find((candidate) => candidate.id === linkId)
      if (!link || !canManageGuestLinkForState(link, grants)) return prev
      return prev.filter((candidate) => candidate.id !== linkId)
    })
  }, [grants, canManageGuestLinkForState])

  const restoreResourceGuestLinks = useCallback((resourceId: string, snapshot: GuestLinkSeed[]) => {
    setGuestLinks((prev) => {
      const otherLinks = prev.filter((link) => link.resource.id !== resourceId)
      return [...otherLinks, ...snapshot]
    })
  }, [])

  /** Expire all guest links (used by project lockdown) */
  const expireAllGuestLinks = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10)
    setGuestLinks(prev => prev.map(link => ({
      ...link,
      expiresAt: today,
    })))
  }, [])

  return {
    guestLinks,
    getResourceGuestLinks,
    canManageGuestLink,
    createGuestLink,
    updateGuestLink,
    revokeGuestLink,
    restoreResourceGuestLinks,
    expireAllGuestLinks,
  }
}
