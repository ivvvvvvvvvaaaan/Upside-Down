import { describe, it, expect, vi } from 'vitest'
import type { WorkspaceFileNode } from '@/lib/workspace-data'
import { generateAssetInstances, promotedInstanceToAsset } from '@/lib/asset-instances'
import type { AssetInstance } from '@/lib/asset-instances'

// Mock ai-tags so tests don't depend on the hardcoded MOCK_AI_TAGS data
vi.mock('@/lib/ai-tags', () => ({
  getAITagsForFile: vi.fn((id: string) => {
    if (id === 'file-with-tags') {
      return {
        sourceFileId: 'file-with-tags',
        characters: ['Eleven'],
        scene: 'INT. LAB',
        location: 'Hawkins Lab',
        typeTag: 'Concept Art',
        confidence: 0.9,
        keywords: ['hero', 'powers'],
        analyzedAt: '2026-01-01T00:00:00Z',
        status: 'complete' as const,
      }
    }
    return undefined
  }),
  toAIMeta: vi.fn((tags: { characters: string[]; scene?: string; location?: string; confidence: number; keywords: string[] }) => ({
    characters: tags.characters.length > 0 ? tags.characters : undefined,
    scene: tags.scene,
    location: tags.location,
    confidence: tags.confidence,
    keywords: tags.keywords,
  })),
}))

describe('generateAssetInstances', () => {
  it('maps a flat list of files to instances', () => {
    const files: WorkspaceFileNode[] = [
      { id: 'f1', name: 'hero.psd', type: 'file', extension: 'psd', size: 1000 },
      { id: 'f2', name: 'clip.mov', type: 'file', extension: 'mov', size: 2000 },
    ]

    const instances = generateAssetInstances(files, 'art-design')

    expect(instances).toHaveLength(2)
    expect(instances[0]).toMatchObject({
      id: 'inst-f1',
      name: 'hero',
      sourceFileId: 'f1',
      sourceFileName: 'hero.psd',
      sourcePath: 'hero.psd',
      department: 'art-design',
      category: '',
      type: 'image',
      size: 1000,
    })
    expect(instances[1]).toMatchObject({
      id: 'inst-f2',
      name: 'clip',
      type: 'video',
    })
  })

  it('maps extensions to correct asset types', () => {
    const exts: [string, string][] = [
      ['png', 'image'],
      ['jpg', 'image'],
      ['mp4', 'video'],
      ['wav', 'audio'],
      ['pdf', 'text'],
      ['md', 'text'],
    ]

    for (const [ext, expectedType] of exts) {
      const files: WorkspaceFileNode[] = [
        { id: `f-${ext}`, name: `file.${ext}`, type: 'file', extension: ext },
      ]
      const instances = generateAssetInstances(files, 'vfx')
      expect(instances[0].type).toBe(expectedType)
    }
  })

  it('defaults unknown extensions to text', () => {
    const files: WorkspaceFileNode[] = [
      { id: 'f1', name: 'data.xyz', type: 'file', extension: 'xyz' },
    ]
    const instances = generateAssetInstances(files, 'vfx')
    expect(instances[0].type).toBe('text')
  })

  it('walks nested folders, setting category to folder name', () => {
    const files: WorkspaceFileNode[] = [
      {
        id: 'folder1',
        name: 'Concepts',
        type: 'folder',
        children: [
          { id: 'f1', name: 'hero.psd', type: 'file', extension: 'psd' },
          {
            id: 'subfolder',
            name: 'Variants',
            type: 'folder',
            children: [
              { id: 'f2', name: 'alt.png', type: 'file', extension: 'png' },
            ],
          },
        ],
      },
    ]

    const instances = generateAssetInstances(files, 'art-design')

    expect(instances).toHaveLength(2)

    // Direct child of Concepts
    expect(instances[0].category).toBe('Concepts')
    expect(instances[0].sourcePath).toBe('Concepts / hero.psd')

    // Nested under Variants — category is the immediate parent folder
    expect(instances[1].category).toBe('Variants')
    expect(instances[1].sourcePath).toBe('Concepts / Variants / alt.png')
  })

  it('sets department from argument', () => {
    const files: WorkspaceFileNode[] = [
      { id: 'f1', name: 'a.wav', type: 'file', extension: 'wav' },
    ]
    const instances = generateAssetInstances(files, 'audio-sound')
    expect(instances[0].department).toBe('audio-sound')
  })

  it('returns empty array for no files', () => {
    expect(generateAssetInstances([], 'vfx')).toEqual([])
  })
})

