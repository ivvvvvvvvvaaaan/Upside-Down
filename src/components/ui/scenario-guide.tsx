'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight, Check, Circle, ArrowRight, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { useAccess, usePersona } from '@/hooks'
import { useUserCollections } from '@/hooks/useUserCollections'
import { useFileTree } from '@/hooks'
import { PHASES, getCurrentPhase, getPhaseForPersona, getStepPersonaId } from '@/lib/scenario-phases'
import type { CheckpointPrincipal, PhaseStep } from '@/lib/scenario-phases'
import { PERSONAS } from '@/lib/personas'
import type { Asset } from '@/lib/data'
import type { Grant } from '@/lib/grants'
import { isGrantActive } from '@/lib/grants'
import type { UnifiedFileNode } from '@/lib/workspace-data'
import { USER_TAGS_CHANGED_EVENT, USER_TAGS_STORAGE_KEY, normalizeUserTagKey, readUserTagsMap } from '@/lib/user-tags'

const GUIDE_STORAGE_KEY = 'scenario-guide-collapsed'
const COMPLETED_STEPS_KEY = 'scenario-completed-steps'

function useCompletedSteps() {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COMPLETED_STEPS_KEY)
      if (stored) setCompletedSteps(new Set(JSON.parse(stored)))
    } catch {}
  }, [])

  const markCompleted = useCallback((stepId: string) => {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      next.add(stepId)
      try { localStorage.setItem(COMPLETED_STEPS_KEY, JSON.stringify(Array.from(next))) } catch {}
      return next
    })
  }, [])

  const resetAll = useCallback(() => {
    // Nuclear reset: enable phase mode, clear all app state, reload
    try {
      localStorage.setItem('scenario-phase-mode', 'true')
      localStorage.setItem('scenario-reset-time', String(Date.now()))
      const keysToRemove = [
        COMPLETED_STEPS_KEY,
        GUIDE_STORAGE_KEY,
        // Grants
        'access-grants',
        'access-grants-version',
        'access-grants-mode',
        'access-role-groups',
        // Collections
        'user-collections',
        'user-collections-version',
        'smart-collections',
        'smart-collections-version',
        // File tree
        'unified-workspace-files',
        'unified-workspace-files-version',
        // Nav / UI
        'nav-expanded',
        'nav-scroll-top',
        'sidebar-width',
        // Guest links, blocks, etc.
        'guest-links',
        'user-blocks',
        USER_TAGS_STORAGE_KEY,
        'asset-hidden-tags',
        'read-share-ids',
      ]
      for (const key of keysToRemove) localStorage.removeItem(key)
    } catch {}
    window.location.reload()
  }, [])

  return { completedSteps, markCompleted, resetAll }
}

function readUserTags(): Record<string, string[]> {
  return readUserTagsMap()
}

function normalizeTag(value: string): string {
  return normalizeUserTagKey(value)
}

function isUserCreatedFileId(id: string): boolean {
  return /^ws-\d{13}/.test(id)
}

function findNode(nodes: UnifiedFileNode[], id: string): UnifiedFileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

function collectFileIds(nodes: UnifiedFileNode[]): string[] {
  const ids: string[] = []
  for (const node of nodes) {
    if (node.type === 'file') ids.push(node.id)
    if (node.children) ids.push(...collectFileIds(node.children))
  }
  return ids
}

function getFileIdsInFolder(nodes: UnifiedFileNode[], folderId: string): string[] {
  const folder = findNode(nodes, folderId)
  return folder?.children ? collectFileIds(folder.children) : []
}

function assetHasTag(
  assetId: string,
  tag: string,
  assetById: Map<string, Asset>,
  userTags: Record<string, string[]>,
): boolean {
  const target = normalizeTag(tag)
  if ((userTags[assetId] ?? []).some(candidate => normalizeTag(candidate) === target)) return true

  const asset = assetById.get(assetId)
  if (!asset) return false
  if (target === 'circle take' && asset.isCircleTake) return true
  return asset.tags?.some(candidate => normalizeTag(candidate.label) === target) ?? false
}

