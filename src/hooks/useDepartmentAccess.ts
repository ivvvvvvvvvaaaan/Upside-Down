import { useState, useEffect, useCallback } from 'react'
import type { DepartmentId } from '@/components/department/types'

const STORAGE_KEY = 'department-access-settings'

interface DepartmentAccessSettings {
  /** Departments the user has access to */
  accessibleDepartments: Record<DepartmentId, boolean>
}

const DEFAULT_SETTINGS: DepartmentAccessSettings = {
  accessibleDepartments: {
    'art-design': true,
    'vfx': true,
  },
}

const ALL_DEPARTMENTS: DepartmentId[] = ['art-design', 'vfx']

function getStoredSettings(): DepartmentAccessSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_SETTINGS
    return JSON.parse(stored)
  } catch (error) {
    console.warn('Failed to read department access settings:', error)
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings: DepartmentAccessSettings): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save department access settings:', error)
  }
}

export interface UseDepartmentAccessReturn {
  /** Check if user has access to a department */
  hasAccess: (departmentId: DepartmentId) => boolean
  /** Set access for a department */
  setAccess: (departmentId: DepartmentId, hasAccess: boolean) => void
  /** Get all department access settings */
  accessSettings: Record<DepartmentId, boolean>
  /** List of all department IDs */
  allDepartments: DepartmentId[]
}

export function useDepartmentAccess(): UseDepartmentAccessReturn {
  const [settings, setSettings] = useState<DepartmentAccessSettings>(DEFAULT_SETTINGS)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setSettings(getStoredSettings())
  }, [])

  const hasAccess = useCallback(
    (departmentId: DepartmentId): boolean => {
      return settings.accessibleDepartments[departmentId] ?? true
    },
    [settings]
  )

  const setAccess = useCallback(
    (departmentId: DepartmentId, access: boolean) => {
      const newSettings: DepartmentAccessSettings = {
        ...settings,
        accessibleDepartments: {
          ...settings.accessibleDepartments,
          [departmentId]: access,
        },
      }
      setSettings(newSettings)
      if (mounted) {
        saveSettings(newSettings)
      }
    },
    [settings, mounted]
  )

  return {
    hasAccess,
    setAccess,
    accessSettings: settings.accessibleDepartments,
    allDepartments: ALL_DEPARTMENTS,
  }
}
