'use client'

import { DesktopWindow } from './desktop-window'
import { FileExplorer, type FileNode } from '@/components/ui/file-explorer'
import type { WindowState } from '../view'

// Mock file tree data representing local file system
const mockFiles: FileNode[] = [
  {
    id: '1',
    name: 'Downloads',
    type: 'folder',
    modifiedAt: '2026-02-10',
    children: [
      {
        id: '1-1',
        name: 'vacation-sunset.jpg',
        type: 'file',
        extension: 'jpg',
        size: 2457600,
        modifiedAt: '2026-02-08',
      },
      {
        id: '1-2',
        name: 'product-demo.mp4',
        type: 'file',
        extension: 'mp4',
        size: 157286400,
        modifiedAt: '2026-02-05',
      },
      {
        id: '1-3',
        name: 'meeting-notes.pdf',
        type: 'file',
        extension: 'pdf',
        size: 524288,
        modifiedAt: '2026-02-01',
      },
    ],
  },
  {
    id: '2',
    name: 'Documents',
    type: 'folder',
    modifiedAt: '2026-02-12',
    children: [
      {
        id: '2-1',
        name: 'Project Assets',
        type: 'folder',
        modifiedAt: '2026-02-11',
        children: [
          {
            id: '2-1-1',
            name: 'hero-image.png',
            type: 'file',
            extension: 'png',
            size: 3145728,
            modifiedAt: '2026-02-10',
          },
          {
            id: '2-1-2',
            name: 'logo-variations.ai',
            type: 'file',
            extension: 'ai',
            size: 8388608,
            modifiedAt: '2026-02-09',
          },
          {
            id: '2-1-3',
            name: 'brand-guidelines.pdf',
            type: 'file',
            extension: 'pdf',
            size: 2097152,
            modifiedAt: '2026-02-07',
          },
        ],
      },
      {
        id: '2-2',
        name: 'Reports',
        type: 'folder',
        modifiedAt: '2026-02-06',
        children: [
          {
            id: '2-2-1',
            name: 'Q4-review.docx',
            type: 'file',
            extension: 'docx',
            size: 1048576,
            modifiedAt: '2026-02-04',
          },
        ],
      },
    ],
  },
  {
    id: '3',
    name: 'Pictures',
    type: 'folder',
    modifiedAt: '2026-02-13',
    children: [
      {
        id: '3-1',
        name: 'Screenshots',
        type: 'folder',
        modifiedAt: '2026-02-13',
        children: [
          {
            id: '3-1-1',
            name: 'app-mockup-v2.png',
            type: 'file',
            extension: 'png',
            size: 1572864,
            modifiedAt: '2026-02-13',
          },
          {
            id: '3-1-2',
            name: 'dashboard-preview.png',
            type: 'file',
            extension: 'png',
            size: 2097152,
            modifiedAt: '2026-02-12',
          },
        ],
      },
      {
        id: '3-2',
        name: 'Camera Roll',
        type: 'folder',
        modifiedAt: '2026-02-11',
        children: [
          {
            id: '3-2-1',
            name: 'IMG_1234.jpg',
            type: 'file',
            extension: 'jpg',
            size: 4194304,
            modifiedAt: '2026-02-11',
          },
          {
            id: '3-2-2',
            name: 'IMG_1235.jpg',
            type: 'file',
            extension: 'jpg',
            size: 3670016,
            modifiedAt: '2026-02-11',
          },
        ],
      },
    ],
  },
  {
    id: '4',
    name: 'Videos',
    type: 'folder',
    modifiedAt: '2026-02-09',
    children: [
      {
        id: '4-1',
        name: 'tutorial-recording.mov',
        type: 'file',
        extension: 'mov',
        size: 524288000,
        modifiedAt: '2026-02-09',
      },
      {
        id: '4-2',
        name: 'screen-capture.mp4',
        type: 'file',
        extension: 'mp4',
        size: 104857600,
        modifiedAt: '2026-02-08',
      },
    ],
  },
]

interface FinderWindowProps {
  window: WindowState
  isActive: boolean
  onFocus: () => void
  onMove: (x: number, y: number) => void
  onResize: (width: number, height: number, x?: number, y?: number) => void
  onMinimize: () => void
  onMaximize: () => void
  onClose: () => void
}

export function FinderWindow({
  window,
  isActive,
  onFocus,
  onMove,
  onResize,
  onMinimize,
  onMaximize,
  onClose,
}: FinderWindowProps) {
  return (
    <DesktopWindow
      window={window}
      isActive={isActive}
      canClose={true}
      onFocus={onFocus}
      onMove={onMove}
      onResize={onResize}
      onMinimize={onMinimize}
      onMaximize={onMaximize}
      onClose={onClose}
    >
      <div className="h-full overflow-auto bg-surface-flat">
        <FileExplorer
          files={mockFiles}
          viewMode="list"
          showViewToggle={false}
        />
      </div>
    </DesktopWindow>
  )
}
