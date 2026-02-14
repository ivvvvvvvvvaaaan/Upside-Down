'use client'

import { useState, useCallback, useEffect } from 'react'
import { Settings, Lock, Unlock, Cloud, CloudOff, AlertTriangle, Loader2, WifiOff, RotateCcw, Eye, EyeOff } from 'lucide-react'
import { MenuBar } from './components/menu-bar'
import { BrowserWindow } from './components/browser-window'
import { FinderWindow } from './components/finder-window'

// Constants
const MIN_WIDTH = 400
const MIN_HEIGHT = 300
const MENU_BAR_HEIGHT = 24

export interface WindowState {
  id: string
  title: string
  type: 'browser' | 'finder'
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  isMaximized: boolean
  isMinimized: boolean
}

const initialWindows: WindowState[] = [
  {
    id: 'browser',
    title: 'NextGen Media Library - Chrome',
    type: 'browser',
    x: 50,
    y: MENU_BAR_HEIGHT + 30,
    width: 1024,
    height: 680,
    zIndex: 10,
    isMaximized: false,
    isMinimized: false,
  },
  {
    id: 'finder',
    title: 'Finder',
    type: 'finder',
    x: 500,
    y: MENU_BAR_HEIGHT + 80,
    width: 700,
    height: 500,
    zIndex: 11,
    isMaximized: false,
    isMinimized: false,
  },
]

// Folder IDs that can be locked (main department folders)
export const LOCKABLE_FOLDERS = [
  { id: 'ws-art', name: 'Art Department' },
  { id: 'ws-vfx', name: 'VFX' },
  { id: 'ws-camera', name: 'Camera' },
] as const

// Sync status options
export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline'

export const SYNC_STATUS_OPTIONS: { value: SyncStatus; label: string }[] = [
  { value: 'synced', label: 'Synced' },
  { value: 'syncing', label: 'Syncing...' },
  { value: 'error', label: 'Sync Error' },
  { value: 'offline', label: 'Offline' },
]

// LocalStorage keys
const STORAGE_KEYS = {
  LOCKED_FOLDERS: 'desktop-locked-folders',
  HIDDEN_FOLDERS: 'desktop-hidden-folders',
  CLOUD_SYNC: 'desktop-cloud-sync',
  SYNC_STATUS: 'desktop-sync-status',
} as const

