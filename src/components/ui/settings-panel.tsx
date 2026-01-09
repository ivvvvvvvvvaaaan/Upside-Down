'use client'

import { useState } from 'react'
import { Settings, X } from 'lucide-react'
import { cn } from '@/lib/utils'

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
        <div className="bg-surface-low rounded shadow-high p-3 w-[320px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-body-0-bold text-foreground">Settings</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-surface-highlight rounded transition-colors"
            >
              <X className="w-3 h-3 text-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-3">
            {children}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-surface-low border border-border-subtle rounded-full p-2 shadow-high hover:bg-surface-highlight transition-colors"
        >
          <Settings className="w-4 h-4 text-foreground" />
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
    <div className="space-y-1">
      <span className="text-label-0-bold text-foreground uppercase tracking-wide">
        {label}
      </span>
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
    <label className="flex items-center gap-1 cursor-pointer group">
      <input
        type="radio"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="w-3 h-3 text-primary bg-surface-0 border-border-subtle focus:ring-1 focus:ring-primary"
      />
      <span className="text-body-0-regular text-foreground">
        {label}
      </span>
    </label>
  )
}

export interface SettingToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function SettingToggle({ label, checked, onChange }: SettingToggleProps) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-body-0-regular text-foreground">
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-3 h-3 text-primary bg-surface-0 border-border-subtle rounded focus:ring-1 focus:ring-primary"
      />
    </label>
  )
}

export interface SettingBooleanProps {
  label: string
  value: boolean
  onChange: (value: boolean) => void
  onLabel?: string
  offLabel?: string
}

export function SettingBoolean({
  label,
  value,
  onChange,
  onLabel = 'On',
  offLabel = 'Off'
}: SettingBooleanProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-body-0-regular text-foreground">
        {label}
      </span>
      <div className="flex rounded overflow-hidden border border-border-subtle text-label-0-regular">
        <button
          onClick={() => onChange(false)}
          className={cn(
            'px-2 py-1 transition-colors',
            !value
              ? 'bg-gray-500 text-white'
              : 'bg-surface-flat text-foreground hover:bg-surface-highlight'
          )}
        >
          {offLabel}
        </button>
        <button
          onClick={() => onChange(true)}
          className={cn(
            'px-2 py-1 transition-colors',
            value
              ? 'bg-indigo-600 text-white'
              : 'bg-surface-flat text-foreground hover:bg-surface-highlight'
          )}
        >
          {onLabel}
        </button>
      </div>
    </div>
  )
}

export interface SettingSegmentedProps<T extends string> {
  label?: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

export function SettingSegmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: SettingSegmentedProps<T>) {
  return (
    <div className={cn('flex items-center', label ? 'justify-between' : '')}>
      {label && (
        <span className="text-body-0-regular text-foreground">
          {label}
        </span>
      )}
      <div className="flex rounded overflow-hidden border border-border-subtle text-label-0-regular">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'px-2 py-1 transition-colors',
              value === option.value
                ? 'bg-gray-500 text-white'
                : 'bg-surface-flat text-foreground hover:bg-surface-highlight'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
