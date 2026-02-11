/**
 * Navigation Type Definitions
 *
 * Shared types for configurable navigation in generated projects.
 */

export interface NavItem {
  /** Display label for the nav item */
  label: string
  /** Route path (relative to basePath or absolute) */
  href: string
  /** Lucide icon name (e.g., 'Grid', 'Folder', 'Search') */
  icon?: string
  /** Optional badge count */
  badge?: number
}

export interface NavSection {
  /** Section header title */
  title: string
  /** Whether section is expanded by default */
  defaultOpen?: boolean
  /** Navigation items in this section */
  items: NavItem[]
}

export interface NavConfig {
  /** Base path for the project (e.g., '/my-project') */
  basePath: string
  /** Top-level items (rendered outside sections) */
  topLevel?: NavItem[]
  /** Collapsible sections */
  sections: NavSection[]
}

export type NavigationType = 'vertical' | 'horizontal' | 'none'
export type NavDepth = 'one-level' | 'two-level'
export type ThemePreference = 'dark' | 'light'
