---
title: "feat: Virtual Desktop Environment for NextGen Prototype"
type: feat
date: 2026-02-13
---

# Virtual Desktop Environment for NextGen Prototype

## Overview

Create a virtual macOS-style desktop environment at `/nextgen/desktop` that wraps the existing NextGen prototype inside a draggable, resizable browser window. This environment supports user testing of synchronization concepts between local file systems and web applications by displaying the NextGen media library alongside a macOS Finder-style file browser.

## Problem Statement / Motivation

The current NextGen prototype runs as a standard web application. To validate the concept of file synchronization between local computers (via browser extension or macOS integration) and the web app, we need a way to:

1. Show the NextGen app running "inside a browser" to distinguish it from the local environment
2. Display a Finder-like file/folder view representing the local file system
3. Allow users to visualize both contexts simultaneously in a familiar desktop metaphor
4. Walk users through the sync experience during prototype testing sessions

## Proposed Solution

Build a virtual desktop environment with high-fidelity macOS window chrome. Two windows appear on page load:
- **Browser Window**: Contains the existing NextGen prototype
- **Finder Window**: Interactive file tree representing local files

Both windows support drag (by title bar), resize (from edges/corners), minimize, and maximize. The Browser window cannot be closed (red button disabled). Windows can be stacked and reordered by clicking to focus.

## Technical Approach

### Architecture (Simplified)

```
/nextgen/desktop/
├── page.tsx              # Server component (route handler)
├── view.tsx              # Client component with all desktop logic
└── components/
    ├── desktop-window.tsx        # Window chrome (title bar, buttons, resize - all inline)
    ├── browser-window.tsx        # Window containing NextGen prototype via iframe
    └── finder-window.tsx         # Window using existing FileExplorer component
```

**Key simplifications:**
- All window chrome (title bar, traffic lights, resize handles) inline in `desktop-window.tsx`
- Reuse existing `src/components/ui/file-explorer.tsx` instead of creating new file tree
- 4 corner resize handles only (ne, se, sw, nw) - sufficient for prototype
- No separate state management files - state lives in `view.tsx`

### Window State Management (Simplified)

```typescript
// Constants - no per-window configuration needed
const MIN_WIDTH = 400
const MIN_HEIGHT = 300

interface WindowState {
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

// Simple state - just two windows
const [windows, setWindows] = useState<WindowState[]>([...])
const [activeWindowId, setActiveWindowId] = useState<string | null>(null)
```

**Removed complexity:**
- No `nextZIndex` counter - compute max from array
- No `previousState` - calculate sensible restore position on the fly
- Flattened position/size - no nested objects

### Key Interactions

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Drag window | mousedown on title bar | Window follows cursor, constrained to desktop |
| Resize | mousedown on edge/corner | Window resizes, respects min constraints |
| Focus | click anywhere on window | Window z-index moves to top |
| Minimize | click yellow button | Window state = 'minimized', visually hidden |
| Maximize | click green button | Window fills desktop, stores previous size |
| Restore | click green button when maximized | Returns to previous size/position |
| Close | click red button (Finder only) | Window removed from state |

### Resize Handle Implementation (Simplified)

Use 4 corner handles only - sufficient for prototype, simpler to implement:

```typescript
type ResizeCorner = 'ne' | 'se' | 'sw' | 'nw'

// Each corner maps to cursor and resize behavior
const cornerConfig = {
  ne: { cursor: 'nesw-resize', modifyX: 'right', modifyY: 'top' },
  se: { cursor: 'nwse-resize', modifyX: 'right', modifyY: 'bottom' },
  sw: { cursor: 'nesw-resize', modifyX: 'left',  modifyY: 'bottom' },
  nw: { cursor: 'nwse-resize', modifyX: 'left',  modifyY: 'top' },
}
```

Inline the resize logic directly in `desktop-window.tsx` - no separate component needed.

### Traffic Light Buttons (macOS Style)

```tsx
// High-fidelity macOS traffic lights
// NOTE: These colors are intentionally hardcoded to match macOS exactly
// This is a documented exception to the Hawkins design system
const TRAFFIC_LIGHT_CLOSE = '#FF5F57'
const TRAFFIC_LIGHT_MINIMIZE = '#FFBD2E'
const TRAFFIC_LIGHT_MAXIMIZE = '#28C840'

<div className="flex gap-2">
  <button
    style={{ backgroundColor: canClose ? TRAFFIC_LIGHT_CLOSE : '#4D4D4D' }}
    className="w-3 h-3 rounded-full hover:brightness-90"
    disabled={!canClose}
  />
  <button
    style={{ backgroundColor: TRAFFIC_LIGHT_MINIMIZE }}
    className="w-3 h-3 rounded-full hover:brightness-90"
  />
  <button
    style={{ backgroundColor: TRAFFIC_LIGHT_MAXIMIZE }}
    className="w-3 h-3 rounded-full hover:brightness-90"
  />
</div>
```

### File Tree Component (Reuse Existing)

