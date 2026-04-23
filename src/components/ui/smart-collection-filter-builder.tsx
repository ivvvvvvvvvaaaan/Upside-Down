'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Input } from './input'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Chip } from './chip'
import { cn } from '@/lib/utils'
import type { AssetFilter, AssetType, DomainId } from '@/lib/data'

/**
 * Smart Collection Filter Builder
 *
 * Unified filter builder for smart collections. Filters are represented as
 * removable chips so editing collection rules mirrors editing asset tags.
 */

const ASSET_TYPE_OPTIONS = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'shot', label: 'Shot' },
  { value: 'text', label: 'Text' },
  { value: 'audio', label: 'Audio' },
] satisfies { value: AssetType; label: string }[]

const DEPARTMENT_OPTIONS = [
  { value: 'art-design', label: 'Art & Design' },
  { value: 'vfx', label: 'VFX' },
  { value: 'camera', label: 'Camera' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'audio-sound', label: 'Audio & Sound' },
] satisfies { value: DomainId; label: string }[]

const TYPE_TAG_PRESETS = [
  'Concept Art', 'Storyboards', 'Character', 'Location', 'Environment',
  'Scene', 'Color Palette', 'Blueprint', 'Reference', 'Costume Design',
  'Prop Design', 'Final', 'VFX Preview', 'Dailies', 'Rough Cut',
]

type FilterChip = {
  id: string
  label: string
  onRemove: () => void
}

type AddFilterOption = {
  id: string
  label: string
  onSelect: () => void
}

interface SmartCollectionFilterBuilderProps {
  name: string
  filter: AssetFilter
  onNameChange: (name: string) => void
  onFilterChange: (filter: AssetFilter) => void
  className?: string
}

