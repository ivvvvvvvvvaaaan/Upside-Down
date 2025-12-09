/**
 * ===========================================
 * APPLICATION CONSTANTS
 * ===========================================
 * Centralized constants to avoid magic numbers and strings.
 * Improves maintainability and prevents typos.
 */

// ===== THEME =====
export const THEME_STORAGE_KEY = 'theme' as const
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const

// ===== LAYOUT DIMENSIONS =====
export const LAYOUT = {
  SIDEBAR_WIDTH: 'w-64',
  TOOLBAR_HEIGHT: 'h-16',
  THEME_TOGGLE_SIZE: 'w-10 h-10',
  THEME_TOGGLE_POSITION: 'top-4 right-4',
} as const

// ===== Z-INDEX LAYERS =====
export const Z_INDEX = {
  MODAL: 'z-50',
  THEME_TOGGLE: 'z-50',
  DROPDOWN: 'z-40',
  STICKY: 'z-30',
  OVERLAY: 'z-20',
} as const

// ===== ANIMATION DURATIONS =====
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const

// ===== MODAL SIZES =====
export const MODAL_SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
} as const

// ===== API ENDPOINTS (for examples) =====
export const API_ENDPOINTS = {
  ANALYTICS_EVENT: '/analytics/event',
  REGISTER: '/api/register',
  SEARCH: '/api/search',
} as const

// ===== PLACEHOLDER TEXT =====
export const PLACEHOLDERS = {
  SEARCH: 'Search everything...',
  SEARCH_ASSETS: 'Filter assets...',
  SEARCH_FILES: 'Search...',
  EMAIL: 'you@example.com',
} as const