function principalMatches(grant: Grant, requirement: CheckpointPrincipal): boolean {
  if (requirement.principalType === 'user') {
    return grant.principal.type === 'user' && grant.principal.userId === requirement.principalId
  }
  if (requirement.principalType === 'team') {
    return grant.principal.type === 'team' && grant.principal.teamId === requirement.principalId
  }
  return grant.principal.type === 'domain' && grant.principal.domainId === requirement.principalId
}

function hasRequiredGrants(
  grants: Grant[],
  principals: CheckpointPrincipal[],
  grantedByUserId: string,
): boolean {
  return principals.every(principal =>
    grants.some(grant =>
      isGrantActive(grant) &&
      grant.grantedByUserId === grantedByUserId &&
      principalMatches(grant, principal)
    )
  )
}

function pathContainsResource(pathname: string, basePath: string, resourceId: string): boolean {
  if (!pathname.startsWith(basePath)) return false
  return pathname.split('/').filter(Boolean).includes(resourceId)
}

function StepRow({ step, isCompleted, isActive }: { step: PhaseStep; isCompleted: boolean; isActive: boolean }) {
  return (
    <div className="flex gap-2 py-1.5">
      <div className="flex-shrink-0 mt-[5px]">
        {isCompleted ? (
          <div className="w-3 h-3 rounded-full bg-white flex items-center justify-center">
            <Check className="w-2 h-2 text-black" strokeWidth={3} />
          </div>
        ) : isActive ? (
          <div className="w-3 h-3 rounded-full border-[1.5px] border-white" />
        ) : (
          <Circle className="w-3 h-3 text-white/30" />
        )}
      </div>
      <span className={cn('text-body-0-regular', isCompleted ? 'line-through text-foreground' : isActive ? 'text-foreground' : 'text-white/40')}>
        {step.instruction}
      </span>
    </div>
  )
}

