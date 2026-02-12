import { useState, useEffect, useCallback } from 'react'
import type { DepartmentId } from '@/components/department/types'

const STORAGE_KEY = 'department-access-settings'

/** Access level for a department */
export type DepartmentAccessLevel = 'full' | 'partial' | 'none'

interface DepartmentAccessSettings {
  /** Departments access levels */
  accessLevels: Record<DepartmentId, DepartmentAccessLevel>
}

const DEFAULT_SETTINGS: DepartmentAccessSettings = {
  accessLevels: {
    'art-design': 'full',
    'vfx': 'full',
    'camera': 'full',
    'editorial': 'full',
    'audio-sound': 'full',
  },
}

const ALL_DEPARTMENTS: DepartmentId[] = ['art-design', 'vfx', 'camera', 'editorial', 'audio-sound']

function getStoredSettings(): DepartmentAccessSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_SETTINGS
    const parsed = JSON.parse(stored)
    // Migration from old boolean format
    if (parsed.accessibleDepartments) {
      const migrated: DepartmentAccessSettings = {
        accessLevels: {
          'art-design': parsed.accessibleDepartments['art-design'] === false ? 'none' : 'full',
          'vfx': parsed.accessibleDepartments['vfx'] === false ? 'none' : 'full',
          'camera': parsed.accessibleDepartments['camera'] === false ? 'none' : 'full',
          'editorial': parsed.accessibleDepartments['editorial'] === false ? 'none' : 'full',
          'audio-sound': parsed.accessibleDepartments['audio-sound'] === false ? 'none' : 'full',
        },
      }
      return migrated
    }
    return parsed
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
  /** Get access level for a department */
  getAccessLevel: (departmentId: DepartmentId) => DepartmentAccessLevel
  /** Check if user has any access (full or partial) to a department */
  hasAccess: (departmentId: DepartmentId) => boolean
  /** Check if user has full access to a department */
  hasFullAccess: (departmentId: DepartmentId) => boolean
  /** Set access level for a department */
  setAccessLevel: (departmentId: DepartmentId, level: DepartmentAccessLevel) => void
  /** Get all department access settings */
  accessLevels: Record<DepartmentId, DepartmentAccessLevel>
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

  const getAccessLevel = useCallback(
    (departmentId: DepartmentId): DepartmentAccessLevel => {
      return settings.accessLevels[departmentId] ?? 'full'
    },
    [settings]
  )

  const hasAccess = useCallback(
    (departmentId: DepartmentId): boolean => {
      const level = settings.accessLevels[departmentId] ?? 'full'
      return level !== 'none'
    },
    [settings]
  )

  const hasFullAccess = useCallback(
    (departmentId: DepartmentId): boolean => {
      return settings.accessLevels[departmentId] === 'full'
    },
    [settings]
  )

  const setAccessLevel = useCallback(
    (departmentId: DepartmentId, level: DepartmentAccessLevel) => {
      const newSettings: DepartmentAccessSettings = {
        ...settings,
        accessLevels: {
          ...settings.accessLevels,
          [departmentId]: level,
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
    getAccessLevel,
    hasAccess,
    hasFullAccess,
    setAccessLevel,
    accessLevels: settings.accessLevels,
    allDepartments: ALL_DEPARTMENTS,
  }
}
