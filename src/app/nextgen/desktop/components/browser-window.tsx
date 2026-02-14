'use client'

import { DesktopWindow } from './desktop-window'
import type { WindowState } from '../view'

interface BrowserWindowProps {
  window: WindowState
  isActive: boolean
  onFocus: () => void
  onMove: (x: number, y: number) => void
  onResize: (width: number, height: number, x?: number, y?: number) => void
  onMinimize: () => void
  onMaximize: () => void
}

export function BrowserWindow({
  window,
  isActive,
  onFocus,
  onMove,
  onResize,
  onMinimize,
  onMaximize,
}: BrowserWindowProps) {
  return (
    <DesktopWindow
      window={window}
      isActive={isActive}
      canClose={false}
      onFocus={onFocus}
      onMove={onMove}
      onResize={onResize}
      onMinimize={onMinimize}
      onMaximize={onMaximize}
    >
      <iframe
        src="/nextgen"
        className="w-full h-full border-0"
        title="NextGen Prototype"
      />
    </DesktopWindow>
  )
}
