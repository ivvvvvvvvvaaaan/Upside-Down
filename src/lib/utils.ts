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

export function getInitials(name: string, maxLength = 2): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, maxLength) || '?'
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`
}

const TIME_OF_DAY_SUFFIX = /\s+-\s+(day|night|sunset|sunrise|dawn|dusk|golden hour|magic hour|morning|evening|afternoon|continuous)$/i

/**
 * A small curated palette of two-stop gradients for placeholder character
 * avatars (and any other "name → cinematic backdrop" use). Hand-picked to
 * read well on a dark UI without overwhelming the initials drawn on top.
 * Each value is a full literal so Tailwind picks them up at build time.
 */
const AVATAR_GRADIENTS = [
  'bg-gradient-to-br from-indigo-500/20 via-indigo-700/10 to-transparent',
  'bg-gradient-to-br from-emerald-500/20 via-teal-700/10 to-transparent',
  'bg-gradient-to-br from-rose-500/20 via-rose-700/10 to-transparent',
  'bg-gradient-to-br from-amber-500/20 via-orange-700/10 to-transparent',
  'bg-gradient-to-br from-violet-500/20 via-purple-700/10 to-transparent',
  'bg-gradient-to-br from-cyan-500/20 via-sky-700/10 to-transparent',
  'bg-gradient-to-br from-fuchsia-500/20 via-pink-700/10 to-transparent',
  'bg-gradient-to-br from-blue-500/20 via-indigo-700/10 to-transparent',
]

/** Pick a stable gradient for a given name. Same name always returns the same gradient. */
export function pickAvatarGradient(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0
  }
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length]
}

/**
 * Compact form of a scene slugline for tag-sized display. Strips the
 * INT./EXT. prefix and the time-of-day suffix, then keeps only the
 * narrative descriptor (everything after the first " - "). When there's
 * no descriptor, falls back to the location itself.
 *
 *   "EXT. ABU DHABI MARINA CIRCUIT - CHAMPIONSHIP DECIDER - SUNSET"
 *     → "CHAMPIONSHIP DECIDER"
 *   "INT. APEX GARAGE - RACE DAY"  → "RACE DAY"
 *   "EXT. PRE-RACE GRID"           → "PRE-RACE GRID"
 */
export function formatSceneSlug(slug: string): string {
  const stripped = slug
    .replace(/^(INT\/EXT\.|INT\.|EXT\.)\s+/i, '')
    .replace(TIME_OF_DAY_SUFFIX, '')
    .trim()
  const dashIndex = stripped.indexOf(' - ')
  return dashIndex >= 0 ? stripped.slice(dashIndex + 3).trim() : stripped
}
