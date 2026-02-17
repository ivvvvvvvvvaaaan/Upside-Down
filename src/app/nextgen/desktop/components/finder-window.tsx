'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DesktopWindow } from './desktop-window'
import { cn } from '@/lib/utils'
import type { WindowState, SyncStatus } from '../view'
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Columns,
  ChevronRight as ChevronRightSmall,
  Folder,
  File,
  Image as ImageIcon,
  FileVideo,
  FileText,
  HardDrive,
  Monitor,
  Cloud,
  CloudOff,
  Download,
  FileIcon,
  FolderOpen,
  Briefcase,
  Lock,
  AlertTriangle,
  Loader2,
} from 'lucide-react'

// Sidebar items for Finder
interface SidebarItem {
  id: string
  name: string
  icon: typeof Folder
  type: 'favorite' | 'location' | 'tag'
}

const sidebarItems: SidebarItem[] = [
  { id: 'airdrop', name: 'AirDrop', icon: Cloud, type: 'favorite' },
  { id: 'recents', name: 'Recents', icon: FileIcon, type: 'favorite' },
  { id: 'applications', name: 'Applications', icon: FolderOpen, type: 'favorite' },
  { id: 'desktop', name: 'Desktop', icon: Monitor, type: 'favorite' },
  { id: 'documents', name: 'Documents', icon: Folder, type: 'favorite' },
  { id: 'downloads', name: 'Downloads', icon: Download, type: 'favorite' },
  { id: 'macintosh', name: 'Macintosh HD', icon: HardDrive, type: 'location' },
  { id: 'workspace', name: 'Workspaces', icon: Briefcase, type: 'location' },
]

// File node type
interface FileNode {
  id: string
  name: string
  type: 'folder' | 'file'
  extension?: string
  size?: number
  modifiedAt?: string
  children?: FileNode[]
  // Folder indicators
  isCloud?: boolean
  isLocked?: boolean
}

// LocalStorage keys
const WORKSPACE_FILES_STORAGE_KEY = 'desktop-workspace-files'
const EXPANDED_FOLDERS_STORAGE_KEY = 'desktop-expanded-folders'

// Default expanded folders
const DEFAULT_EXPANDED_FOLDERS = ['1', '2', '3', 'ws-my', 'ws-my-wip', 'ws-my-refs', 'ws-shared', 'ws-sts6', 'ws-art', 'ws-vfx', 'ws-camera', 'ws-editorial', 'ws-audio']

