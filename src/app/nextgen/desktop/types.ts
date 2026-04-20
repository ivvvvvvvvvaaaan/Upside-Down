/** Shared types for the desktop window system */

export interface WindowState {
  id: string
  title: string
  type: 'browser' | 'finder'
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  isMaximized: boolean
  isMinimized: boolean
}

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline'
