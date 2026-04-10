'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export function Checkbox({ checked, onChange, disabled, className, ...props }: CheckboxProps) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={props['aria-label']}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-colors',
        checked
          ? 'bg-indigo-500 text-white'
          : 'bg-transparent border border-white/40',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer',
        className,
      )}
    >
      {checked && <Check className="w-3 h-3" strokeWidth={3} />}
    </button>
  )
}
