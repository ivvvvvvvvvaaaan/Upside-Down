import type { DepartmentId } from '@/components/department/types'

/** Base file node shared by both Finder and Workspace views */
export interface UnifiedFileNode {
  id: string
  name: string
  type: 'folder' | 'file'
  extension?: string
  size?: number
  modifiedAt?: string
  modifiedBy?: string
  children?: UnifiedFileNode[]
}

export interface WorkspaceFileNode extends UnifiedFileNode {
  children?: WorkspaceFileNode[]
  /** Provenance: which department tree this node belongs to */
  departmentId?: DepartmentId
  /** Folder-level: zone designation (default: wip) */
  zone?: 'managed' | 'wip'
  /** Computed: true if this node is inside a managed zone */
  managedZone?: boolean
}

// Art Department workspace files
const artDepartmentFiles: WorkspaceFileNode[] = [
  // Loose files at top level — messy WIP workspace
  { id: 'ws-art-loose-1', name: 'notes_from_scott.txt', type: 'file', extension: 'txt', size: 2048, modifiedAt: '2026-02-15' },
  { id: 'ws-art-loose-2', name: 'feedback_round2_FINAL.psd', type: 'file', extension: 'psd', size: 28311552, modifiedAt: '2026-02-14' },
  { id: 'ws-art-loose-3', name: 'Screenshot 2026-02-13.png', type: 'file', extension: 'png', size: 1048576, modifiedAt: '2026-02-13' },
  { id: 'ws-art-loose-4', name: 'mood_board_draft.jpg', type: 'file', extension: 'jpg', size: 5242880, modifiedAt: '2026-02-12' },
  {
    id: 'ws-art-concept',
    name: 'Concept Art',
    type: 'folder',
    modifiedAt: '2026-02-13',
    zone: 'managed',
    children: [
      { id: 'ws-art-concept-1', name: 'hero_pose_v3.psd', type: 'file', extension: 'psd', size: 45678592, modifiedAt: '2026-02-13', modifiedBy: 'psharma@netflix.com' },
      { id: 'ws-art-concept-2', name: 'villain_design_final.psd', type: 'file', extension: 'psd', size: 38912000, modifiedAt: '2026-02-12', modifiedBy: 'psharma@netflix.com' },
      { id: 'ws-art-concept-demogorgon', name: 'concept_art_ar24_livery.jpg', type: 'file', extension: 'jpg', size: 8388608, modifiedAt: '2026-02-11', modifiedBy: 'psharma@netflix.com' },
      { id: 'ws-art-concept-ud-env', name: 'pit_lane_environment_concept.jpg', type: 'file', extension: 'jpg', size: 12582912, modifiedAt: '2026-02-10', modifiedBy: 'psharma@netflix.com' },
      { id: 'ws-art-concept-creature', name: 'ar24_car_design.jpg', type: 'file', extension: 'jpg', size: 9437184, modifiedAt: '2026-02-09', modifiedBy: 'psharma@netflix.com' },
      { id: 'ws-art-concept-lab', name: 'apex_garage_interior_concept.jpg', type: 'file', extension: 'jpg', size: 7340032, modifiedAt: '2026-02-08', modifiedBy: 'psharma@netflix.com' },
    ],
  },
  { id: 'ws-art-loose-5', name: 'color_test_001.png', type: 'file', extension: 'png', size: 3145728, modifiedAt: '2026-02-11' },
  {
    id: 'ws-art-storyboards',
    name: 'Storyboards',
    type: 'folder',
    modifiedAt: '2026-02-12',
    children: [
      { id: 'ws-art-sb-1', name: 'Act1_Seq01_boards.pdf', type: 'file', extension: 'pdf', size: 12582912, modifiedAt: '2026-02-12' },
      { id: 'ws-art-sb-2', name: 'Act1_Seq02_boards.pdf', type: 'file', extension: 'pdf', size: 15728640, modifiedAt: '2026-02-11' },
      { id: 'ws-art-sb-3', name: 'Act2_Seq01_boards.pdf', type: 'file', extension: 'pdf', size: 18874368, modifiedAt: '2026-02-10' },
      { id: 'ws-art-sb-animatic', name: 'season_6_animatic_v2.mov', type: 'file', extension: 'mov', size: 524288000, modifiedAt: '2026-02-09' },
      { id: 'ws-art-sb-seq12', name: 'storyboard_sequence_12.pdf', type: 'file', extension: 'pdf', size: 15728640, modifiedAt: '2026-02-08' },
      { id: 'ws-art-sb-ep01', name: 'episode_01_storyboard_sequence.pdf', type: 'file', extension: 'pdf', size: 12582912, modifiedAt: '2026-02-07' },
      { id: 'ws-art-sb-chase', name: 'chase_scene_boards.pdf', type: 'file', extension: 'pdf', size: 10485760, modifiedAt: '2026-02-06' },
    ],
  },
  {
    id: 'ws-art-characters',
    name: 'Character Designs',
    type: 'folder',
    modifiedAt: '2026-02-11',
    zone: 'managed',
    children: [
      { id: 'ws-art-char-1', name: 'protagonist_turnaround.png', type: 'file', extension: 'png', size: 8388608, modifiedAt: '2026-02-11', modifiedBy: 'psharma@netflix.com' },
      { id: 'ws-art-char-2', name: 'supporting_cast_lineup.png', type: 'file', extension: 'png', size: 12582912, modifiedAt: '2026-02-10', modifiedBy: 'psharma@netflix.com' },
      { id: 'ws-art-char-billy', name: 'race_suit_designs_ferreira.png', type: 'file', extension: 'png', size: 6291456, modifiedAt: '2026-02-09', modifiedBy: 'psharma@netflix.com' },
      { id: 'ws-art-char-hopper', name: 'dragan_team_wear_design.png', type: 'file', extension: 'png', size: 5242880, modifiedAt: '2026-02-08' },
      { id: 'ws-art-char-eleven', name: 'vitale_race_suit_design.png', type: 'file', extension: 'png', size: 4194304, modifiedAt: '2026-02-07' },
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
      { id: 'ws-art-env-byers', name: 'fia_stewards_office_floor_plan.pdf', type: 'file', extension: 'pdf', size: 8388608, modifiedAt: '2026-02-08' },
      { id: 'ws-art-env-starcourt', name: 'paddock_club_blueprints.pdf', type: 'file', extension: 'pdf', size: 10485760, modifiedAt: '2026-02-07' },
    ],
  },
  { id: 'ws-art-loose-6', name: 'TODO_cleanup_assets.md', type: 'file', extension: 'md', size: 512, modifiedAt: '2026-02-09' },
  {
    id: 'ws-art-props',
    name: 'Props',
    type: 'folder',
    modifiedAt: '2026-02-09',
    children: [
      { id: 'ws-art-props-1', name: 'hero_weapon_designs.ai', type: 'file', extension: 'ai', size: 15728640, modifiedAt: '2026-02-09' },
      { id: 'ws-art-props-2', name: 'vehicle_concepts.ai', type: 'file', extension: 'ai', size: 20971520, modifiedAt: '2026-02-08' },
      { id: 'ws-art-props-walkie', name: 'team_radio_prop_design.png', type: 'file', extension: 'png', size: 4194304, modifiedAt: '2026-02-07' },
      { id: 'ws-art-props-lights', name: 'pit_board_props.png', type: 'file', extension: 'png', size: 3145728, modifiedAt: '2026-02-06' },
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
      { id: 'ws-art-ref-80s', name: '2024_race_weekend_reference_photos.zip', type: 'file', extension: 'zip', size: 104857600, modifiedAt: '2026-02-05' },
      { id: 'ws-art-ref-arcade', name: 'circuit_reference_collection.zip', type: 'file', extension: 'zip', size: 78643200, modifiedAt: '2026-02-04' },
    ],
  },
  { id: 'ws-art-loose-7', name: 'Untitled-2.psd', type: 'file', extension: 'psd', size: 10485760, modifiedAt: '2026-02-06' },
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
          { id: 'ws-vfx-010-010', name: 'SEQ010_SH010_comp_v12.exr', type: 'file', extension: 'exr', size: 157286400, modifiedAt: '2026-02-14', modifiedBy: 'schen@netflix.com' },
          { id: 'ws-vfx-010-020', name: 'SEQ010_SH020_comp_v08.exr', type: 'file', extension: 'exr', size: 134217728, modifiedAt: '2026-02-13', modifiedBy: 'mtorres@netflix.com' },
          { id: 'ws-vfx-010-030', name: 'SEQ010_SH030_comp_v05.exr', type: 'file', extension: 'exr', size: 125829120, modifiedAt: '2026-02-12', modifiedBy: 'schen@netflix.com' },
        ],
      },
      {
        id: 'ws-vfx-shots-seq20',
        name: 'SEQ020',
        type: 'folder',
        modifiedAt: '2026-02-13',
        children: [
          { id: 'ws-vfx-020-010', name: 'SEQ020_SH010_comp_v03.exr', type: 'file', extension: 'exr', size: 146800640, modifiedAt: '2026-02-13', modifiedBy: 'mtorres@netflix.com' },
          { id: 'ws-vfx-020-020', name: 'SEQ020_SH020_comp_v01.exr', type: 'file', extension: 'exr', size: 115343360, modifiedAt: '2026-02-12', modifiedBy: 'schen@netflix.com' },
        ],
      },
      {
        id: 'ws-vfx-shots-comps',
        name: 'Comps',
        type: 'folder',
        modifiedAt: '2026-02-11',
        children: [
          { id: 'ws-vfx-comp-eleven', name: 'vitale_halo_gfx_comp_v4.nk', type: 'file', extension: 'nk', size: 52428800, modifiedAt: '2026-02-11', modifiedBy: 'mtorres@netflix.com' },
          { id: 'ws-vfx-comp-lab', name: 'apex_garage_pitstop_comp.nk', type: 'file', extension: 'nk', size: 67108864, modifiedAt: '2026-02-10', modifiedBy: 'schen@netflix.com' },
          { id: 'ws-vfx-comp-nosebleed', name: 'vitale_helmet_cam_effect.nk', type: 'file', extension: 'nk', size: 31457280, modifiedAt: '2026-02-09', modifiedBy: 'mtorres@netflix.com' },
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
          { id: 'ws-vfx-3d-demogorgon', name: 'ar24_car_rig_v3.mb', type: 'file', extension: 'mb', size: 157286400, modifiedAt: '2026-02-10' },
          { id: 'ws-vfx-3d-demo-tex', name: 'ar24_livery_texture_maps.zip', type: 'file', extension: 'zip', size: 104857600, modifiedAt: '2026-02-09' },
          { id: 'ws-vfx-3d-mindflayer', name: 'rm15_car_model_v5.mb', type: 'file', extension: 'mb', size: 209715200, modifiedAt: '2026-02-08' },
          { id: 'ws-vfx-3d-demodogs', name: 'grid_lineup_rig.mb', type: 'file', extension: 'mb', size: 125829120, modifiedAt: '2026-02-07' },
          { id: 'ws-vfx-3d-starcourt', name: 'paddock_crash_impact.mb', type: 'file', extension: 'mb', size: 178257920, modifiedAt: '2026-02-06' },
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
      {
        id: 'ws-vfx-assets-matte',
        name: 'Matte Paintings',
        type: 'folder',
        modifiedAt: '2026-02-08',
        children: [
          { id: 'ws-vfx-matte-ud', name: 'pit_lane_night_matte_v3.psd', type: 'file', extension: 'psd', size: 157286400, modifiedAt: '2026-02-08' },
          { id: 'ws-vfx-matte-skyline', name: 'circuit_skyline_matte.psd', type: 'file', extension: 'psd', size: 125829120, modifiedAt: '2026-02-07' },
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
      { id: 'ws-vfx-elem-fog', name: 'pit_lane_heat_haze_sim.hip', type: 'file', extension: 'hip', size: 209715200, modifiedAt: '2026-02-06' },
      { id: 'ws-vfx-elem-portal', name: 'tire_smoke_particles_v2.hip', type: 'file', extension: 'hip', size: 104857600, modifiedAt: '2026-02-05' },
      { id: 'ws-vfx-elem-preview', name: 'vfx_preview_pit_lane.mov', type: 'file', extension: 'mov', size: 314572800, modifiedAt: '2026-02-04' },
      { id: 'ws-vfx-elem-notes', name: 'virtual_art_department_notes.csv', type: 'file', extension: 'csv', size: 1048576, modifiedAt: '2026-02-03' },
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
      { id: 'ws-vfx-ref-brief', name: 'Framestore_Brief_EP301.pdf', type: 'file', extension: 'pdf', size: 4194304, modifiedAt: '2026-02-10' },
    ],
  },
  {
    id: 'ws-vfx-vendor-drops',
    name: 'Vendor Deliveries',
    type: 'folder',
    modifiedAt: '2026-02-13',
    children: [
      {
        id: 'ws-vfx-vendor-framestore',
        name: 'Framestore',
        type: 'folder',
        modifiedAt: '2026-02-13',
        children: [
          { id: 'ws-vfx-fs-del-1', name: 'SEQ010_SH010_comp_v14_FS.exr', type: 'file', extension: 'exr', size: 167772160, modifiedAt: '2026-02-13' },
          { id: 'ws-vfx-fs-del-2', name: 'SEQ010_SH020_comp_v10_FS.exr', type: 'file', extension: 'exr', size: 146800640, modifiedAt: '2026-02-12' },
          { id: 'ws-vfx-fs-del-3', name: 'SEQ020_SH010_comp_v05_FS.exr', type: 'file', extension: 'exr', size: 157286400, modifiedAt: '2026-02-11' },
          { id: 'ws-vfx-fs-notes', name: 'delivery_notes_20260213.pdf', type: 'file', extension: 'pdf', size: 2097152, modifiedAt: '2026-02-13' },
        ],
      },
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
      {
        id: 'ws-cam-dailies-scenes',
        name: '2026-02-12',
        type: 'folder',
        modifiedAt: '2026-02-12',
        children: [
          { id: 'ws-cam-scene12-take3', name: 'ep01_scene12_take3.mov', type: 'file', extension: 'mov', size: 2147483648, modifiedAt: '2026-02-12' },
          { id: 'ws-cam-scene08-take1', name: 'ep01_scene08_take1.mov', type: 'file', extension: 'mov', size: 1879048192, modifiedAt: '2026-02-12' },
          { id: 'ws-cam-scene15-take1', name: 'ep01_scene15_take1.mov', type: 'file', extension: 'mov', size: 2415919104, modifiedAt: '2026-02-12' },
          { id: 'ws-cam-broll-town', name: 'circuit_paddock_broll.mov', type: 'file', extension: 'mov', size: 943718400, modifiedAt: '2026-02-11' },
          { id: 'ws-cam-broll-forest', name: 'forest_atmosphere_broll.mov', type: 'file', extension: 'mov', size: 838860800, modifiedAt: '2026-02-11' },
          { id: 'ws-cam-aerial-dawn', name: 'circuit_aerial_dawn.mov', type: 'file', extension: 'mov', size: 1073741824, modifiedAt: '2026-02-10' },
          { id: 'ws-cam-aerial-quarry', name: 'quarry_aerial_orbit.mov', type: 'file', extension: 'mov', size: 1073741824, modifiedAt: '2026-02-10' },
          { id: 'ws-cam-steadicam-chase', name: 'chase_scene_steadicam_take2.mov', type: 'file', extension: 'mov', size: 1610612736, modifiedAt: '2026-02-09' },
          { id: 'ws-cam-tracking-hall', name: 'hallway_tracking_shot.mov', type: 'file', extension: 'mov', size: 1342177280, modifiedAt: '2026-02-09' },
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
      { id: 'ws-cam-sel-billy', name: 'ferreira_closeup_celebration.mov', type: 'file', extension: 'mov', size: 943718400, modifiedAt: '2026-02-11' },
      { id: 'ws-cam-sel-eleven', name: 'vitale_victory_lap.mov', type: 'file', extension: 'mov', size: 1073741824, modifiedAt: '2026-02-10' },
      { id: 'ws-cam-sel-portal', name: 'pit_lane_lights_out.mov', type: 'file', extension: 'mov', size: 1342177280, modifiedAt: '2026-02-09' },
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
      { id: 'ws-cam-rpt-shotlist', name: 'shot_list_master.xlsx', type: 'file', extension: 'xlsx', size: 1048576, modifiedAt: '2026-02-12' },
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
      { id: 'ws-cam-lens-arri', name: 'arri_alexa_mini_test.mov', type: 'file', extension: 'mov', size: 524288000, modifiedAt: '2026-02-06' },
      { id: 'ws-cam-lens-cooke', name: 'cooke_anamorphic_35mm_test.mov', type: 'file', extension: 'mov', size: 419430400, modifiedAt: '2026-02-05' },
      { id: 'ws-cam-lens-zeiss', name: 'zeiss_master_prime_50mm_test.mov', type: 'file', extension: 'mov', size: 367001600, modifiedAt: '2026-02-04' },
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
      { id: 'ws-edit-cut-1', name: 'EP301_timeline_v4.prproj', type: 'file', extension: 'prproj', size: 52428800, modifiedAt: '2026-02-14', modifiedBy: 'msantos@netflix.com' },
      { id: 'ws-edit-cut-2', name: 'EP301_timeline_v2.prproj', type: 'file', extension: 'prproj', size: 41943040, modifiedAt: '2026-02-12', modifiedBy: 'msantos@netflix.com' },
      { id: 'ws-edit-cut-3', name: 'EP302_timeline_v1.prproj', type: 'file', extension: 'prproj', size: 36700160, modifiedAt: '2026-02-10', modifiedBy: 'lkim@netflix.com' },
      { id: 'ws-edit-cut-locked', name: 'EP107_timeline_locked.mov', type: 'file', extension: 'mov', size: 8589934592, modifiedAt: '2026-02-09', modifiedBy: 'msantos@netflix.com' },
      { id: 'ws-edit-cut-rough1', name: 'EP101_timeline_v3.mov', type: 'file', extension: 'mov', size: 6442450944, modifiedAt: '2026-02-08', modifiedBy: 'msantos@netflix.com' },
      { id: 'ws-edit-cut-rough2', name: 'EP102_timeline_v1.mov', type: 'file', extension: 'mov', size: 7516192768, modifiedAt: '2026-02-07' },
      { id: 'ws-edit-cut-assembly', name: 'EP101_timeline_v1.mov', type: 'file', extension: 'mov', size: 9663676416, modifiedAt: '2026-02-06' },
      { id: 'ws-edit-cut-fine', name: 'EP101_timeline_v2_fine.mov', type: 'file', extension: 'mov', size: 7516192768, modifiedAt: '2026-02-05' },
    ],
  },
  {
    id: 'ws-edit-exports',
    name: 'Exports',
    type: 'folder',
    modifiedAt: '2026-02-13',
    children: [
      { id: 'ws-edit-exp-1', name: 'EP301_v4_ProRes.mov', type: 'file', extension: 'mov', size: 8589934592, modifiedAt: '2026-02-13', modifiedBy: 'lkim@netflix.com' },
      { id: 'ws-edit-exp-2', name: 'EP301_v4_H264_review.mp4', type: 'file', extension: 'mp4', size: 524288000, modifiedAt: '2026-02-13', modifiedBy: 'msantos@netflix.com' },
      { id: 'ws-edit-exp-color1', name: 'ep01_color_pass_v1.mov', type: 'file', extension: 'mov', size: 8589934592, modifiedAt: '2026-02-12' },
      { id: 'ws-edit-exp-color2', name: 'ep01_color_pass_v2.mov', type: 'file', extension: 'mov', size: 8589934592, modifiedAt: '2026-02-11' },
      { id: 'ws-edit-exp-vfx1', name: 'ep01_vfx_temp_v3.mov', type: 'file', extension: 'mov', size: 7516192768, modifiedAt: '2026-02-10' },
      { id: 'ws-edit-exp-vfx2', name: 'ep02_vfx_temp_v1.mov', type: 'file', extension: 'mov', size: 7516192768, modifiedAt: '2026-02-09' },
      { id: 'ws-edit-exp-final', name: 'ep01_final_master.mov', type: 'file', extension: 'mov', size: 10737418240, modifiedAt: '2026-02-08' },
      { id: 'ws-edit-exp-textless', name: 'ep01_textless_master.mov', type: 'file', extension: 'mov', size: 10737418240, modifiedAt: '2026-02-07' },
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
      { id: 'ws-edit-script-ep07', name: 'script_episode_07_final.pdf', type: 'file', extension: 'pdf', size: 2097152, modifiedAt: '2026-02-08' },
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
      { id: 'ws-audio-prod-scene12', name: 'ep01_scene12_production_mix.wav', type: 'file', extension: 'wav', size: 104857600, modifiedAt: '2026-02-13' },
      { id: 'ws-audio-prod-scene08', name: 'ep01_scene08_production_mix.wav', type: 'file', extension: 'wav', size: 94371840, modifiedAt: '2026-02-12' },
    ],
  },
  {
    id: 'ws-audio-sfx',
    name: 'Sound Effects',
    type: 'folder',
    modifiedAt: '2026-02-12',
    zone: 'managed',
    children: [
      { id: 'ws-audio-sfx-1', name: 'pit_lane_ambience_v3.wav', type: 'file', extension: 'wav', size: 104857600, modifiedAt: '2026-02-12' },
      { id: 'ws-audio-sfx-2', name: 'engine_rev_collection.wav', type: 'file', extension: 'wav', size: 78643200, modifiedAt: '2026-02-11' },
      { id: 'ws-audio-sfx-3', name: 'flyby_whoosh_layers.wav', type: 'file', extension: 'wav', size: 52428800, modifiedAt: '2026-02-10' },
      { id: 'ws-audio-sfx-growl', name: 'engine_rev_sfx.wav', type: 'file', extension: 'wav', size: 15728640, modifiedAt: '2026-02-09' },
      { id: 'ws-audio-sfx-portal', name: 'lights_out_sfx.wav', type: 'file', extension: 'wav', size: 20971520, modifiedAt: '2026-02-08' },
      { id: 'ws-audio-sfx-powers', name: 'vitale_radio_sfx.wav', type: 'file', extension: 'wav', size: 10485760, modifiedAt: '2026-02-07' },
      { id: 'ws-audio-sfx-ambience', name: 'pit_lane_ambience.wav', type: 'file', extension: 'wav', size: 157286400, modifiedAt: '2026-02-06' },
      { id: 'ws-audio-sfx-atmos', name: 'circuit_night_atmos.wav', type: 'file', extension: 'wav', size: 209715200, modifiedAt: '2026-02-05' },
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
      { id: 'ws-audio-music-3', name: 'race_weekend_music_options.zip', type: 'file', extension: 'zip', size: 314572800, modifiedAt: '2026-02-09' },
      { id: 'ws-audio-music-theme', name: 'main_theme_score_v2.wav', type: 'file', extension: 'wav', size: 62914560, modifiedAt: '2026-02-08' },
      { id: 'ws-audio-music-chase', name: 'chase_scene_cue.wav', type: 'file', extension: 'wav', size: 41943040, modifiedAt: '2026-02-07' },
    ],
  },
  {
    id: 'ws-audio-foley',
    name: 'Foley',
    type: 'folder',
    modifiedAt: '2026-02-06',
    children: [
      { id: 'ws-audio-foley-steps', name: 'footsteps_wood_floor_foley.wav', type: 'file', extension: 'wav', size: 31457280, modifiedAt: '2026-02-06' },
      { id: 'ws-audio-foley-bike', name: 'bike_chain_foley.wav', type: 'file', extension: 'wav', size: 15728640, modifiedAt: '2026-02-05' },
    ],
  },
  {
    id: 'ws-audio-adr',
    name: 'ADR',
    type: 'folder',
    modifiedAt: '2026-02-04',
    children: [
      { id: 'ws-audio-adr-eleven', name: 'vitale_adr_session_01.wav', type: 'file', extension: 'wav', size: 209715200, modifiedAt: '2026-02-04' },
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

/** Find a node by ID in a tree of WorkspaceFileNodes */
export function findNodeInTree(nodes: WorkspaceFileNode[], id: string): WorkspaceFileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeInTree(node.children, id)
      if (found) return found
    }
  }
  return null
}

/** Map department IDs used in workspace-data to the wrapper folder IDs used in the Finder tree */
export const DEPARTMENT_FOLDER_MAP: Record<DepartmentId, { id: string; name: string }> = {
  'art-design': { id: 'ws-art', name: 'Art Department' },
  'vfx': { id: 'ws-vfx', name: 'VFX' },
  'camera': { id: 'ws-camera', name: 'Camera' },
  'editorial': { id: 'ws-editorial', name: 'Editorial' },
  'audio-sound': { id: 'ws-audio', name: 'Audio & Sound' },
}

/**
 * Build the full Finder workspace tree:
 *   Single project root > [department folders wrapping departmentFileMap arrays]
 */
export function getFinderWorkspaceTree(): UnifiedFileNode[] {
  const departmentFolders: UnifiedFileNode[] = (Object.keys(departmentFileMap) as DepartmentId[]).map((deptId) => {
    const meta = DEPARTMENT_FOLDER_MAP[deptId]
    return {
      id: meta.id,
      name: meta.name,
      type: 'folder' as const,
      modifiedAt: '2026-02-14',
      children: departmentFileMap[deptId] as UnifiedFileNode[],
    }
  })

  return departmentFolders
}