export function DesktopView() {
  const [windows, setWindows] = useState<WindowState[]>(initialWindows)
  const [activeWindowId, setActiveWindowId] = useState<string | null>('finder')
  const [lockedFolderIds, setLockedFolderIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set(['ws-vfx'])
    const saved = localStorage.getItem(STORAGE_KEYS.LOCKED_FOLDERS)
    if (saved) {
      try {
        return new Set(JSON.parse(saved))
      } catch {
        return new Set(['ws-vfx'])
      }
    }
    return new Set(['ws-vfx'])
  })
  const [hiddenFolderIds, setHiddenFolderIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    const saved = localStorage.getItem(STORAGE_KEYS.HIDDEN_FOLDERS)
    if (saved) {
      try {
        return new Set(JSON.parse(saved))
      } catch {
        return new Set()
      }
    }
    return new Set()
  })
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem(STORAGE_KEYS.CLOUD_SYNC)
    return saved !== null ? saved === 'true' : true
  })
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => {
    if (typeof window === 'undefined') return 'synced'
    const saved = localStorage.getItem(STORAGE_KEYS.SYNC_STATUS) as SyncStatus | null
    return saved && ['synced', 'syncing', 'error', 'offline'].includes(saved) ? saved : 'synced'
  })
  const [showSettings, setShowSettings] = useState(false)

  // Persist locked folders to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCKED_FOLDERS, JSON.stringify(Array.from(lockedFolderIds)))
  }, [lockedFolderIds])

  // Persist hidden folders to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HIDDEN_FOLDERS, JSON.stringify(Array.from(hiddenFolderIds)))
  }, [hiddenFolderIds])

  // Persist cloud sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLOUD_SYNC, String(cloudSyncEnabled))
  }, [cloudSyncEnabled])

  // Persist sync status to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, syncStatus)
  }, [syncStatus])

  // Toggle folder lock
  const toggleFolderLock = useCallback((folderId: string) => {
    setLockedFolderIds((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }, [])

  // Toggle folder hidden
  const toggleFolderHidden = useCallback((folderId: string) => {
    setHiddenFolderIds((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }, [])

  // Toggle cloud sync for all
  const toggleCloudSync = useCallback(() => {
    setCloudSyncEnabled((prev) => !prev)
  }, [])

  // Get active app name for menu bar
  const getActiveAppName = () => {
    if (activeWindowId === 'finder') return 'Finder'
    if (activeWindowId === 'browser') return 'Chrome'
    return 'Finder'
  }

  // Get the next z-index (max + 1)
  const getNextZIndex = useCallback(() => {
    const maxZ = Math.max(...windows.map((w) => w.zIndex))
    return maxZ + 1
  }, [windows])

  // Bring window to front
  const focusWindow = useCallback(
    (id: string) => {
      setActiveWindowId(id)
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, zIndex: getNextZIndex() } : w))
      )
    },
    [getNextZIndex]
  )

  // Update window position
  const updateWindowPosition = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, x, y } : w))
    )
  }, [])

  // Update window size
  const updateWindowSize = useCallback(
    (id: string, width: number, height: number, x?: number, y?: number) => {
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w
          return {
            ...w,
            width: Math.max(MIN_WIDTH, width),
            height: Math.max(MIN_HEIGHT, height),
            ...(x !== undefined && { x }),
            ...(y !== undefined && { y }),
          }
        })
      )
    },
    []
  )

  // Minimize window
  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    )
  }, [])

  // Maximize/restore window
  const toggleMaximize = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w
        if (w.isMaximized) {
          // Restore to sensible default position
          return {
            ...w,
            isMaximized: false,
            x: 50,
            y: MENU_BAR_HEIGHT + 30,
            width: w.type === 'browser' ? 1024 : 700,
            height: w.type === 'browser' ? 680 : 500,
          }
        } else {
          // Maximize to fill desktop (below menu bar)
          return {
            ...w,
            isMaximized: true,
            x: 0,
            y: MENU_BAR_HEIGHT,
            width: typeof window !== 'undefined' ? window.innerWidth : 1920,
            height: typeof window !== 'undefined' ? window.innerHeight - MENU_BAR_HEIGHT : 1056,
          }
        }
      })
    )
  }, [])

  // Close window (only for Finder)
  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id))
  }, [])

  // Get window by id
  const getWindow = (id: string) => windows.find((w) => w.id === id)

  const browserWindow = getWindow('browser')
  const finderWindow = getWindow('finder')

  return (
    <div className="fixed inset-0 bg-surface-1 overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
      {/* Menu Bar */}
      <MenuBar activeApp={getActiveAppName()} />

      {/* Desktop Area */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ top: MENU_BAR_HEIGHT }}
      >
        {/* Browser Window */}
        {browserWindow && !browserWindow.isMinimized && (
          <BrowserWindow
            window={{ ...browserWindow, y: browserWindow.y - MENU_BAR_HEIGHT }}
            isActive={activeWindowId === 'browser'}
            onFocus={() => focusWindow('browser')}
            onMove={(x, y) => updateWindowPosition('browser', x, y + MENU_BAR_HEIGHT)}
            onResize={(w, h, x, y) =>
              updateWindowSize('browser', w, h, x, y !== undefined ? y + MENU_BAR_HEIGHT : undefined)
            }
            onMinimize={() => minimizeWindow('browser')}
            onMaximize={() => toggleMaximize('browser')}
          />
        )}

        {/* Finder Window */}
        {finderWindow && !finderWindow.isMinimized && (
          <FinderWindow
            window={{ ...finderWindow, y: finderWindow.y - MENU_BAR_HEIGHT }}
            isActive={activeWindowId === 'finder'}
            onFocus={() => focusWindow('finder')}
            onMove={(x, y) => updateWindowPosition('finder', x, y + MENU_BAR_HEIGHT)}
            onResize={(w, h, x, y) =>
              updateWindowSize('finder', w, h, x, y !== undefined ? y + MENU_BAR_HEIGHT : undefined)
            }
            onMinimize={() => minimizeWindow('finder')}
            onMaximize={() => toggleMaximize('finder')}
            onClose={() => closeWindow('finder')}
            lockedFolderIds={lockedFolderIds}
            hiddenFolderIds={hiddenFolderIds}
            cloudSyncEnabled={cloudSyncEnabled}
            syncStatus={syncStatus}
          />
        )}

        {/* Settings button - bottom right corner of desktop, next to theme toggle */}
        <div className="absolute bottom-4 right-14 z-[9999]">
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-surface-low border border-border-subtle rounded-full p-2 shadow-high hover:bg-surface-highlight transition-colors"
              aria-label="Folder settings"
            >
              <Settings className="w-4 h-4 text-foreground-dim" />
            </button>

            {/* Settings panel */}
            {showSettings && (
              <div className="absolute bottom-12 right-0 w-56 py-2 bg-surface-high/95 backdrop-blur-xl rounded-lg border border-border-dim shadow-high">
                {/* Cloud sync toggle */}
                <div className="px-3 py-1.5 text-label-0-bold text-foreground-dim border-b border-border-dim mb-1">
                  Cloud Sync
                </div>
                <button
                  onClick={toggleCloudSync}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-surface-selected-subtle transition-colors"
                >
                  <span className="text-body-0-regular text-foreground">Sync Enabled</span>
                  {cloudSyncEnabled ? (
                    <Cloud className="w-4 h-4 text-blue-500" />
                  ) : (
                    <CloudOff className="w-4 h-4 text-foreground-dim" />
                  )}
                </button>

                {/* Sync status options */}
                {cloudSyncEnabled && (
                  <div className="mt-1 border-t border-border-dim pt-1">
                    {SYNC_STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSyncStatus(option.value)}
                        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-surface-selected-subtle transition-colors"
                      >
                        <span className="text-body-0-regular text-foreground">{option.label}</span>
                        {syncStatus === option.value && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Folder options */}
                <div className="px-3 py-1.5 text-label-0-bold text-foreground-dim border-b border-border-dim mt-2 mb-1">
                  Folder Options
                </div>
                {LOCKABLE_FOLDERS.map((folder) => {
                  const isLocked = lockedFolderIds.has(folder.id)
                  const isHidden = hiddenFolderIds.has(folder.id)
                  return (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between px-3 py-1.5"
                    >
                      <span className="text-body-0-regular text-foreground">{folder.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFolderHidden(folder.id)}
                          className="p-1 rounded hover:bg-surface-selected-subtle transition-colors"
                          title={isHidden ? 'Show folder' : 'Hide folder'}
                        >
                          {isHidden ? (
                            <EyeOff className="w-4 h-4 text-red-500" />
                          ) : (
                            <Eye className="w-4 h-4 text-foreground-dim" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleFolderLock(folder.id)}
                          className="p-1 rounded hover:bg-surface-selected-subtle transition-colors"
                          title={isLocked ? 'Unlock folder' : 'Lock folder'}
                        >
                          {isLocked ? (
                            <Lock className="w-4 h-4 text-orange-500" />
                          ) : (
                            <Unlock className="w-4 h-4 text-foreground-dim" />
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Reset folders */}
                <div className="mt-2 pt-2 border-t border-border-dim">
                  <button
                    onClick={() => {
                      localStorage.removeItem('desktop-workspace-files')
                      window.location.reload()
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-surface-selected-subtle transition-colors"
                  >
                    <span className="text-body-0-regular text-foreground">Reset Folders</span>
                    <RotateCcw className="w-4 h-4 text-foreground-dim" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
