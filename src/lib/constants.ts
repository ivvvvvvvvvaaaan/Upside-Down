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
