'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { Wifi, Battery, Search } from 'lucide-react'

interface MenuBarProps {
  activeApp: string
  trailingContent?: ReactNode
}

export function MenuBar({ activeApp, trailingContent }: MenuBarProps) {
  const [time, setTime] = useState<string>('')

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      )
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Get date for menu bar
  const getDate = () => {
    const now = new Date()
    return now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  // Menu items based on active app
  const getAppMenus = () => {
    if (activeApp === 'Finder') {
      return ['File', 'Edit', 'View', 'Go', 'Window', 'Help']
    }
    // Chrome-like menus for browser
    return ['File', 'Edit', 'View', 'History', 'Bookmarks', 'Window', 'Help']
  }

  return (
    <div className="relative z-[1000] h-6 bg-surface-high/90 backdrop-blur-md flex items-center justify-between px-4 text-label-0-regular text-foreground select-none border-b border-border-dim">
      {/* Left side - App name and menus */}
      <div className="flex items-center gap-4">
        {/* App name (bold) */}
        <button className="font-semibold hover:bg-surface-selected-subtle px-1.5 py-0.5 rounded transition-colors">
          {activeApp}
        </button>

        {/* App menus */}
        {getAppMenus().map((menu) => (
          <button
            key={menu}
            className="hover:bg-surface-selected-subtle px-1.5 py-0.5 rounded transition-colors"
          >
            {menu}
          </button>
        ))}
      </div>

      {/* Right side - Status icons and time */}
      <div className="flex items-center gap-3 text-foreground-dim">
        {trailingContent}

        {/* Battery */}
        <div className="flex items-center gap-1">
          <span className="text-[10px]">100%</span>
          <Battery className="w-4 h-4" />
        </div>

        {/* WiFi */}
        <Wifi className="w-3.5 h-3.5" />

        {/* Search / Spotlight */}
        <Search className="w-3.5 h-3.5" />

        {/* Date and Time */}
        <span className="text-label-0-regular text-foreground">
          {getDate()} {time}
        </span>
      </div>
    </div>
  )
}
