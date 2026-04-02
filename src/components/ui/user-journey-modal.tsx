'use client'

import { useMemo } from 'react'
import { X, Folder, FolderSymlink, LayoutGrid, FileText, Inbox, Send, Shield, Eye, Pencil, Ban } from 'lucide-react'
import { Modal } from './modal'
import { Tag } from './tag'
import { Avatar } from './avatar'
import { useAccess, usePersona, useSmartCollections, useUserCollections } from '@/hooks'
import { DEPARTMENT_FOLDER_MAP } from '@/lib/workspace-data'
import { departmentConfigs } from '@/lib/department-configs'
import type { DepartmentId } from '@/components/department/types'
import { profileLabel } from '@/lib/grants'

interface UserJourneyModalProps {
  open: boolean
  onClose: () => void
}

export function UserJourneyModal({ open, onClose }: UserJourneyModalProps) {
  const { activePersona } = usePersona()
  const {
    canAccess,
    accessibleFolderIds,
    sharesReceivedByMe,
    sharesCreatedByMe,
    canShare,
    roleGroups,
  } = useAccess()
  const { visibleCollections: smartCollections } = useSmartCollections()
  const { collections: userCollections } = useUserCollections()

  const ALL_DEPARTMENTS = Object.keys(DEPARTMENT_FOLDER_MAP) as DepartmentId[]

  const accessibleDepartments = useMemo(() => {
    return ALL_DEPARTMENTS.filter(dept => canAccess(DEPARTMENT_FOLDER_MAP[dept].id))
  }, [canAccess])

  const sharedFolders = useMemo(() => {
    return sharesReceivedByMe.filter(s => s.resourceType === 'folder')
  }, [sharesReceivedByMe])

  const sharedCollections = useMemo(() => {
    return sharesReceivedByMe.filter(s => s.resourceType === 'collection')
  }, [sharesReceivedByMe])

  const sharedAssets = useMemo(() => {
    return sharesReceivedByMe.filter(s => s.resourceType === 'asset')
  }, [sharesReceivedByMe])

  if (!activePersona) return null

  const canShareAny = activePersona.role === 'manager' || activePersona.role === 'artist'
  const canEditAny = activePersona.role === 'manager' || activePersona.role === 'artist'

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()} size="md">
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-dim">
          <div className="flex items-center gap-3">
            <Avatar name={activePersona.name} size="lg" />
            <div>
              <h2 className="text-body-1-bold text-foreground">{activePersona.name}</h2>
              <p className="text-body-0-regular text-foreground-dim">{activePersona.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Tag size="compact" variant="border">{activePersona.role}</Tag>
                {activePersona.departmentId && (
                  <Tag size="compact" variant="border" type="informative">
                    {departmentConfigs[activePersona.departmentId]?.name}
                  </Tag>
                )}
                {activePersona.teamIds.length > 0 && (
                  <Tag size="compact" variant="border" type="neutral">
                    {activePersona.teamIds.length} team{activePersona.teamIds.length !== 1 ? 's' : ''}
                  </Tag>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-surface-3 text-foreground-dim hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Capabilities */}
          <section className="space-y-2">
            <h3 className="text-body-0-bold text-foreground">Capabilities</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-body-0-regular">
                {canShareAny ? <Send className="w-4 h-4 text-green-500" /> : <Ban className="w-4 h-4 text-foreground-dim" />}
                <span className={canShareAny ? 'text-foreground' : 'text-foreground-dim'}>Share content</span>
              </div>
              <div className="flex items-center gap-2 text-body-0-regular">
                {canEditAny ? <Pencil className="w-4 h-4 text-green-500" /> : <Ban className="w-4 h-4 text-foreground-dim" />}
                <span className={canEditAny ? 'text-foreground' : 'text-foreground-dim'}>Edit & tag</span>
              </div>
              <div className="flex items-center gap-2 text-body-0-regular">
                <Eye className="w-4 h-4 text-green-500" />
                <span className="text-foreground">View shared</span>
              </div>
            </div>
          </section>

          {/* Workspace Access */}
          <section className="space-y-2">
            <h3 className="text-body-0-bold text-foreground">Workspace Access</h3>
            {accessibleDepartments.length > 0 ? (
              <div className="space-y-1">
                {accessibleDepartments.map(dept => (
                  <div key={dept} className="flex items-center gap-2 py-1 text-body-0-regular">
                    <Folder className="w-4 h-4 text-foreground-dim" />
                    <span className="text-foreground">{departmentConfigs[dept]?.name}</span>
                    <Tag size="compact" type="positive" variant="border">Full access</Tag>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-body-0-regular text-foreground-dim">No department workspace access</p>
            )}
            {sharedFolders.length > 0 && (
              <div className="space-y-1 pt-1">
                <p className="text-body-0-regular text-foreground-dim">Shared folders</p>
                {sharedFolders.map(f => (
                  <div key={f.id} className="flex items-center gap-2 py-1 text-body-0-regular">
                    <FolderSymlink className="w-4 h-4 text-foreground-dim" />
                    <span className="text-foreground">{f.label}</span>
                    <Tag size="compact" variant="border">{profileLabel(f.templateId, roleGroups)}</Tag>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Inbox — what's been shared with me */}
          <section className="space-y-2">
            <h3 className="text-body-0-bold text-foreground">
              Inbox
              {sharesReceivedByMe.length > 0 && (
                <span className="text-foreground-dim ml-2 text-body-0-regular">{sharesReceivedByMe.length} items</span>
              )}
            </h3>
            {sharesReceivedByMe.length === 0 ? (
              <p className="text-body-0-regular text-foreground-dim">Nothing shared with you yet</p>
            ) : (
              <div className="space-y-1">
                {sharedCollections.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-1 text-body-0-regular">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-foreground-dim" />
                      <span className="text-foreground">{s.label}</span>
                    </div>
                    <Tag size="compact" variant="border">{profileLabel(s.templateId, roleGroups)}</Tag>
                  </div>
                ))}
                {sharedAssets.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-1 text-body-0-regular">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-foreground-dim" />
                      <span className="text-foreground">{s.label}</span>
                    </div>
                    <Tag size="compact" variant="border">{profileLabel(s.templateId, roleGroups)}</Tag>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Outgoing — what I've shared */}
          {sharesCreatedByMe.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-body-0-bold text-foreground">
                Shared by you
                <span className="text-foreground-dim ml-2 text-body-0-regular">{sharesCreatedByMe.length} items</span>
              </h3>
              <div className="space-y-1">
                {sharesCreatedByMe.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-1 text-body-0-regular">
                    <div className="flex items-center gap-2">
                      {s.resourceType === 'collection' ? <LayoutGrid className="w-4 h-4 text-foreground-dim" /> :
                       s.resourceType === 'folder' ? <FolderSymlink className="w-4 h-4 text-foreground-dim" /> :
                       <FileText className="w-4 h-4 text-foreground-dim" />}
                      <span className="text-foreground">{s.label}</span>
                    </div>
                    <span className="text-body-0-regular text-foreground-dim">{s.principalLabel}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Collections visible */}
          <section className="space-y-2">
            <h3 className="text-body-0-bold text-foreground">
              Collections
              <span className="text-foreground-dim ml-2 text-body-0-regular">
                {smartCollections.length} smart, {userCollections.length} curated
              </span>
            </h3>
          </section>
        </div>
      </div>
    </Modal>
  )
}
