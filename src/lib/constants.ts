/**
 * ===========================================
 * APPLICATION CONSTANTS
 * ===========================================
 * Centralized constants to avoid magic numbers and strings.
 * Improves maintainability and prevents typos.
 */

// ===== SEED DATA VERSION =====
// Bump when ANY seed data changes (grants, collections, scenario, workspace files).
// Forces all localStorage caches to reset.
export const SEED_VERSION = 49

// ===== THEME =====
export const THEME_STORAGE_KEY = 'theme' as const
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const
