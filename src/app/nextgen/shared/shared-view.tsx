'use client'

import { useState, useCallback } from 'react'
import { Link2, Lock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, Tag, SharedSidePanel, EmptyState, MobileToolbar } from '@/components/ui'
import { AccessKindIcon } from '@/components/ui/access-kind-icon'
import { ToggleButtonGroup } from '@/components/ui/toggle-button-group'
import { useAccess, usePersona } from '@/hooks'
import type { GrantView } from '@/lib/grants'
import type { GuestLinkSeed } from '@/lib/scenario'
import { kindLabel, kindTagType } from '@/lib/access'
import type { AccessEntryKind } from '@/lib/access'
import { profileLabel } from '@/lib/grants'
import { PERSONAS } from '@/lib/personas'
import { cn, formatDate } from '@/lib/utils'

type ShareTab = 'mine' | 'all'


function ShareTable({
  entries,
  selectedId,
  onRowClick,
  principalColumnLabel,
}: {
  entries: GrantView[]
  selectedId: string | null
  onRowClick: (entry: GrantView) => void
  principalColumnLabel: string
}) {
  if (entries.length === 0) return null

  return (
    <div>
      {/* Table header */}
      <div className="grid grid-cols-[1fr_100px_100px_140px_120px] gap-4 px-3 py-2 text-label-0-bold uppercase text-foreground-dim border-b border-border-dim">
        <span>Name</span>
        <span>Type</span>
        <span>Permission</span>
        <span>{principalColumnLabel}</span>
        <span>Date</span>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-border-dim">
        {entries.map(entry => {
          const isSelected = selectedId === entry.id
          const kind = entry.resourceType as AccessEntryKind
          return (
            <button
              key={entry.id}
              onClick={() => onRowClick(entry)}
              className={cn(
                'w-full grid grid-cols-[1fr_100px_100px_140px_120px] gap-4 px-3 py-3 text-left transition-colors',
                isSelected
                  ? 'bg-indigo-500/10'
                  : 'hover:bg-surface-2'
              )}
            >
              {/* Name */}
              <span className="flex items-center gap-2 min-w-0">
                <AccessKindIcon kind={kind} size="sm" />
                <span className="text-body-0-bold text-foreground truncate">
                  {entry.label}
                </span>
              </span>

              {/* Type */}
              <span className="flex items-center">
                <Tag size="compact" type={kindTagType(kind)}>
                  {kindLabel(kind)}
                </Tag>
              </span>

              {/* Permission */}
              <span className="flex items-center">
                <Tag size="compact" type="neutral">
                  {profileLabel(entry.templateId)}
                </Tag>
              </span>

              {/* Principal */}
              <span className="text-body-0-regular text-foreground-subtle truncate flex items-center">
                {entry.principalLabel}
              </span>

              {/* Date */}
              <span className="text-body-0-regular text-foreground-subtle flex items-center">
                {formatDate(entry.grantedAt)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function GuestLinksSection({ links, selectedId, onRowClick }: { links: GuestLinkSeed[]; selectedId: string | null; onRowClick: (link: GuestLinkSeed) => void }) {
  if (links.length === 0) return null

  return (
    <div className="mt-6">
      <h3 className="text-label-1-bold text-foreground-dim px-3 pb-2">Links</h3>
      <div className="divide-y divide-border-dim">
        {links.map(link => {
          const isSelected = selectedId === link.id
          return (
            <button
              key={link.id}
              onClick={() => onRowClick(link)}
              className={cn(
                'w-full grid grid-cols-[1fr_100px_100px_140px_120px] gap-4 px-3 py-3 text-left transition-colors',
                isSelected ? 'bg-indigo-500/10' : 'hover:bg-surface-2',
              )}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Link2 className="w-4 h-4 text-foreground-dim flex-shrink-0" />
                <span className="text-body-0-bold text-foreground truncate">{link.label}</span>
                {link.passcode && <Lock className="w-3 h-3 text-foreground-dim flex-shrink-0" />}
              </span>
              <span className="flex items-center">
                <Tag size="compact" type="neutral">Link</Tag>
              </span>
              <span className="flex items-center">
                <Tag size="compact" type="neutral">{link.allowDownload ? 'View + DL' : 'View only'}</Tag>
              </span>
              <span className="text-body-0-regular text-foreground-subtle truncate flex items-center">
                {(() => {
                  const p = PERSONAS.find(persona => persona.id === link.createdByUserId)
                  return p?.name ?? link.createdByUserId
                })()}
              </span>
              <span className="text-body-0-regular text-foreground-subtle flex items-center">
                {formatDate(link.expiresAt)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function GuestLinkDetailPanel({ link, onClose, onRevoke, canRevoke }: { link: GuestLinkSeed; onClose: () => void; onRevoke: (id: string) => void; canRevoke: boolean }) {
  const creator = PERSONAS.find(p => p.id === link.createdByUserId)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const url = `${window.location.origin}/nextgen/link/${link.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="w-[340px] border-l border-border-dim flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border-dim">
        <span className="text-body-0-bold text-foreground">Link</span>
        <Button variant="icon" compact onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <div>
            <p className="text-body-0-regular text-foreground-dim">Resource</p>
            <p className="text-body-0-regular text-foreground">{link.label}</p>
          </div>
          <div>
            <p className="text-body-0-regular text-foreground-dim">Permission</p>
            <p className="text-body-0-regular text-foreground">{link.allowDownload ? 'View + Download' : 'View only'}</p>
          </div>
          <div>
            <p className="text-body-0-regular text-foreground-dim">Created by</p>
            <p className="text-body-0-regular text-foreground">{creator?.name ?? link.createdByUserId}</p>
          </div>
          <div>
            <p className="text-body-0-regular text-foreground-dim">Created</p>
            <p className="text-body-0-regular text-foreground">{formatDate(link.createdAt)}</p>
          </div>
          <div>
            <p className="text-body-0-regular text-foreground-dim">Expires</p>
            <p className="text-body-0-regular text-foreground">{formatDate(link.expiresAt)}</p>
          </div>
          {link.passcode && (
            <div>
              <p className="text-body-0-regular text-foreground-dim">Passcode</p>
              <p className="text-body-0-regular text-foreground">Required</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" compact onClick={handleCopy}>
            <Link2 className="w-3 h-3 mr-1" />
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
          {canRevoke && (
            <Button variant="secondary" compact onClick={() => onRevoke(link.id)}>
              <X className="w-3 h-3 mr-1" />
              Revoke
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

const TAB_OPTIONS: { value: ShareTab; label: string }[] = [
  { value: 'mine', label: 'Mine' },
  { value: 'all', label: 'All' },
]

export function SharedView({ initialSelectedId = null }: { initialSelectedId?: string | null }) {
  const { sharesCreatedByMe, allProjectShares, revokeGrant, canManageGrant, guestLinks, canManageGuestLink, revokeGuestLink } = useAccess()
  const { activePersona, isAdmin, hydrated } = usePersona()
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId)
  const [activeTab, setActiveTab] = useState<ShareTab>(!activePersona ? 'all' : 'mine')

  const displayEntries = activeTab === 'all' && isAdmin ? allProjectShares : sharesCreatedByMe
  const displayLinks = activeTab === 'all' && isAdmin
    ? guestLinks
    : guestLinks.filter(l => l.createdByUserId === activePersona?.id)

  const [selectedType, setSelectedType] = useState<'grant' | 'link'>('grant')

  const selectedEntry = selectedType === 'grant' ? (displayEntries.find(e => e.id === selectedId) ?? null) : null
  const selectedLink = selectedType === 'link' ? (displayLinks.find(l => l.id === selectedId) ?? null) : null

  const handleRowClick = useCallback((entry: GrantView) => {
    setSelectedId(prev => prev === entry.id ? null : entry.id)
    setSelectedType('grant')
  }, [])

  const handleLinkClick = useCallback((link: GuestLinkSeed) => {
    setSelectedId(prev => prev === link.id ? null : link.id)
    setSelectedType('link')
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedId(null)
  }, [])

  const handleRevokeGrant = useCallback((grantId: string) => {
    revokeGrant(grantId)
    setSelectedId(null)
  }, [revokeGrant])

  const handleRevokeLink = useCallback((linkId: string) => {
    revokeGuestLink(linkId)
    setSelectedId(null)
  }, [revokeGuestLink])

  const totalCount = displayEntries.length + displayLinks.length

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="p-6 pb-0 space-y-3">
          <MobileToolbar title="Shared" />
          <div className="flex items-center justify-between">
            <PageHeader
              title="Shared"
              description={`${totalCount} shared item${totalCount !== 1 ? 's' : ''}`}
              hideTitleOnMobile
            />
            {isAdmin && (
              <ToggleButtonGroup<ShareTab>
                options={TAB_OPTIONS}
                value={activeTab}
                onChange={(v) => setActiveTab(v)}
                compact
              />
            )}
          </div>
        </div>

        {!hydrated ? (
          <div className="flex-1" />
        ) : displayEntries.length === 0 && displayLinks.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              title="No shared items"
              message={
                activeTab === 'all'
                  ? 'No shared items across the project.'
                  : 'Items you share with others will appear here.'
              }
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            <ShareTable
              entries={displayEntries}
              selectedId={selectedId}
              onRowClick={handleRowClick}
              principalColumnLabel="Recipient"
            />
            <GuestLinksSection links={displayLinks} selectedId={selectedType === 'link' ? selectedId : null} onRowClick={handleLinkClick} />
          </div>
        )}
      </div>

      {/* Side panel */}
      {selectedEntry && (
        <SharedSidePanel
          entry={selectedEntry}
          onClose={handleClosePanel}
          onRevokeGrant={handleRevokeGrant}
          canRevokeGrant={canManageGrant(selectedEntry.id)}
        />
      )}
      {selectedLink && (
        <GuestLinkDetailPanel
          link={selectedLink}
          onClose={handleClosePanel}
          onRevoke={handleRevokeLink}
          canRevoke={canManageGuestLink(selectedLink)}
        />
      )}
    </div>
  )
}