describe('promotedInstanceToAsset', () => {
  const base: AssetInstance = {
    id: 'inst-1',
    name: 'Hero Concept',
    sourceFileId: 'file-with-tags',
    sourceFileName: 'hero.psd',
    sourcePath: 'Concepts / hero.psd',
    department: 'art-design',
    category: 'Concepts',
    type: 'image',
  }

  it('sets isAutoPromoted and workspacePath', () => {
    const asset = promotedInstanceToAsset(base)
    expect(asset.isAutoPromoted).toBe(true)
    expect(asset.workspacePath).toBe('Concepts / hero.psd')
  })

  it('maps typeTag to imageMeta for image type', () => {
    const instance: AssetInstance = {
      ...base,
      type: 'image',
      aiTags: {
        sourceFileId: 'file-with-tags',
        characters: ['Eleven'],
        typeTag: 'Concept Art',
        confidence: 0.9,
        keywords: ['hero'],
        analyzedAt: '2026-01-01T00:00:00Z',
        status: 'complete',
      },
    }
    const asset = promotedInstanceToAsset(instance)
    expect(asset.imageMeta).toEqual({ typeTag: 'Concept Art' })
  })

  it('maps typeTag to videoMeta for video type', () => {
    const instance: AssetInstance = {
      ...base,
      type: 'video',
      aiTags: {
        sourceFileId: 'f1',
        characters: [],
        typeTag: 'Animatic',
        confidence: 0.8,
        keywords: [],
        analyzedAt: '2026-01-01T00:00:00Z',
        status: 'complete',
      },
    }
    const asset = promotedInstanceToAsset(instance)
    expect(asset.videoMeta).toEqual({ typeTag: 'Animatic' })
  })

  it('maps typeTag to audioMeta for audio type', () => {
    const instance: AssetInstance = {
      ...base,
      type: 'audio',
      aiTags: {
        sourceFileId: 'f1',
        characters: [],
        typeTag: 'SFX',
        confidence: 0.8,
        keywords: [],
        analyzedAt: '2026-01-01T00:00:00Z',
        status: 'complete',
      },
    }
    const asset = promotedInstanceToAsset(instance)
    expect(asset.audioMeta).toEqual({ typeTag: 'SFX' })
  })

  it('maps typeTag to textMeta for text type', () => {
    const instance: AssetInstance = {
      ...base,
      type: 'text',
      aiTags: {
        sourceFileId: 'f1',
        characters: [],
        typeTag: 'Script',
        confidence: 0.8,
        keywords: [],
        analyzedAt: '2026-01-01T00:00:00Z',
        status: 'complete',
      },
    }
    const asset = promotedInstanceToAsset(instance)
    expect(asset.textMeta).toEqual({ typeTag: 'Script' })
  })

  it('falls back to category as typeTag when aiTags has no typeTag', () => {
    const instance: AssetInstance = { ...base, type: 'image', aiTags: undefined }
    const asset = promotedInstanceToAsset(instance)
    expect(asset.imageMeta).toEqual({ typeTag: 'Concepts' })
  })

  it('populates aiMeta from aiTags via toAIMeta', () => {
    const instance: AssetInstance = {
      ...base,
      aiTags: {
        sourceFileId: 'file-with-tags',
        characters: ['Eleven'],
        scene: 'INT. LAB',
        location: 'Hawkins Lab',
        typeTag: 'Concept Art',
        confidence: 0.9,
        keywords: ['hero', 'powers'],
        analyzedAt: '2026-01-01T00:00:00Z',
        status: 'complete',
      },
    }

    const asset = promotedInstanceToAsset(instance)

    expect(asset.aiMeta).toEqual({
      characters: ['Eleven'],
      scene: 'INT. LAB',
      location: 'Hawkins Lab',
      confidence: 0.9,
      keywords: ['hero', 'powers'],
    })
  })

  it('omits aiMeta when no aiTags', () => {
    const instance: AssetInstance = { ...base, aiTags: undefined }
    const asset = promotedInstanceToAsset(instance)
    expect(asset.aiMeta).toBeUndefined()
  })
})