// Workspaces - Department folder structures (default)
const defaultWorkspaceFiles: FileNode[] = [
  {
    id: 'ws-my',
    name: 'My Workspace',
    type: 'folder',
    modifiedAt: '2026-02-14',
    children: [
      {
        id: 'ws-my-wip',
        name: 'Work in Progress',
        type: 'folder',
        modifiedAt: '2026-02-14',
        children: [
          { id: 'ws-my-wip-1', name: 'eleven_portrait_v4_WIP.psd', type: 'file', extension: 'psd', size: 89128960, modifiedAt: '2026-02-14' },
          { id: 'ws-my-wip-2', name: 'hawkins_lab_exterior_sketch.psd', type: 'file', extension: 'psd', size: 52428800, modifiedAt: '2026-02-13' },
          { id: 'ws-my-wip-3', name: 'upside_down_color_test.psd', type: 'file', extension: 'psd', size: 67108864, modifiedAt: '2026-02-12' },
        ],
      },
      {
        id: 'ws-my-refs',
        name: 'My References',
        type: 'folder',
        modifiedAt: '2026-02-13',
        children: [
          { id: 'ws-my-refs-1', name: '80s_typography_inspo.png', type: 'file', extension: 'png', size: 4194304, modifiedAt: '2026-02-13' },
          { id: 'ws-my-refs-2', name: 'neon_lighting_examples.jpg', type: 'file', extension: 'jpg', size: 3145728, modifiedAt: '2026-02-12' },
          { id: 'ws-my-refs-3', name: 'creature_anatomy_ref.pdf', type: 'file', extension: 'pdf', size: 15728640, modifiedAt: '2026-02-11' },
        ],
      },
      { id: 'ws-my-notes', name: 'episode_3_notes.txt', type: 'file', extension: 'txt', size: 8192, modifiedAt: '2026-02-14' },
      { id: 'ws-my-todo', name: 'deliverables_checklist.docx', type: 'file', extension: 'docx', size: 32768, modifiedAt: '2026-02-13' },
    ],
  },
  {
    id: 'ws-shared',
    name: 'Shared Workspaces',
    type: 'folder',
    modifiedAt: '2026-02-14',
    children: [
      {
        id: 'ws-sts6',
        name: 'Stranger Things S6',
        type: 'folder',
        modifiedAt: '2026-02-14',
        children: [
          {
            id: 'ws-art',
            name: 'Art Department',
            type: 'folder',
            modifiedAt: '2026-02-14',
            children: [
              {
                id: 'ws-art-concept',
        name: 'Concept Art',
        type: 'folder',
        modifiedAt: '2026-02-13',
        children: [
          { id: 'ws-art-concept-1', name: 'hero_pose_v3.psd', type: 'file', extension: 'psd', size: 45678592, modifiedAt: '2026-02-13' },
          { id: 'ws-art-concept-2', name: 'villain_design_final.psd', type: 'file', extension: 'psd', size: 38912000, modifiedAt: '2026-02-12' },
        ],
      },
      {
        id: 'ws-art-storyboards',
        name: 'Storyboards',
        type: 'folder',
        modifiedAt: '2026-02-12',
        children: [
          { id: 'ws-art-sb-1', name: 'Act1_Seq01_boards.pdf', type: 'file', extension: 'pdf', size: 12582912, modifiedAt: '2026-02-12' },
          { id: 'ws-art-sb-2', name: 'Act1_Seq02_boards.pdf', type: 'file', extension: 'pdf', size: 15728640, modifiedAt: '2026-02-11' },
          { id: 'ws-art-sb-3', name: 'Act2_Seq01_boards.pdf', type: 'file', extension: 'pdf', size: 18874368, modifiedAt: '2026-02-10' },
        ],
      },
      {
        id: 'ws-art-characters',
        name: 'Character Designs',
        type: 'folder',
        modifiedAt: '2026-02-11',
        children: [
          { id: 'ws-art-char-1', name: 'protagonist_turnaround.png', type: 'file', extension: 'png', size: 8388608, modifiedAt: '2026-02-11' },
          { id: 'ws-art-char-2', name: 'supporting_cast_lineup.png', type: 'file', extension: 'png', size: 12582912, modifiedAt: '2026-02-10' },
        ],
      },
      {
        id: 'ws-art-environments',
        name: 'Environment Designs',
        type: 'folder',
        modifiedAt: '2026-02-10',
        children: [
          { id: 'ws-art-env-1', name: 'downtown_night_v2.psd', type: 'file', extension: 'psd', size: 67108864, modifiedAt: '2026-02-10' },
          { id: 'ws-art-env-2', name: 'warehouse_interior.psd', type: 'file', extension: 'psd', size: 52428800, modifiedAt: '2026-02-09' },
        ],
      },
      {
        id: 'ws-art-props',
        name: 'Props',
        type: 'folder',
        modifiedAt: '2026-02-09',
        children: [
          { id: 'ws-art-props-1', name: 'hero_weapon_designs.ai', type: 'file', extension: 'ai', size: 15728640, modifiedAt: '2026-02-09' },
          { id: 'ws-art-props-2', name: 'vehicle_concepts.ai', type: 'file', extension: 'ai', size: 20971520, modifiedAt: '2026-02-08' },
        ],
      },
      {
        id: 'ws-art-colorscripts',
        name: 'Color Scripts',
        type: 'folder',
        modifiedAt: '2026-02-08',
        children: [
          { id: 'ws-art-cs-1', name: 'act1_color_script.png', type: 'file', extension: 'png', size: 5242880, modifiedAt: '2026-02-08' },
          { id: 'ws-art-cs-2', name: 'act2_color_script.png', type: 'file', extension: 'png', size: 4718592, modifiedAt: '2026-02-07' },
        ],
      },
      {
        id: 'ws-art-reference',
        name: 'Reference',
        type: 'folder',
        modifiedAt: '2026-02-07',
        children: [
          { id: 'ws-art-ref-1', name: 'architecture_refs.zip', type: 'file', extension: 'zip', size: 104857600, modifiedAt: '2026-02-07' },
          { id: 'ws-art-ref-2', name: 'costume_research.pdf', type: 'file', extension: 'pdf', size: 31457280, modifiedAt: '2026-02-06' },
        ],
      },
        ],
      },
      {
        id: 'ws-vfx',
        name: 'VFX',
    type: 'folder',
    modifiedAt: '2026-02-14',
    children: [
      {
        id: 'ws-vfx-shots',
        name: 'Shots',
        type: 'folder',
        modifiedAt: '2026-02-14',
        children: [
          {
            id: 'ws-vfx-shots-seq10',
            name: 'SEQ010',
            type: 'folder',
            modifiedAt: '2026-02-14',
            children: [
              { id: 'ws-vfx-010-010', name: 'SEQ010_SH010_comp_v12.exr', type: 'file', extension: 'exr', size: 157286400, modifiedAt: '2026-02-14' },
              { id: 'ws-vfx-010-020', name: 'SEQ010_SH020_comp_v08.exr', type: 'file', extension: 'exr', size: 134217728, modifiedAt: '2026-02-13' },
              { id: 'ws-vfx-010-030', name: 'SEQ010_SH030_comp_v05.exr', type: 'file', extension: 'exr', size: 125829120, modifiedAt: '2026-02-12' },
            ],
          },
          {
            id: 'ws-vfx-shots-seq20',
            name: 'SEQ020',
            type: 'folder',
            modifiedAt: '2026-02-13',
            children: [
              { id: 'ws-vfx-020-010', name: 'SEQ020_SH010_comp_v03.exr', type: 'file', extension: 'exr', size: 146800640, modifiedAt: '2026-02-13' },
              { id: 'ws-vfx-020-020', name: 'SEQ020_SH020_comp_v01.exr', type: 'file', extension: 'exr', size: 115343360, modifiedAt: '2026-02-12' },
            ],
          },
        ],
      },
      {
        id: 'ws-vfx-assets',
        name: 'Assets',
        type: 'folder',
        modifiedAt: '2026-02-12',
        children: [
          {
            id: 'ws-vfx-assets-3d',
            name: '3D Models',
            type: 'folder',
            modifiedAt: '2026-02-12',
            children: [
              { id: 'ws-vfx-3d-1', name: 'hero_vehicle_rigged.mb', type: 'file', extension: 'mb', size: 89128960, modifiedAt: '2026-02-12' },
              { id: 'ws-vfx-3d-2', name: 'building_destruction_sim.hip', type: 'file', extension: 'hip', size: 209715200, modifiedAt: '2026-02-11' },
            ],
          },
          {
            id: 'ws-vfx-assets-tex',
            name: 'Textures',
            type: 'folder',
            modifiedAt: '2026-02-11',
            children: [
              { id: 'ws-vfx-tex-1', name: 'concrete_damaged_4k.tx', type: 'file', extension: 'tx', size: 67108864, modifiedAt: '2026-02-11' },
              { id: 'ws-vfx-tex-2', name: 'metal_scratched_4k.tx', type: 'file', extension: 'tx', size: 58720256, modifiedAt: '2026-02-10' },
            ],
          },
          {
            id: 'ws-vfx-assets-hdri',
            name: 'HDRIs',
            type: 'folder',
            modifiedAt: '2026-02-10',
            children: [
              { id: 'ws-vfx-hdri-1', name: 'downtown_night_16k.exr', type: 'file', extension: 'exr', size: 314572800, modifiedAt: '2026-02-10' },
              { id: 'ws-vfx-hdri-2', name: 'studio_soft_8k.exr', type: 'file', extension: 'exr', size: 125829120, modifiedAt: '2026-02-09' },
            ],
          },
        ],
      },
      {
        id: 'ws-vfx-elements',
        name: 'Elements',
        type: 'folder',
        modifiedAt: '2026-02-09',
        children: [
          { id: 'ws-vfx-elem-1', name: 'dust_hits_collection.mov', type: 'file', extension: 'mov', size: 524288000, modifiedAt: '2026-02-09' },
          { id: 'ws-vfx-elem-2', name: 'sparks_4k_prores.mov', type: 'file', extension: 'mov', size: 419430400, modifiedAt: '2026-02-08' },
          { id: 'ws-vfx-elem-3', name: 'smoke_plumes.mov', type: 'file', extension: 'mov', size: 367001600, modifiedAt: '2026-02-07' },
        ],
      },
      {
        id: 'ws-vfx-scripts',
        name: 'Scripts & Tools',
        type: 'folder',
        modifiedAt: '2026-02-08',
        children: [
          { id: 'ws-vfx-script-1', name: 'auto_comp_setup.py', type: 'file', extension: 'py', size: 15360, modifiedAt: '2026-02-08' },
          { id: 'ws-vfx-script-2', name: 'render_submitter.py', type: 'file', extension: 'py', size: 28672, modifiedAt: '2026-02-07' },
        ],
      },
      {
        id: 'ws-vfx-reference',
        name: 'Reference',
        type: 'folder',
        modifiedAt: '2026-02-07',
        children: [
          { id: 'ws-vfx-ref-1', name: 'explosion_reference.mp4', type: 'file', extension: 'mp4', size: 157286400, modifiedAt: '2026-02-07' },
          { id: 'ws-vfx-ref-2', name: 'fluid_sim_lookdev.mp4', type: 'file', extension: 'mp4', size: 104857600, modifiedAt: '2026-02-06' },
        ],
      },
    ],
  },
  {
    id: 'ws-camera',
    name: 'Camera',
    type: 'folder',
    modifiedAt: '2026-02-14',
    children: [
      {
        id: 'ws-cam-dailies',
        name: 'Dailies',
        type: 'folder',
        modifiedAt: '2026-02-14',
        children: [
          {
            id: 'ws-cam-dailies-0214',
            name: '2026-02-14',
            type: 'folder',
            modifiedAt: '2026-02-14',
            children: [
              { id: 'ws-cam-daily-1', name: 'A001_C001_0214_001.mov', type: 'file', extension: 'mov', size: 2147483648, modifiedAt: '2026-02-14' },
              { id: 'ws-cam-daily-2', name: 'A001_C002_0214_001.mov', type: 'file', extension: 'mov', size: 1879048192, modifiedAt: '2026-02-14' },
              { id: 'ws-cam-daily-3', name: 'A001_C003_0214_001.mov', type: 'file', extension: 'mov', size: 2415919104, modifiedAt: '2026-02-14' },
            ],
          },
          {
            id: 'ws-cam-dailies-0213',
            name: '2026-02-13',
            type: 'folder',
            modifiedAt: '2026-02-13',
            children: [
              { id: 'ws-cam-daily-4', name: 'A001_C001_0213_001.mov', type: 'file', extension: 'mov', size: 1610612736, modifiedAt: '2026-02-13' },
              { id: 'ws-cam-daily-5', name: 'A001_C002_0213_001.mov', type: 'file', extension: 'mov', size: 2013265920, modifiedAt: '2026-02-13' },
            ],
          },
        ],
      },
      {
        id: 'ws-cam-selects',
        name: 'Selects',
        type: 'folder',
        modifiedAt: '2026-02-13',
        children: [
          { id: 'ws-cam-sel-1', name: 'Scene12_TakeB_SELECTED.mov', type: 'file', extension: 'mov', size: 943718400, modifiedAt: '2026-02-13' },
          { id: 'ws-cam-sel-2', name: 'Scene15_TakeD_SELECTED.mov', type: 'file', extension: 'mov', size: 1073741824, modifiedAt: '2026-02-12' },
        ],
      },
      {
        id: 'ws-cam-luts',
        name: 'LUTs',
        type: 'folder',
        modifiedAt: '2026-02-10',
        children: [
          { id: 'ws-cam-lut-1', name: 'ARRI_LogC4_to_Rec709.cube', type: 'file', extension: 'cube', size: 2097152, modifiedAt: '2026-02-10' },
          { id: 'ws-cam-lut-2', name: 'Show_Look_v3.cube', type: 'file', extension: 'cube', size: 1572864, modifiedAt: '2026-02-09' },
          { id: 'ws-cam-lut-3', name: 'Day_Exterior_Grade.cube', type: 'file', extension: 'cube', size: 1048576, modifiedAt: '2026-02-08' },
        ],
      },
      {
        id: 'ws-cam-reports',
        name: 'Camera Reports',
        type: 'folder',
        modifiedAt: '2026-02-14',
        children: [
          { id: 'ws-cam-rpt-1', name: 'Day01_Camera_Report.pdf', type: 'file', extension: 'pdf', size: 524288, modifiedAt: '2026-02-14' },
          { id: 'ws-cam-rpt-2', name: 'Day02_Camera_Report.pdf', type: 'file', extension: 'pdf', size: 491520, modifiedAt: '2026-02-13' },
        ],
      },
      {
        id: 'ws-cam-lensmaps',
        name: 'Lens Data',
        type: 'folder',
        modifiedAt: '2026-02-09',
        children: [
          { id: 'ws-cam-lens-1', name: 'MasterPrime_25mm_distortion.nk', type: 'file', extension: 'nk', size: 32768, modifiedAt: '2026-02-09' },
          { id: 'ws-cam-lens-2', name: 'MasterPrime_50mm_distortion.nk', type: 'file', extension: 'nk', size: 32768, modifiedAt: '2026-02-08' },
          { id: 'ws-cam-lens-3', name: 'lens_grid_charts.pdf', type: 'file', extension: 'pdf', size: 8388608, modifiedAt: '2026-02-07' },
        ],
      },
      {
        id: 'ws-cam-techspecs',
        name: 'Tech Specs',
        type: 'folder',
        modifiedAt: '2026-02-08',
        children: [
          { id: 'ws-cam-spec-1', name: 'ARRI_ALEXA35_specs.pdf', type: 'file', extension: 'pdf', size: 4194304, modifiedAt: '2026-02-08' },
          { id: 'ws-cam-spec-2', name: 'shooting_format_guide.pdf', type: 'file', extension: 'pdf', size: 2097152, modifiedAt: '2026-02-07' },
        ],
      },
    ],
  },
  {
    id: 'ws-editorial',
    name: 'Editorial',
    type: 'folder',
    modifiedAt: '2026-02-14',
    children: [
      {
        id: 'ws-edit-cuts',
        name: 'Cuts',
        type: 'folder',
        modifiedAt: '2026-02-14',
        children: [
          { id: 'ws-edit-cut-1', name: 'EP301_Directors_Cut_v4.prproj', type: 'file', extension: 'prproj', size: 52428800, modifiedAt: '2026-02-14' },
          { id: 'ws-edit-cut-2', name: 'EP301_Assembly_v2.prproj', type: 'file', extension: 'prproj', size: 41943040, modifiedAt: '2026-02-12' },
          { id: 'ws-edit-cut-3', name: 'EP302_Rough_Cut_v1.prproj', type: 'file', extension: 'prproj', size: 36700160, modifiedAt: '2026-02-10' },
        ],
      },
      {
        id: 'ws-edit-exports',
        name: 'Exports',
        type: 'folder',
        modifiedAt: '2026-02-13',
        children: [
          { id: 'ws-edit-exp-1', name: 'EP301_DC_v4_ProRes.mov', type: 'file', extension: 'mov', size: 8589934592, modifiedAt: '2026-02-13' },
          { id: 'ws-edit-exp-2', name: 'EP301_DC_v4_H264_Review.mp4', type: 'file', extension: 'mp4', size: 524288000, modifiedAt: '2026-02-13' },
        ],
      },
      {
        id: 'ws-edit-vfx-pulls',
        name: 'VFX Pulls',
        type: 'folder',
        modifiedAt: '2026-02-12',
        children: [
          { id: 'ws-edit-vfx-1', name: 'EP301_VFX_Pulls_v2.xlsx', type: 'file', extension: 'xlsx', size: 1048576, modifiedAt: '2026-02-12' },
          { id: 'ws-edit-vfx-2', name: 'SEQ010_SH020_plate.mov', type: 'file', extension: 'mov', size: 2147483648, modifiedAt: '2026-02-11' },
        ],
      },
      {
        id: 'ws-edit-scripts',
        name: 'Scripts',
        type: 'folder',
        modifiedAt: '2026-02-10',
        children: [
          { id: 'ws-edit-script-1', name: 'EP301_Shooting_Script.pdf', type: 'file', extension: 'pdf', size: 2097152, modifiedAt: '2026-02-10' },
          { id: 'ws-edit-script-2', name: 'EP301_Lined_Script.pdf', type: 'file', extension: 'pdf', size: 4194304, modifiedAt: '2026-02-09' },
        ],
      },
    ],
  },
  {
    id: 'ws-audio',
    name: 'Audio & Sound',
    type: 'folder',
    modifiedAt: '2026-02-14',
    children: [
      {
        id: 'ws-audio-production',
        name: 'Production Audio',
        type: 'folder',
        modifiedAt: '2026-02-14',
        children: [
          { id: 'ws-audio-prod-1', name: 'Day01_Sound_Report.pdf', type: 'file', extension: 'pdf', size: 524288, modifiedAt: '2026-02-14' },
          { id: 'ws-audio-prod-2', name: 'Scene12_TakeB_ISO.wav', type: 'file', extension: 'wav', size: 157286400, modifiedAt: '2026-02-14' },
          { id: 'ws-audio-prod-3', name: 'Scene12_TakeB_MIX.wav', type: 'file', extension: 'wav', size: 52428800, modifiedAt: '2026-02-14' },
        ],
      },
      {
        id: 'ws-audio-sfx',
        name: 'Sound Effects',
        type: 'folder',
        modifiedAt: '2026-02-12',
        children: [
          { id: 'ws-audio-sfx-1', name: 'upside_down_ambience_v3.wav', type: 'file', extension: 'wav', size: 104857600, modifiedAt: '2026-02-12' },
          { id: 'ws-audio-sfx-2', name: 'demogorgon_growl_collection.wav', type: 'file', extension: 'wav', size: 78643200, modifiedAt: '2026-02-11' },
          { id: 'ws-audio-sfx-3', name: 'portal_whoosh_layers.wav', type: 'file', extension: 'wav', size: 52428800, modifiedAt: '2026-02-10' },
        ],
      },
      {
        id: 'ws-audio-music',
        name: 'Music',
        type: 'folder',
        modifiedAt: '2026-02-11',
        children: [
          { id: 'ws-audio-music-1', name: 'EP301_Score_Cue01_Tension.wav', type: 'file', extension: 'wav', size: 41943040, modifiedAt: '2026-02-11' },
          { id: 'ws-audio-music-2', name: 'EP301_Score_Cue02_Chase.wav', type: 'file', extension: 'wav', size: 62914560, modifiedAt: '2026-02-10' },
          { id: 'ws-audio-music-3', name: '80s_needle_drop_options.zip', type: 'file', extension: 'zip', size: 314572800, modifiedAt: '2026-02-09' },
        ],
      },
      {
        id: 'ws-audio-mix',
        name: 'Mix Sessions',
        type: 'folder',
        modifiedAt: '2026-02-10',
        children: [
          { id: 'ws-audio-mix-1', name: 'EP301_5.1_Mix_v2.ptx', type: 'file', extension: 'ptx', size: 209715200, modifiedAt: '2026-02-10' },
          { id: 'ws-audio-mix-2', name: 'EP301_Atmos_Mix_v1.ptx', type: 'file', extension: 'ptx', size: 262144000, modifiedAt: '2026-02-09' },
        ],
      },
    ],
  },
        ],
      },
    ],
  },
]

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