export function SmartCollectionFilterBuilder({
  name,
  filter,
  onNameChange,
  onFilterChange,
  className,
}: SmartCollectionFilterBuilderProps) {
  const [addFilterOpen, setAddFilterOpen] = useState(false)

  const updateFilter = (updates: Partial<AssetFilter>) => {
    onFilterChange({ ...filter, ...updates })
  }

  const removeFilter = (type: keyof AssetFilter) => {
    const newFilter = { ...filter }
    delete newFilter[type]
    onFilterChange(newFilter)
  }

  const removeArrayValue = <T extends string>(key: 'types' | 'typeTags' | 'aiCharacters', value: T) => {
    const current = (filter[key] ?? []) as T[]
    const next = current.filter(item => item !== value)
    updateFilter({ [key]: next.length > 0 ? next : undefined } as Partial<AssetFilter>)
  }

  const chips: FilterChip[] = [
    ...(filter.types ?? []).map((type) => ({
      id: `type-${type}`,
      label: `Type: ${ASSET_TYPE_OPTIONS.find(option => option.value === type)?.label ?? type}`,
      onRemove: () => removeArrayValue('types', type),
    })),
    ...(filter.department ? [{
      id: 'department',
      label: `Department: ${DEPARTMENT_OPTIONS.find(option => option.value === filter.department)?.label ?? filter.department}`,
      onRemove: () => removeFilter('department'),
    }] : []),
    ...(filter.typeTags ?? []).map((tag) => ({
      id: `type-tag-${tag}`,
      label: `Type tag: ${tag}`,
      onRemove: () => removeArrayValue('typeTags', tag),
    })),
    ...(filter.isCircleTake ? [{
      id: 'is-circle-take',
      label: 'Tag: Circle Take',
      onRemove: () => removeFilter('isCircleTake'),
    }] : []),
    ...(filter.isFinal ? [{
      id: 'is-final',
      label: 'Tag: Final',
      onRemove: () => removeFilter('isFinal'),
    }] : []),
    ...(filter.isKeyArt ? [{
      id: 'is-key-art',
      label: 'Tag: Key Art',
      onRemove: () => removeFilter('isKeyArt'),
    }] : []),
    ...(filter.aiHasCharacters ? [{
      id: 'ai-has-characters',
      label: 'Has character tags',
      onRemove: () => removeFilter('aiHasCharacters'),
    }] : []),
    ...(filter.aiHasScene ? [{
      id: 'ai-has-scene',
      label: 'Has scene tags',
      onRemove: () => removeFilter('aiHasScene'),
    }] : []),
    ...(filter.aiHasLocation ? [{
      id: 'ai-has-location',
      label: 'Has location tags',
      onRemove: () => removeFilter('aiHasLocation'),
    }] : []),
    ...(filter.aiCharacters ?? []).map((character) => ({
      id: `ai-character-${character}`,
      label: `Character: ${character}`,
      onRemove: () => removeArrayValue('aiCharacters', character),
    })),
    ...(filter.aiScene ? [{
      id: 'ai-scene',
      label: `Scene: ${filter.aiScene}`,
      onRemove: () => removeFilter('aiScene'),
    }] : []),
    ...(filter.aiLocation ? [{
      id: 'ai-location',
      label: `Location: ${filter.aiLocation}`,
      onRemove: () => removeFilter('aiLocation'),
    }] : []),
    ...(filter.aiConfidenceBelow != null ? [{
      id: 'ai-confidence-below',
      label: `AI confidence below ${Math.round(filter.aiConfidenceBelow * 100)}%`,
      onRemove: () => removeFilter('aiConfidenceBelow'),
    }] : []),
    ...(filter.query ? [{
      id: 'query',
      label: `Name: ${filter.query}`,
      onRemove: () => removeFilter('query'),
    }] : []),
  ]

  const addOptions: AddFilterOption[] = [
    ...ASSET_TYPE_OPTIONS
      .filter(option => !(filter.types ?? []).includes(option.value))
      .map(option => ({
        id: `type-${option.value}`,
        label: `Type: ${option.label}`,
        onSelect: () => updateFilter({ types: [...(filter.types ?? []), option.value] }),
      })),
    ...DEPARTMENT_OPTIONS
      .filter(option => option.value !== filter.department)
      .map(option => ({
        id: `department-${option.value}`,
        label: `Department: ${option.label}`,
        onSelect: () => updateFilter({ department: option.value }),
      })),
    ...TYPE_TAG_PRESETS
      .filter(tag => !(filter.typeTags ?? []).includes(tag))
      .map(tag => ({
        id: `type-tag-${tag}`,
        label: `Type tag: ${tag}`,
        onSelect: () => updateFilter({ typeTags: [...(filter.typeTags ?? []), tag] }),
      })),
    ...(!filter.isCircleTake ? [{
      id: 'tag-circle-take',
      label: 'Tag: Circle Take',
      onSelect: () => updateFilter({ isCircleTake: true }),
    }] : []),
    ...(!filter.isFinal ? [{
      id: 'tag-final',
      label: 'Tag: Final',
      onSelect: () => updateFilter({ isFinal: true }),
    }] : []),
    ...(!filter.isKeyArt ? [{
      id: 'tag-key-art',
      label: 'Tag: Key Art',
      onSelect: () => updateFilter({ isKeyArt: true }),
    }] : []),
    ...(!filter.aiHasCharacters ? [{
      id: 'has-character-tags',
      label: 'Has character tags',
      onSelect: () => updateFilter({ aiHasCharacters: true }),
    }] : []),
    ...(!filter.aiHasScene ? [{
      id: 'has-scene-tags',
      label: 'Has scene tags',
      onSelect: () => updateFilter({ aiHasScene: true }),
    }] : []),
    ...(!filter.aiHasLocation ? [{
      id: 'has-location-tags',
      label: 'Has location tags',
      onSelect: () => updateFilter({ aiHasLocation: true }),
    }] : []),
    ...(filter.aiConfidenceBelow == null ? [{
      id: 'ai-confidence-below',
      label: 'AI confidence below 70%',
      onSelect: () => updateFilter({ aiConfidenceBelow: 0.7 }),
    }] : []),
  ]

  const handleAddOption = (option: AddFilterOption) => {
    option.onSelect()
    setAddFilterOpen(false)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Input
        label="Name"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Collection name"
        autoComplete="off"
        data-1p-ignore
      />

      <section className="space-y-3">
        <h3 className="text-label-1-bold text-foreground">
          Includes assets matching
        </h3>

        {chips.length === 0 ? (
          <p className="text-label-1-regular text-foreground-dim mb-3">
            No filters yet. Add a filter to define which assets appear in this collection.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <FilterChipButton key={chip.id} chip={chip} />
            ))}
          </div>
        )}

        {addOptions.length > 0 && (
          <Popover open={addFilterOpen} onOpenChange={setAddFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="tertiary" compact icon={<Plus className="w-3 h-3" />}>
                Add filter
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-1 w-52 max-h-64 overflow-y-auto">
              <div className="flex flex-col">
                {addOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleAddOption(option)}
                    className="px-3 py-2 text-left text-label-1-regular text-foreground hover:bg-surface-highlight rounded transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </section>
    </div>
  )
}

function FilterChipButton({ chip }: { chip: FilterChip }) {
  return (
    <Chip
      onDismiss={chip.onRemove}
      dismissLabel={`Remove ${chip.label}`}
    >
      {chip.label}
    </Chip>
  )
}
