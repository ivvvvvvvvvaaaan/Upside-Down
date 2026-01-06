'use client'

import { useState } from 'react'
import { Settings, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Text } from './text'

/*
 * ===========================================
 * SETTINGS PANEL
 * ===========================================
 * Collapsable settings panel for testing UI variants
 */

export interface SettingsPanelProps {
  children: React.ReactNode
  defaultOpen?: boolean
}

export function SettingsPanel({ children, defaultOpen = false }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-surface-low border border-border-subtle rounded shadow-high p-4 w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-foreground-dim" />
              <Text variant="body-2" weight="semibold">Settings</Text>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-surface-highlight rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-foreground-dim" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {children}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-surface-low border border-border-subtle rounded-full p-3 shadow-high hover:bg-surface-highlight transition-colors"
        >
          <Settings className="w-5 h-5 text-foreground-dim" />
        </button>
      )}
    </div>
  )
}

export interface SettingGroupProps {
  label: string
  children: React.ReactNode
}

export function SettingGroup({ label, children }: SettingGroupProps) {
  return (
    <div className="space-y-2">
      <Text variant="caption" weight="semibold" color="secondary" className="uppercase">
        {label}
      </Text>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  )
}

export interface SettingOptionProps {
  label: string
  value: string
  checked: boolean
  onChange: (value: string) => void
}

export function SettingOption({ label, value, checked, onChange }: SettingOptionProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="radio"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="w-4 h-4 text-primary bg-surface-0 border-border-subtle focus:ring-2 focus:ring-primary"
      />
      <Text
        variant="body-2"
        className={cn(
          'group-hover:text-foreground transition-colors',
          checked ? 'text-foreground' : 'text-foreground-dim'
        )}
      >
        {label}
      </Text>
    </label>
  )
}