// Helper function to generate unique IDs
function generateId(): string {
  return `ws-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

// Helper function to add a folder to the tree
function addFolderToTree(nodes: FileNode[], parentId: string, newFolder: FileNode): FileNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children || []), newFolder],
      }
    }
    if (node.children) {
      return {
        ...node,
        children: addFolderToTree(node.children, parentId, newFolder),
      }
    }
    return node
  })
}

// Helper function to rename an item in the tree
function renameItemInTree(nodes: FileNode[], itemId: string, newName: string): FileNode[] {
  return nodes.map((node) => {
    if (node.id === itemId) {
      return { ...node, name: newName, modifiedAt: getTodayDate() }
    }
    if (node.children) {
      return {
        ...node,
        children: renameItemInTree(node.children, itemId, newName),
      }
    }
    return node
  })
}

// Helper function to delete an item from the tree
function deleteItemFromTree(nodes: FileNode[], itemId: string): FileNode[] {
  return nodes
    .filter((node) => node.id !== itemId)
    .map((node) => {
      if (node.children) {
        return {
          ...node,
          children: deleteItemFromTree(node.children, itemId),
        }
      }
      return node
    })
}

// Helper function to find a node by ID
function findNodeById(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

// Helper function to filter out hidden folders from tree
function filterHiddenFolders(nodes: FileNode[], hiddenIds: Set<string>): FileNode[] {
  return nodes
    .filter((node) => !hiddenIds.has(node.id))
    .map((node) => {
      if (node.children) {
        return {
          ...node,
          children: filterHiddenFolders(node.children, hiddenIds),
        }
      }
      return node
    })
}

function getFileIcon(node: FileNode, sizeClass: string = 'w-4 h-4') {
  if (node.type === 'folder') {
    return <Folder className={cn(sizeClass, 'text-blue-500')} />
  }

  const ext = node.extension?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'psd', 'ai'].includes(ext || '')) {
    return <ImageIcon className={cn(sizeClass, 'text-foreground/70')} />
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '')) {
    return <FileVideo className={cn(sizeClass, 'text-foreground/70')} />
  }
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '')) {
    return <FileText className={cn(sizeClass, 'text-foreground/70')} />
  }
  return <File className={cn(sizeClass, 'text-foreground/70')} />
}

// Render folder status indicators (cloud, locked)
function FolderIndicators({
  node,
  className,
  lockedFolderIds,
  cloudSyncEnabled,
  syncStatus,
}: {
  node: FileNode
  className?: string
  lockedFolderIds?: Set<string>
  cloudSyncEnabled?: boolean
  syncStatus?: SyncStatus
}) {
  const isLocked = lockedFolderIds?.has(node.id) ?? false
  const showSyncStatus = cloudSyncEnabled && node.type === 'folder'

  if (node.type !== 'folder' || (!showSyncStatus && !isLocked)) {
    return null
  }

  // Get sync icon based on status
  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return <Cloud className="w-3.5 h-3.5 text-foreground-dim" />
      case 'syncing':
        return <Loader2 className="w-3.5 h-3.5 text-foreground-dim animate-spin" />
      case 'error':
        return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
      case 'offline':
        return <CloudOff className="w-3.5 h-3.5 text-foreground-dim" />
      default:
        return <Cloud className="w-3.5 h-3.5 text-foreground-dim" />
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {showSyncStatus && getSyncIcon()}
      {isLocked && (
        <Lock className="w-3.5 h-3.5 text-orange-500" />
      )}
    </div>
  )
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface FinderWindowProps {
  window: WindowState
  isActive: boolean
  onFocus: () => void
  onMove: (x: number, y: number) => void
  onResize: (width: number, height: number, x?: number, y?: number) => void
  onMinimize: () => void
  onMaximize: () => void
  onClose: () => void
  lockedFolderIds: Set<string>
  hiddenFolderIds: Set<string>
  cloudSyncEnabled: boolean
  syncStatus: SyncStatus
}

export function FinderWindow({
  window: windowState,
  isActive,
  onFocus,
  onMove,
  onResize,
  onMinimize,
  onMaximize,
  onClose,
  lockedFolderIds,
  hiddenFolderIds,
  cloudSyncEnabled,
  syncStatus,
}: FinderWindowProps) {
  const [selectedSidebar, setSelectedSidebar] = useState('workspace')
  const [viewMode, setViewMode] = useState<'icons' | 'list' | 'columns'>('list')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set(DEFAULT_EXPANDED_FOLDERS)
    const saved = localStorage.getItem(EXPANDED_FOLDERS_STORAGE_KEY)
    if (saved) {
      try {
        return new Set(JSON.parse(saved))
      } catch {
        return new Set(DEFAULT_EXPANDED_FOLDERS)
      }
    }
    return new Set(DEFAULT_EXPANDED_FOLDERS)
  })
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  // Folder navigation state (for icons view) - stores folder IDs to avoid stale references
  const [folderPathIds, setFolderPathIds] = useState<string[]>([])

  // Editable workspace files state
  const [workspaceFiles, setWorkspaceFiles] = useState<FileNode[]>(() => {
    if (typeof window === 'undefined') return defaultWorkspaceFiles
    const saved = localStorage.getItem(WORKSPACE_FILES_STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return defaultWorkspaceFiles
      }
    }
    return defaultWorkspaceFiles
  })

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Update workspace files and persist to localStorage
  const updateWorkspaceFiles = useCallback((updater: (prev: FileNode[]) => FileNode[]) => {
    setWorkspaceFiles((prev) => {
      const next = updater(prev)
      localStorage.setItem(WORKSPACE_FILES_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  // Focus rename input when it appears
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingId])

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    item: FileNode
  } | null>(null)

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null)
    }

    if (contextMenu) {
      document.addEventListener('click', handleClick)
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('click', handleClick)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [contextMenu])

  // Handle right-click on file/folder
  const handleContextMenu = useCallback((e: React.MouseEvent, item: FileNode) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedFile(item.id)
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    })
  }, [])

  // Create a new folder inside the specified parent folder
  const handleCreateFolder = useCallback((parentId: string) => {
    const newFolder: FileNode = {
      id: generateId(),
      name: 'untitled folder',
      type: 'folder',
      modifiedAt: getTodayDate(),
      children: [],
    }
    updateWorkspaceFiles((prev) => addFolderToTree(prev, parentId, newFolder))
    setExpandedFolders((prev) => {
      const next = new Set([...Array.from(prev), parentId])
      localStorage.setItem(EXPANDED_FOLDERS_STORAGE_KEY, JSON.stringify(Array.from(next)))
      return next
    })
    setContextMenu(null)
    // Start renaming the new folder immediately
    setTimeout(() => {
      setRenamingId(newFolder.id)
      setRenameValue(newFolder.name)
    }, 50)
  }, [updateWorkspaceFiles])

  // Start renaming an item
  const handleStartRename = useCallback((item: FileNode) => {
    setRenamingId(item.id)
    setRenameValue(item.name)
    setContextMenu(null)
  }, [])

  // Finish renaming (save)
  const handleFinishRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      updateWorkspaceFiles((prev) => renameItemInTree(prev, renamingId, renameValue.trim()))
    }
    setRenamingId(null)
    setRenameValue('')
  }, [renamingId, renameValue, updateWorkspaceFiles])

  // Cancel renaming
  const handleCancelRename = useCallback(() => {
    setRenamingId(null)
    setRenameValue('')
  }, [])

  // Delete an item
  const handleDeleteItem = useCallback((itemId: string) => {
    updateWorkspaceFiles((prev) => deleteItemFromTree(prev, itemId))
    setContextMenu(null)
    if (selectedFile === itemId) {
      setSelectedFile(null)
    }
  }, [selectedFile, updateWorkspaceFiles])

  // Get root files based on selected sidebar location, filtering out hidden folders
  const rootFilesUnfiltered = selectedSidebar === 'workspace' ? workspaceFiles : mockFiles
  const rootFiles = filterHiddenFolders(rootFilesUnfiltered, hiddenFolderIds)

  // Build folder path from IDs (to get fresh references from current state)
  const folderPath = folderPathIds.map(id => findNodeById(rootFiles, id)).filter((n): n is FileNode => n !== null)

  // Get current files based on folder path (for icons view navigation)
  const currentFiles = folderPath.length > 0
    ? folderPath[folderPath.length - 1].children || []
    : rootFiles

  // Navigate into a folder (for icons view) - blocked if folder is locked
  const navigateIntoFolder = useCallback((folder: FileNode) => {
    if (folder.type === 'folder' && folder.children && !lockedFolderIds.has(folder.id)) {
      setFolderPathIds((prev) => [...prev, folder.id])
      setSelectedFile(null)
    }
  }, [lockedFolderIds])

  // Navigate back one folder
  const navigateBack = useCallback(() => {
    setFolderPathIds((prev) => prev.slice(0, -1))
    setSelectedFile(null)
  }, [])

  // Check if we can go back
  const canGoBack = folderPath.length > 0

  // Get display name for current location
  const getLocationName = () => {
    if (folderPath.length > 0) {
      return folderPath[folderPath.length - 1].name
    }
    const item = sidebarItems.find((i) => i.id === selectedSidebar)
    return item?.name || 'Finder'
  }

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      localStorage.setItem(EXPANDED_FOLDERS_STORAGE_KEY, JSON.stringify(Array.from(next)))
      return next
    })
  }

  // Flatten all files for icons view
  const getAllFiles = (nodes: FileNode[]): FileNode[] => {
    const result: FileNode[] = []
    for (const node of nodes) {
      result.push(node)
      if (node.type === 'folder' && node.children) {
        result.push(...getAllFiles(node.children))
      }
    }
    return result
  }

  // List view row
  const renderFileRow = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.id)
    const isSelected = selectedFile === node.id

    return (
      <div key={node.id}>
        <div
          onClick={() => {
            setSelectedFile(node.id)
            if (node.type === 'folder') {
              toggleFolder(node.id)
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
          className={cn(
            'flex items-center gap-2 px-2 py-1 cursor-pointer transition-colors',
            isSelected ? 'bg-surface-selected' : 'hover:bg-surface-2'
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          {/* Expand/collapse chevron */}
          <div className="w-3 flex-shrink-0">
            {node.type === 'folder' && node.children && node.children.length > 0 && (
              <ChevronRightSmall
                className={cn(
                  'w-3 h-3 text-foreground-dim transition-transform',
                  isExpanded && 'rotate-90'
                )}
              />
            )}
          </div>

          {/* Icon */}
          {getFileIcon(node)}

          {/* Name - with inline rename support */}
          {renamingId === node.id ? (
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFinishRename()
                } else if (e.key === 'Escape') {
                  handleCancelRename()
                }
                e.stopPropagation()
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-body-0-regular text-foreground bg-surface-high border border-border-subtle rounded px-1 py-0 outline-none focus:border-blue-500"
            />
          ) : (
            <span className="flex-1 text-body-0-regular text-foreground truncate">
              {node.name}
            </span>
          )}

          {/* Folder indicators */}
          <div className="w-12 flex justify-end">
            <FolderIndicators node={node} lockedFolderIds={lockedFolderIds} cloudSyncEnabled={cloudSyncEnabled} syncStatus={syncStatus} />
          </div>

          {/* Date modified */}
          <span className="w-24 text-right text-label-0-regular text-foreground-dim">
            {formatDate(node.modifiedAt)}
          </span>

          {/* Size */}
          <span className="w-16 text-right text-label-0-regular text-foreground-dim">
            {node.type === 'file' ? formatFileSize(node.size) : '—'}
          </span>
        </div>

        {/* Children - hidden if folder is locked */}
        {node.type === 'folder' && isExpanded && node.children && !lockedFolderIds.has(node.id) && (
          <>
            {node.children.map((child) => renderFileRow(child, depth + 1))}
          </>
        )}
      </div>
    )
  }

  // Icons view
  const renderIconsView = () => (
    <div className="grid grid-cols-4 gap-4 p-4">
      {currentFiles.map((node) => (
        <div
          key={node.id}
          onClick={() => setSelectedFile(node.id)}
          onDoubleClick={() => {
            if (node.type === 'folder') {
              navigateIntoFolder(node)
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
          className={cn(
            'flex flex-col items-center gap-2 p-3 rounded cursor-pointer transition-colors',
            selectedFile === node.id ? 'bg-surface-selected' : 'hover:bg-surface-2'
          )}
        >
          {getFileIcon(node, 'w-12 h-12')}
          {renamingId === node.id ? (
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFinishRename()
                } else if (e.key === 'Escape') {
                  handleCancelRename()
                }
                e.stopPropagation()
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-body-0-regular text-foreground text-center bg-surface-high border border-border-subtle rounded px-1 py-0 outline-none focus:border-blue-500 w-full"
            />
          ) : (
            <span className="text-body-0-regular text-foreground text-center truncate w-full">
              {node.name}
            </span>
          )}
        </div>
      ))}
    </div>
  )

  // Columns view
  const [columnPath, setColumnPath] = useState<FileNode[]>([])

  const renderColumnsView = () => {
    const columns: FileNode[][] = [currentFiles]

    // Build columns from selected path - skip locked folders
    for (const node of columnPath) {
      if (node.type === 'folder' && node.children && !lockedFolderIds.has(node.id)) {
        columns.push(node.children)
      }
    }

    return (
      <div className="flex h-full overflow-x-auto">
        {columns.map((columnFiles, colIndex) => (
          <div
            key={colIndex}
            className="min-w-[180px] max-w-[200px] border-r border-border-dim flex-shrink-0 overflow-y-auto"
          >
            {columnFiles.map((node) => {
              const isSelected = columnPath[colIndex]?.id === node.id
              return (
                <div
                  key={node.id}
                  onClick={() => {
                    setSelectedFile(node.id)
                    // Update column path - don't navigate into locked folders
                    const newPath = columnPath.slice(0, colIndex)
                    if (node.type === 'folder' && !lockedFolderIds.has(node.id)) {
                      newPath.push(node)
                    }
                    setColumnPath(newPath)
                  }}
                  onContextMenu={(e) => handleContextMenu(e, node)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors',
                    isSelected ? 'bg-surface-selected' : 'hover:bg-surface-2'
                  )}
                >
                  {getFileIcon(node)}
                  {renamingId === node.id ? (
                    <input
                      ref={renameInputRef}
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={handleFinishRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleFinishRename()
                        } else if (e.key === 'Escape') {
                          handleCancelRename()
                        }
                        e.stopPropagation()
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 text-body-0-regular text-foreground bg-surface-high border border-border-subtle rounded px-1 py-0 outline-none focus:border-blue-500"
                    />
                  ) : (
                    <span className="flex-1 text-body-0-regular text-foreground truncate">
                      {node.name}
                    </span>
                  )}
                  <FolderIndicators node={node} lockedFolderIds={lockedFolderIds} cloudSyncEnabled={cloudSyncEnabled} syncStatus={syncStatus} />
                  {node.type === 'folder' && node.children && node.children.length > 0 && (
                    <ChevronRightSmall className="w-3 h-3 text-foreground-dim" />
                  )}
                </div>
              )
            })}
          </div>
        ))}
        {/* Empty column for visual balance */}
        <div className="flex-1 min-w-[100px]" />
      </div>
    )
  }

  // List view
  const renderListView = () => (
    <>
      {/* Column headers */}
      <div className="flex items-center gap-2 px-2 py-1.5 bg-surface-2 border-b border-border-dim sticky top-0">
        <div className="w-3 flex-shrink-0" />
        <div className="w-4 flex-shrink-0" />
        <span className="flex-1 text-label-0-bold text-foreground-dim">Name</span>
        <span className="w-12 text-right text-label-0-bold text-foreground-dim">Status</span>
        <span className="w-24 text-right text-label-0-bold text-foreground-dim">Date Modified</span>
        <span className="w-16 text-right text-label-0-bold text-foreground-dim">Size</span>
      </div>

      {/* Files */}
      <div className="py-1">
        {currentFiles.map((node) => renderFileRow(node))}
      </div>
    </>
  )

  // Title bar content with navigation and view toggles
  const titleBarContent = (
    <>
      {/* Navigation buttons */}
      <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
        <button
          onClick={navigateBack}
          disabled={!canGoBack}
          className={cn(
            'p-1 rounded transition-colors',
            canGoBack
              ? 'text-foreground-dim hover:bg-surface-selected-subtle'
              : 'text-foreground-subtle cursor-not-allowed'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="p-1 rounded hover:bg-surface-selected-subtle text-foreground-dim">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Current folder name */}
      <span className="flex-1 text-body-0-bold text-foreground text-center">
        {getLocationName()}
      </span>

      {/* View mode buttons */}
      <div className="flex items-center gap-0.5 bg-surface-2 rounded p-0.5" onMouseDown={(e) => e.stopPropagation()}>
        <button
          onClick={() => setViewMode('icons')}
          className={cn(
            'p-1 rounded transition-colors',
            viewMode === 'icons' ? 'bg-surface-selected text-foreground' : 'text-foreground-dim hover:text-foreground'
          )}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={cn(
            'p-1 rounded transition-colors',
            viewMode === 'list' ? 'bg-surface-selected text-foreground' : 'text-foreground-dim hover:text-foreground'
          )}
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setViewMode('columns')}
          className={cn(
            'p-1 rounded transition-colors',
            viewMode === 'columns' ? 'bg-surface-selected text-foreground' : 'text-foreground-dim hover:text-foreground'
          )}
        >
          <Columns className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  )

  return (
    <DesktopWindow
      window={windowState}
      isActive={isActive}
      canClose={true}
      onFocus={onFocus}
      onMove={onMove}
      onResize={onResize}
      onMinimize={onMinimize}
      onMaximize={onMaximize}
      onClose={onClose}
      titleBarContent={titleBarContent}
      className="rounded-xl"
    >
      <div className="h-full flex flex-col bg-surface-low">
        {/* Main content area with sidebar */}
        <div className="flex-1 flex min-h-0">
          {/* Sidebar */}
          <div className="w-40 flex-shrink-0 bg-surface-1 border-r border-border-dim overflow-y-auto">
            {/* Favorites section */}
            <div className="py-2">
              <div className="px-3 py-1 text-label-0-bold text-foreground-dim uppercase tracking-wider">
                Favorites
              </div>
              {sidebarItems
                .filter((item) => item.type === 'favorite')
                .map((item) => {
                  const Icon = item.icon
                  const isSelected = selectedSidebar === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedSidebar(item.id)
                        setColumnPath([])
                        setFolderPathIds([])
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-1 text-left transition-colors',
                        isSelected ? 'bg-surface-selected text-foreground' : 'text-foreground-dim hover:bg-surface-2'
                      )}
                    >
                      <Icon className="w-4 h-4 text-blue-500" />
                      <span className="text-body-0-regular truncate">{item.name}</span>
                    </button>
                  )
                })}
            </div>

            {/* Locations section */}
            <div className="py-2">
              <div className="px-3 py-1 text-label-0-bold text-foreground-dim uppercase tracking-wider">
                Locations
              </div>
              {sidebarItems
                .filter((item) => item.type === 'location')
                .map((item) => {
                  const Icon = item.icon
                  const isSelected = selectedSidebar === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedSidebar(item.id)
                        setColumnPath([])
                        setFolderPathIds([])
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-1 text-left transition-colors',
                        isSelected ? 'bg-surface-selected text-foreground' : 'text-foreground-dim hover:bg-surface-2'
                      )}
                    >
                      <Icon className="w-4 h-4 text-foreground-dim" />
                      <span className="text-body-0-regular truncate">{item.name}</span>
                    </button>
                  )
                })}
            </div>
          </div>

          {/* File list */}
          <div className="flex-1 overflow-auto bg-surface-flat">
            {viewMode === 'list' && renderListView()}
            {viewMode === 'icons' && renderIconsView()}
            {viewMode === 'columns' && renderColumnsView()}
          </div>
        </div>

        {/* Status bar */}
        <div className="h-6 flex items-center justify-between px-3 bg-surface-mid border-t border-border-dim flex-shrink-0">
          <span className="text-label-0-regular text-foreground-dim">
            {currentFiles.length} items
          </span>
          <span className="text-label-0-regular text-foreground-dim">
            2.5 GB available
          </span>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[9999] min-w-[200px] py-1 rounded-lg border shadow-high backdrop-blur-2xl backdrop-saturate-150 bg-[rgba(30,30,30,0.65)] border-white/20"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Menu items */}
          <ContextMenuItem label="Open" shortcut="⌘O" onClick={() => setContextMenu(null)} />
          <ContextMenuItem label="Open With" hasSubmenu />
          <ContextMenuDivider />
          <ContextMenuItem label="Get Info" shortcut="⌘I" onClick={() => setContextMenu(null)} />
          <ContextMenuItem
            label="Rename"
            onClick={() => handleStartRename(contextMenu.item)}
          />
          <ContextMenuDivider />
          <ContextMenuItem label="Compress" onClick={() => setContextMenu(null)} />
          <ContextMenuItem label="Duplicate" shortcut="⌘D" onClick={() => setContextMenu(null)} />
          <ContextMenuItem label="Make Alias" shortcut="⌘L" onClick={() => setContextMenu(null)} />
          <ContextMenuItem label="Quick Look" shortcut="Space" onClick={() => setContextMenu(null)} />
          <ContextMenuDivider />
          <ContextMenuItem label="Copy" shortcut="⌘C" onClick={() => setContextMenu(null)} />
          <ContextMenuItem label="Share" hasSubmenu />
          <ContextMenuDivider />
          {contextMenu.item.type === 'folder' && (
            <>
              <ContextMenuItem
                label="New Folder"
                shortcut="⇧⌘N"
                onClick={() => handleCreateFolder(contextMenu.item.id)}
              />
              <ContextMenuDivider />
            </>
          )}
          <ContextMenuItem
            label="Move to Trash"
            shortcut="⌘⌫"
            onClick={() => handleDeleteItem(contextMenu.item.id)}
          />
        </div>
      )}
    </DesktopWindow>
  )
}

// Context menu item component
function ContextMenuItem({
  label,
  shortcut,
  hasSubmenu,
  disabled,
  onClick,
}: {
  label: string
  shortcut?: string
  hasSubmenu?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-3 py-1 text-left transition-colors rounded-sm mx-1',
        disabled
          ? 'text-black/30 dark:text-white/30 cursor-not-allowed'
          : 'text-gray-900 dark:text-white hover:bg-blue-500 hover:text-white'
      )}
      style={{ width: 'calc(100% - 8px)' }}
    >
      <span className="text-body-0-regular">{label}</span>
      {shortcut && (
        <span className="text-label-0-regular text-black/40 dark:text-white/50 ml-4">{shortcut}</span>
      )}
      {hasSubmenu && (
        <ChevronRightSmall className="w-3 h-3 text-black/40 dark:text-white/50" />
      )}
    </button>
  )
}

// Context menu divider
function ContextMenuDivider() {
  return <div className="my-1 border-t border-black/10 dark:border-white/10 mx-2" />
}
