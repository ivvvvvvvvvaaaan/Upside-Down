'use client'

import { useState, useCallback } from 'react'
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

export function DesktopView() {
  const [windows, setWindows] = useState<WindowState[]>(initialWindows)
  const [activeWindowId, setActiveWindowId] = useState<string | null>('finder')

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
          />
        )}
      </div>
    </div>
  )
}
