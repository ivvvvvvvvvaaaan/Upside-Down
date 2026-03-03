import type { DepartmentId } from '@/components/department/types'

export interface WorkspaceFileNode {
  id: string
  name: string
  type: 'folder' | 'file'
  extension?: string
  size?: number
  modifiedAt?: string
  children?: WorkspaceFileNode[]
  /** Folder-level: zone designation (default: wip) */
  zone?: 'managed' | 'wip'
  /** Computed: true if this node is inside a managed zone */
  managedZone?: boolean
}

// Art Department workspace files
const artDepartmentFiles: WorkspaceFileNode[] = [
  {
    id: 'ws-art-concept',
    name: 'Concept Art',
    type: 'folder',
    modifiedAt: '2026-02-13',
    zone: 'managed',
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
    zone: 'managed',
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
]

// VFX workspace files
const vfxFiles: WorkspaceFileNode[] = [
  {
    id: 'ws-vfx-shots',
    name: 'Shots',
    type: 'folder',
    modifiedAt: '2026-02-14',
    zone: 'managed',
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
]

// Camera workspace files
const cameraFiles: WorkspaceFileNode[] = [
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
    zone: 'managed',
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
]

// Editorial workspace files
const editorialFiles: WorkspaceFileNode[] = [
  {
    id: 'ws-edit-cuts',
    name: 'Cuts',
    type: 'folder',
    modifiedAt: '2026-02-14',
    zone: 'managed',
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
]

// Audio & Sound workspace files
const audioFiles: WorkspaceFileNode[] = [
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
    zone: 'managed',
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
]

const departmentFileMap: Record<DepartmentId, WorkspaceFileNode[]> = {
  'art-design': artDepartmentFiles,
  'vfx': vfxFiles,
  'camera': cameraFiles,
  'editorial': editorialFiles,
  'audio-sound': audioFiles,
}

export function getDepartmentWorkspaceFiles(departmentId: DepartmentId): WorkspaceFileNode[] {
  return departmentFileMap[departmentId] ?? []
}
