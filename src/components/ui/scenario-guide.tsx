'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { ChevronDown, ChevronUp, Check, Circle, ArrowRight } from 'lucide-react'
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
    setCompletedSteps(new Set())
    try { localStorage.removeItem(COMPLETED_STEPS_KEY) } catch {}
  }, [])

  return { completedSteps, markCompleted, resetAll }
}

function StepRow({ step, isCompleted, isActive }: { step: PhaseStep; isCompleted: boolean; isActive: boolean }) {
  return (
    <div className={cn('flex gap-2 py-1.5', isActive && 'text-foreground', !isActive && !isCompleted && 'text-foreground-dim')}>
      <div className="flex-shrink-0 mt-0.5">
        {isCompleted ? (
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </div>
        ) : isActive ? (
          <div className="w-4 h-4 rounded-full border-2 border-indigo-400" />
        ) : (
          <Circle className="w-4 h-4 text-foreground-subtle" />
        )}
      </div>
      <span className={cn('text-body-0-regular', isCompleted && 'line-through text-foreground-subtle')}>
        {step.instruction}
      </span>
    </div>
  )
}

export function ScenarioGuide() {
  const { activePersona } = usePersona()
  const { getResourceGrants } = useAccess()
  const { collections } = useUserCollections()
  const { tree: fileTree } = useFileTree()
  const { completedSteps, markCompleted, resetAll } = useCompletedSteps()

  const [collapsed, setCollapsed] = useState(false)

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
        // Detect any file created today (modifiedAt matches today's date)
        const today = new Date().toISOString().split('T')[0]
        const hasRecentFile = (nodes: typeof fileTree): boolean => {
          for (const node of nodes) {
            if (node.type === 'file' && node.modifiedAt === today) return true
            if (node.children && hasRecentFile(node.children)) return true
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
        if (targetFolder?.children && hasRecentFile(targetFolder.children)) {
          matched = true
        }
      }
      if (matched) markCompleted(step.id)
      break // only check the first incomplete step
    }
  }, [displayPhase, activePersona, completedSteps, getResourceGrants, collections, fileTree, markCompleted])

  if (!displayPhase && !allDone) return null

  return (
    <div className={cn('fixed top-2 right-4 z-50', collapsed ? 'w-auto' : 'w-80')}>
      <div className="bg-black border border-border-dim rounded-lg shadow-lg overflow-hidden">
        {/* Header — always visible */}
        <button
          onClick={toggleCollapsed}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
        >
          <span className="text-body-0-bold text-foreground truncate">
            {allDone ? 'All scenarios done' : displayPhase!.title}
          </span>
          {collapsed ? <ChevronDown className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" /> : <ChevronUp className="w-3.5 h-3.5 text-foreground-dim flex-shrink-0" />}
        </button>

        {/* Body — collapsible */}
        {!collapsed && (
          <div className="px-4 pb-4 space-y-3">
            {allDone ? (
              <p className="text-body-0-regular text-foreground-dim">
                You've completed all scenario phases. Reset to start over.
              </p>
            ) : (
              <>
                <p className="text-body-0-regular text-foreground-dim">
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
