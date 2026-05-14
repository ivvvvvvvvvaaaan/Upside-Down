'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Textarea — mirrors Input's idle/focus treatment so multi-line fields read
 * as part of the same control family.
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full px-3 py-2 rounded-md text-body-0-regular resize-none',
        'bg-surface-flat dark:bg-white/[0.04] ring-1 ring-inset ring-border-dim',
        'text-foreground placeholder:text-foreground-dim',
        'transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-border-system-focus',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error && 'ring-border-system-error focus:ring-border-system-error',
        className,
      )}
      {...props}
    />
  ),
)

Textarea.displayName = 'Textarea'