**Use existing `src/components/ui/file-explorer.tsx`** instead of creating a new component.

The codebase already has a `FileExplorer` component with:
- `FileNode` interface with proper typing
- Multiple view modes (list, columns, gallery)
- Expand/collapse functionality
- Proper Hawkins token usage

```tsx
// finder-window.tsx
import { FileExplorer } from '@/components/ui/file-explorer'

const mockFiles: FileNode[] = [
  {
    id: '1',
    name: 'Downloads',
    type: 'folder',
    children: [
      { id: '1-1', name: 'vacation-photo.jpg', type: 'file' },
      { id: '1-2', name: 'project-assets', type: 'folder', children: [...] },
    ]
  },
]

<FinderWindow>
  <FileExplorer files={mockFiles} viewMode="list" />
</FinderWindow>
```

## Implementation (Single Phase)

Build this as a prototype - ship quickly, iterate based on user testing feedback.

**Files to create:**
- `src/app/nextgen/desktop/page.tsx`
- `src/app/nextgen/desktop/view.tsx`
- `src/app/nextgen/desktop/components/desktop-window.tsx`
- `src/app/nextgen/desktop/components/browser-window.tsx`
- `src/app/nextgen/desktop/components/finder-window.tsx`

**Total: 5 files** (down from 10 in original plan)

### Implementation Steps

1. **Route + View setup** (`page.tsx`, `view.tsx`)
   - Server component route handler
   - Client view with window state (two windows: browser + finder)
   - Full-viewport desktop with `bg-surface-flat` background

2. **Desktop Window component** (`desktop-window.tsx`)
   - macOS-style title bar with traffic light buttons (inline)
   - Drag by title bar using existing mouse event pattern from `resize-handle.tsx`
   - 4-corner resize handles (inline)
   - Props: `title`, `canClose`, `onClose`, `onMinimize`, `onMaximize`

3. **Browser Window** (`browser-window.tsx`)
   - Thin wrapper around `DesktopWindow`
   - Contains iframe pointing to `/nextgen`
   - `canClose={false}` - red button disabled

4. **Finder Window** (`finder-window.tsx`)
   - Thin wrapper around `DesktopWindow`
   - Uses existing `FileExplorer` component with mock data
   - `canClose={true}` - can be closed

### Acceptance Criteria

- [x] Route `/nextgen/desktop` renders full-viewport virtual desktop
- [x] Desktop background uses `bg-surface-flat`
- [x] Both windows appear on page load
- [x] Browser window: left-center (~1024x768), Finder: offset right (~600x500)
- [x] Traffic light buttons in correct macOS colors (red/yellow/green)
- [x] Windows draggable by title bar, constrained to desktop
- [x] 4-corner resize handles work correctly
- [x] Minimum size (400x300) enforced
- [x] Click window to bring to front (z-index management)
- [x] Minimize hides window, maximize fills desktop
- [x] Browser close button disabled; Finder can be closed
- [x] NextGen prototype interactive inside iframe
- [x] File tree shows expandable folders using existing FileExplorer

## Technical Considerations

### Performance

- Use CSS `transform: translate()` for drag position (GPU accelerated)
- Apply `will-change: transform` during active drag
- Avoid re-rendering entire desktop on window move—use local state in Window component
- Iframe isolation prevents NextGen re-renders during window manipulation

### Constraints

- **Minimum window size:** 400x300px
- **Maximum window size:** Constrained to desktop viewport
- **Title bar always visible:** Windows cannot be dragged fully off-screen
- **Desktop-only:** This feature assumes mouse interaction (no touch support needed for prototype)


## Quality Gates

- [x] TypeScript types for all components and state
- [x] Components follow existing codebase patterns (page.tsx + view.tsx)
- [x] All colors use Hawkins tokens except traffic light colors (documented exception)
- [ ] No console errors
- [ ] Works in Chrome (prototype only - no cross-browser testing needed)

## File Structure Summary

```
src/app/nextgen/desktop/
├── page.tsx                      # Server component
├── view.tsx                      # Client component with window state
└── components/
    ├── desktop-window.tsx        # Window chrome (title bar, buttons, resize inline)
    ├── browser-window.tsx        # Wraps DesktopWindow + iframe
    └── finder-window.tsx         # Wraps DesktopWindow + FileExplorer
```

**Note:** Reuses existing `src/components/ui/file-explorer.tsx` - no new file tree component needed.

## References & Research

### Internal References

- Resize pattern: `src/components/ui/resize-handle.tsx:14-45`
- Modal overlay pattern: `src/components/ui/modal.tsx`
- Card styling: `src/components/ui/card.tsx`
- App layout structure: `src/components/layouts/app-layout.tsx`
- Design tokens: `COLORS.md`, `TYPOGRAPHY.md`

### External References

- macOS Human Interface Guidelines (window behavior)
- CSS `transform` for performant animations
- React event handling for drag operations

### Related Work

- Existing NextGen prototype at `/nextgen/*`