export function ScenarioGuide() {
  const pathname = usePathname()
  const { activePersona, setActivePersona, allPersonas } = usePersona()
  const { getResourceGrants, sharesReceivedByMe } = useAccess()
  const { collections } = useUserCollections()
  const { tree: fileTree, assetById } = useFileTree()
  const { completedSteps, markCompleted, resetAll } = useCompletedSteps()

  const [collapsed, setCollapsed] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [userTagsState, setUserTagsState] = useState<Record<string, string[]>>(() => readUserTags())
  const containerRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number; dragged: boolean } | null>(null)

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem(GUIDE_STORAGE_KEY, String(next)) } catch {}
      return next
    })
  }, [])

  useEffect(() => {
    try {
      if (localStorage.getItem(GUIDE_STORAGE_KEY) === 'true') setCollapsed(true)
    } catch {}
  }, [])

  useEffect(() => {
    const reloadTags = () => setUserTagsState(readUserTags())
    const handleStorage = (event: StorageEvent) => {
      if (event.key === USER_TAGS_STORAGE_KEY) reloadTags()
    }

    window.addEventListener(USER_TAGS_CHANGED_EVENT, reloadTags)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(USER_TAGS_CHANGED_EVENT, reloadTags)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  // Drag behavior — listeners on window so drag works outside the card
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragState.current) return
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.current.dragged = true
      if (dragState.current.dragged) {
        setPosition({ x: dragState.current.origX + dx, y: dragState.current.origY + dy })
      }
    }
    const handleUp = () => { dragState.current = null }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [])

  // Determine completed phases
  const completedPhaseIds = useMemo(() => {
    const ids = new Set<string>()
    for (const phase of PHASES) {
      if (phase.steps.every(step => completedSteps.has(step.id))) {
        ids.add(phase.id)
      }
    }
    return ids
  }, [completedSteps])

  const currentPhase = getCurrentPhase(completedPhaseIds)
  const personaResult = activePersona ? getPhaseForPersona(activePersona.id, completedPhaseIds, completedSteps) : null
  const personaPhase = personaResult?.phase ?? null
  const isLocked = personaResult?.locked ?? false
  const handoffPhase = useMemo(() => {
    if (!activePersona) return null
    return PHASES.find((phase) => {
      if (phase.personaId !== activePersona.id) return false
      if (!phase.nextPersonaId || !completedPhaseIds.has(phase.id)) return false
      return getPhaseForPersona(phase.nextPersonaId, completedPhaseIds, completedSteps) !== null
    }) ?? null
  }, [activePersona, completedPhaseIds, completedSteps])
  const displayPhase = activePersona ? handoffPhase ?? personaPhase : currentPhase
  const allDone = !currentPhase
  const userTags = userTagsState

  // Find the current active step (first incomplete)
  const activeStep = displayPhase?.steps.find(s => !completedSteps.has(s.id))
  // Which persona should be active for the current step?
  const neededPersonaId = displayPhase ? getStepPersonaId(displayPhase, activeStep) : undefined
  const isWrongPersona = !!neededPersonaId && !!activePersona && neededPersonaId !== activePersona.id
  const expectedPersona = neededPersonaId ? PERSONAS.find(p => p.id === neededPersonaId) : null

  // Auto-detect checkpoints — only check the next incomplete step
  useEffect(() => {
    if (!displayPhase || !activePersona) return

    for (const step of displayPhase.steps) {
      if (completedSteps.has(step.id)) continue
      const cp = step.checkpoint
      let matched = false

      // Persona-switch: just check if the right persona is active
      if (cp.type === 'persona-switch') {
        matched = activePersona.id === cp.personaId
      }
      // For other checkpoints, only check if the right persona is active
      const stepPersonaId = getStepPersonaId(displayPhase, step)
      if (cp.type !== 'persona-switch' && stepPersonaId && stepPersonaId !== activePersona.id) break

      if (cp.type === 'grant-set') {
        matched = hasRequiredGrants(getResourceGrants(cp.resourceId), cp.principals, activePersona.id)
      }
      if (cp.type === 'collection-created') {
        const resetTime = Number(localStorage.getItem('scenario-reset-time') ?? '0')
        matched = collections.some(c =>
          c.name.toLowerCase().includes(cp.nameContains.toLowerCase()) &&
          new Date(c.createdAt).getTime() > resetTime
        )
      }
      if (cp.type === 'collection-contains') {
        const collection = collections.find(c => c.id === cp.collectionId)
        const minAssets = cp.minAssets ?? 1
        if (collection) {
          const matchingAssetIds = cp.tag
            ? collection.assetIds.filter(assetId => assetHasTag(assetId, cp.tag, assetById, userTags))
            : collection.assetIds
          matched = matchingAssetIds.length >= minAssets
        }
      }
      if (cp.type === 'file-created') {
        const hasUserFile = (nodes: typeof fileTree): boolean => {
          for (const node of nodes) {
            if (node.type === 'file' && isUserCreatedFileId(node.id)) return true
            if (node.children && hasUserFile(node.children)) return true
          }
          return false
        }
        const targetFolder = findNode(fileTree, cp.parentFolderId)
        if (targetFolder?.children && hasUserFile(targetFolder.children)) {
          matched = true
        }
      }
      if (cp.type === 'asset-tagged') {
        const candidateIds = cp.assetId
          ? [cp.assetId]
          : cp.parentFolderId
            ? getFileIdsInFolder(fileTree, cp.parentFolderId)
            : Object.keys(userTags)
        matched = candidateIds.some(assetId =>
          (!cp.requireUserCreated || isUserCreatedFileId(assetId)) &&
          assetHasTag(assetId, cp.tag, assetById, userTags)
        )
      }
      if (cp.type === 'visit-page') {
        matched = cp.match === 'exact' ? pathname === cp.path : pathname.startsWith(cp.path)
      }
      if (cp.type === 'inbox-resource') {
        matched = pathname === '/nextgen/inbox' && sharesReceivedByMe.some(share =>
          share.resourceId === cp.resourceId &&
          (!cp.grantedByUserId || share.grantedByUserId === cp.grantedByUserId)
        )
      }
      if (cp.type === 'visit-resource') {
        matched = pathContainsResource(pathname, cp.basePath, cp.resourceId)
      }
      if (matched) markCompleted(step.id)
      break
    }
  }, [displayPhase, activePersona, completedSteps, getResourceGrants, collections, fileTree, assetById, userTags, pathname, sharesReceivedByMe, markCompleted])

  // Always render so Reset button is accessible

  return (
    <div
      ref={containerRef}
      className={cn('fixed z-50', collapsed ? 'w-auto' : 'w-80')}
      style={position ? { left: position.x, top: position.y } : { bottom: 16, right: 16 }}
    >
      <div className="bg-black border border-border-dim rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center">
          {/* Drag handle */}
          <div
            onMouseDown={(e) => {
              if (!containerRef.current) return
              const rect = containerRef.current.getBoundingClientRect()
              dragState.current = { startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top, dragged: false }
              e.preventDefault()
            }}
            className="flex items-center justify-center px-1.5 py-2 cursor-grab active:cursor-grabbing text-foreground-dim hover:text-foreground transition-colors"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          {/* Click to toggle */}
          <button
            onClick={toggleCollapsed}
            className={cn(
              'flex-1 flex items-center text-left hover:bg-white/5 transition-colors',
              collapsed ? 'py-2 pr-2 gap-1 group' : 'justify-between gap-2 py-2 pr-3',
            )}
          >
            {collapsed ? (
              <>
                <span className="text-body-0-bold text-foreground">Guide</span>
                <ChevronRight className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />
              </>
            ) : (
              <>
                <span className="text-body-0-bold text-foreground truncate">
                  {allDone ? 'All scenarios done' : displayPhase?.title ?? 'Explore'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />
              </>
            )}
          </button>
        </div>

        {/* Body — collapsible */}
        {!collapsed && (
          <div className="px-3 pb-3 space-y-3">
            {allDone ? (
              <p className="text-body-0-regular text-foreground">
                All scenarios done. Reset to start over.
              </p>
            ) : !displayPhase ? (
              <p className="text-body-0-regular text-foreground">
                No tasks for this user. Switch to another persona or reset.
              </p>
            ) : isLocked && displayPhase.waitingMessage ? (
              <p className="text-body-0-regular text-foreground">
                {displayPhase.waitingMessage}
              </p>
            ) : (
              <>
                <p className="text-body-0-regular text-foreground">
                  {displayPhase.description}
                </p>

                {isWrongPersona && expectedPersona && (
                  <div className="bg-white/5 rounded px-3 py-2 flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
                    <span className="text-body-0-regular text-foreground">
                      Switch to {expectedPersona.name} to continue
                    </span>
                  </div>
                )}

                {!isWrongPersona && (() => {
                  const allStepsDone = displayPhase.steps.every(s => completedSteps.has(s.id))
                  const nextPersona = displayPhase.nextPersonaId ? allPersonas.find(p => p.id === displayPhase.nextPersonaId) : null
                  return (
                    <div className="space-y-0">
                      {displayPhase.steps.map((step, i) => {
                        const isDone = completedSteps.has(step.id)
                        const isActive = !isDone && displayPhase.steps.slice(0, i).every(s => completedSteps.has(s.id))
                        return <StepRow key={step.id} step={step} isCompleted={isDone} isActive={isActive} />
                      })}
                      {allStepsDone && nextPersona && (
                        <button
                          onClick={() => setActivePersona(nextPersona)}
                          className="flex items-center gap-2 py-1.5 text-body-0-regular text-foreground hover:text-foreground-system-link transition-colors"
                        >
                          <ArrowRight className="w-3 h-3 flex-shrink-0" />
                          <span>Continue as {nextPersona.name}</span>
                        </button>
                      )}
                    </div>
                  )
                })()}
              </>
            )}

            <div className="pt-1 flex justify-end">
              <Button variant="tertiary" compact onClick={resetAll}>
                Reset
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
