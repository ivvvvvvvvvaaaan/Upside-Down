import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Custom tailwind-merge config to recognize Hawkins typography classes
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        // Body text
        'text-body-0-bold', 'text-body-0-regular',
        'text-body-1-bold', 'text-body-1-regular',
        'text-body-2-bold', 'text-body-2-regular',
        // Headings
        'text-heading-0', 'text-heading-1', 'text-heading-2', 'text-heading-3',
        'text-heading-4', 'text-heading-5', 'text-heading-6', 'text-heading-7', 'text-heading-8',
        // Labels
        'text-label-0-bold', 'text-label-0-regular',
        'text-label-1-bold', 'text-label-1-regular',
        // Special
        'text-tag-small',
        // Mono
        'text-body-mono-0-bold', 'text-body-mono-0-regular',
        'text-body-mono-1-bold', 'text-body-mono-1-regular',
        'text-body-mono-2-bold', 'text-body-mono-2-regular',
        // Tabular
        'text-body-tabular-0-bold', 'text-body-tabular-0-regular',
        'text-body-tabular-1-bold', 'text-body-tabular-1-regular',
        'text-body-tabular-2-bold', 'text-body-tabular-2-regular',
        // Links
        'text-body-text-link-0-bold', 'text-body-text-link-0-regular',
        'text-body-text-link-1-bold', 'text-body-text-link-1-regular',
        'text-body-text-link-2-bold', 'text-body-text-link-2-regular',
        'text-label-text-link-0-bold', 'text-label-text-link-0-regular',
        'text-label-text-link-1-bold', 'text-label-text-link-1-regular',
      ],
    },
  },
})

/**
 * Merge Tailwind classes with clsx
 * Use this for conditional and dynamic class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format an ISO date string to "Mon DD, YYYY" */
export function formatDate(dateStr?: string, fallback = '—'): string {
  if (!dateStr) return fallback
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Format byte count to human-readable file size */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}
