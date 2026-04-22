'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronUp, Check, Circle, ArrowRight, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { useAccess, usePersona } from '@/hooks'
import { useUserCollections } from '@/hooks/useUserCollections'
import { useFileTree } from '@/hooks'
import { PHASES, getCurrentPhase, getPhaseForPersona } from '@/lib/scenario-phases'
import type { Phase, PhaseStep } from '@/lib/scenario-phases'
import { PERSONAS } from '@/lib/personas'

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
      const keysToRemove = [
        COMPLETED_STEPS_KEY,
        GUIDE_STORAGE_KEY,
        // Grants
        'access-grants',
        'access-grants-version',
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
        'read-share-ids',
      ]
      for (const key of keysToRemove) localStorage.removeItem(key)
    } catch {}
    window.location.reload()
  }, [])

  return { completedSteps, markCompleted, resetAll }
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
  const { activePersona } = usePersona()
  const { getResourceGrants } = useAccess()
  const { collections } = useUserCollections()
  const { tree: fileTree } = useFileTree()
  const { completedSteps, markCompleted, resetAll } = useCompletedSteps()

  const [collapsed, setCollapsed] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // Only drag from the header area, not from buttons
    if ((e.target as HTMLElement).closest('button')) return
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
    }
    e.preventDefault()
  }, [])

  useEffect(() => {
    if (!dragRef.current) return
    const handleMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      setPosition({
        x: dragRef.current.origX + dx,
        y: dragRef.current.origY + dy,
      })
    }
    const handleUp = () => { dragRef.current = null }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  })

  useEffect(() => {
    try {
      if (localStorage.getItem(GUIDE_STORAGE_KEY) === 'true') setCollapsed(true)
    } catch {}
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem(GUIDE_STORAGE_KEY, String(next)) } catch {}
      return next
    })
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
  const personaPhase = activePersona ? getPhaseForPersona(activePersona.id, completedPhaseIds) : null
  const displayPhase = personaPhase ?? currentPhase
  const isWrongPersona = displayPhase && activePersona && displayPhase.personaId !== activePersona.id
  const expectedPersona = displayPhase ? PERSONAS.find(p => p.id === displayPhase.personaId) : null
  const phaseIndex = displayPhase ? PHASES.indexOf(displayPhase) : -1
  const allDone = !currentPhase

  // Auto-detect checkpoints — only check the next incomplete step (sequential)
  useEffect(() => {
    if (!displayPhase || !activePersona) return
    if (displayPhase.personaId !== activePersona.id) return

    for (const step of displayPhase.steps) {
      if (completedSteps.has(step.id)) continue
      // Only check this step (the first incomplete one)
      const cp = step.checkpoint
      let matched = false
      if (cp.type === 'grant') {
        const grants = getResourceGrants(cp.resourceId)
        matched = grants.some(g => {
          if (cp.principalType === 'user') return g.principal.type === 'user' && g.principal.userId === cp.principalId
          if (cp.principalType === 'team') return g.principal.type === 'team' && g.principal.teamId === cp.principalId
          if (cp.principalType === 'domain') return g.principal.type === 'domain' && g.principal.domainId === cp.principalId
          return false
        })
      }
      if (cp.type === 'collection-created') {
        matched = collections.some(c => c.name.toLowerCase().includes(cp.nameContains.toLowerCase()))
      }
      if (cp.type === 'file-created') {
        // Detect user-created files (IDs contain timestamps, not seed prefixes)
        const isUserCreated = (id: string) => /^ws-\d{13}/.test(id)
        const hasUserFile = (nodes: typeof fileTree): boolean => {
          for (const node of nodes) {
            if (node.type === 'file' && isUserCreated(node.id)) return true
            if (node.children && hasUserFile(node.children)) return true
          }
          return false
        }
        const findFolder = (nodes: typeof fileTree, id: string): typeof fileTree[0] | null => {
          for (const node of nodes) {
            if (node.id === id) return node
            if (node.children) {
              const found = findFolder(node.children, id)
              if (found) return found
            }
          }
          return null
        }
        const targetFolder = findFolder(fileTree, cp.parentFolderId)
        if (targetFolder?.children && hasUserFile(targetFolder.children)) {
          matched = true
        }
      }
      if (cp.type === 'visit-page') {
        if (pathname.startsWith(cp.pathPrefix)) {
          matched = true
        }
      }
      if (matched) markCompleted(step.id)
      break // only check the first incomplete step
    }
  }, [displayPhase, activePersona, completedSteps, getResourceGrants, collections, fileTree, pathname, markCompleted])

  if (!displayPhase && !allDone) return null

  return (
    <div
      className={cn('fixed z-50', collapsed ? 'w-auto' : 'w-80')}
      style={position ? { left: position.x, top: position.y } : { top: 8, right: 16 }}
    >
      <div className="bg-black border border-border-dim rounded-lg shadow-lg overflow-hidden">
        {/* Header — draggable + clickable */}
        <div
          onMouseDown={handleDragStart}
          className={cn('cursor-grab active:cursor-grabbing', collapsed ? '' : 'select-none')}
        >
        <button
          onClick={toggleCollapsed}
          className={cn(
            'flex items-center text-left hover:bg-white/5 transition-colors',
            collapsed ? 'p-2 gap-1.5 group hover:bg-indigo-500' : 'w-full justify-between gap-2 px-3 py-2',
          )}
        >
          {collapsed ? (
            <>
              <BookOpen className="w-4 h-4 text-foreground flex-shrink-0" />
              <span className="text-label-0-bold text-foreground whitespace-nowrap hidden group-hover:inline">Guide</span>
            </>
          ) : (
            <>
              <span className="text-body-0-bold text-foreground truncate">
                {allDone ? 'All scenarios done' : displayPhase!.title}
              </span>
              <ChevronUp className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />
            </>
          )}
        </button>
        </div>

        {/* Body — collapsible */}
        {!collapsed && (
          <div className="px-3 pb-3 space-y-3">
            {allDone ? (
              <p className="text-body-0-regular text-foreground-dim">
                You've completed all scenario phases. Reset to start over.
              </p>
            ) : (
              <>
                <p className="text-body-0-regular text-foreground">
                  {displayPhase!.description}
                </p>

                {isWrongPersona && expectedPersona && (
                  <div className="bg-white/5 rounded px-3 py-2 flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
                    <span className="text-body-0-regular text-foreground">
                      Switch to {expectedPersona.name} to continue
                    </span>
                  </div>
                )}

                {!isWrongPersona && (
                  <div className="space-y-0">
                    {displayPhase!.steps.map((step, i) => {
                      const isDone = completedSteps.has(step.id)
                      const isActive = !isDone && displayPhase!.steps.slice(0, i).every(s => completedSteps.has(s.id))
                      return <StepRow key={step.id} step={step} isCompleted={isDone} isActive={isActive} />
                    })}
                  </div>
                )}
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
