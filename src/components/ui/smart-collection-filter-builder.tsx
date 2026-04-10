'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Input } from './input'
import { FormSelect } from './form-select'
import { Button } from './button'
import { Toggle } from './switch'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'
import type { AssetFilter, AssetType, DomainId } from '@/lib/data'

/**
 * Smart Collection Filter Builder
 *
 * Unified filter builder for all smart collections.
 * Any filter (AI tags, asset type, domain, etc.) can be added or removed.
 * All rules combined with AND logic.
 */

type FilterType =
  | 'query' | 'types' | 'department' | 'typeTags'
  | 'isKeyArt' | 'isFinal'
  | 'aiHasCharacters' | 'aiHasScene' | 'aiHasLocation'
  | 'aiCharacters' | 'aiScene' | 'aiLocation'
  | 'aiConfidenceBelow'

const FILTER_LABELS: Record<FilterType, string> = {
  query: 'Name contains',
  types: 'Asset type',
  department: 'Domain',
  typeTags: 'Type tag',
  isKeyArt: 'Key art only',
  isFinal: 'Finals only',
  aiHasCharacters: 'Has character tags',
  aiHasScene: 'Has scene tags',
  aiHasLocation: 'Has location tags',
  aiCharacters: 'Character is',
  aiScene: 'Scene is',
  aiLocation: 'Location is',
  aiConfidenceBelow: 'AI confidence below',
}

const ALL_FILTER_TYPES: FilterType[] = [
  'aiHasCharacters', 'aiHasScene', 'aiHasLocation',
  'aiCharacters', 'aiScene', 'aiLocation',
  'types', 'department', 'typeTags', 'query',
  'isKeyArt', 'isFinal', 'aiConfidenceBelow',
]

const ASSET_TYPE_OPTIONS = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'shot', label: 'Shot' },
  { value: 'text', label: 'Text' },
  { value: 'audio', label: 'Audio' },
]

const DEPARTMENT_OPTIONS = [
  { value: 'art-design', label: 'Art & Design' },
  { value: 'vfx', label: 'VFX' },
  { value: 'camera', label: 'Camera' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'audio-sound', label: 'Audio & Sound' },
]

const TYPE_TAG_PRESETS = [
  'Concept Art', 'Storyboards', 'Character', 'Location', 'Environment',
  'Scene', 'Color Palette', 'Blueprint', 'Reference', 'Costume Design',
  'Prop Design', 'Final', 'VFX Preview', 'Dailies', 'Rough Cut',
]

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

  const removeFilter = (type: FilterType) => {
    const newFilter = { ...filter }
    switch (type) {
      case 'query': delete newFilter.query; break
      case 'types': delete newFilter.types; break
      case 'department': delete newFilter.department; break
      case 'typeTags': delete newFilter.typeTags; break
      case 'isKeyArt': delete newFilter.isKeyArt; break
      case 'isFinal': delete newFilter.isFinal; break
      case 'aiHasCharacters': delete newFilter.aiHasCharacters; break
      case 'aiHasScene': delete newFilter.aiHasScene; break
      case 'aiHasLocation': delete newFilter.aiHasLocation; break
      case 'aiCharacters': delete newFilter.aiCharacters; break
      case 'aiScene': delete newFilter.aiScene; break
      case 'aiLocation': delete newFilter.aiLocation; break
      case 'aiConfidenceBelow': delete newFilter.aiConfidenceBelow; break
    }
    onFilterChange(newFilter)
  }

  // Detect active filters
  const activeFilters: FilterType[] = []
  if (filter.query) activeFilters.push('query')
  if (filter.types && filter.types.length > 0) activeFilters.push('types')
  if (filter.department) activeFilters.push('department')
  if (filter.typeTags && filter.typeTags.length > 0) activeFilters.push('typeTags')
  if (filter.isKeyArt !== undefined) activeFilters.push('isKeyArt')
  if (filter.isFinal !== undefined) activeFilters.push('isFinal')
  if (filter.aiHasCharacters) activeFilters.push('aiHasCharacters')
  if (filter.aiHasScene) activeFilters.push('aiHasScene')
  if (filter.aiHasLocation) activeFilters.push('aiHasLocation')
  if (filter.aiCharacters && filter.aiCharacters.length > 0) activeFilters.push('aiCharacters')
  if (filter.aiScene) activeFilters.push('aiScene')
  if (filter.aiLocation) activeFilters.push('aiLocation')
  if (filter.aiConfidenceBelow != null) activeFilters.push('aiConfidenceBelow')

  const availableFilters = ALL_FILTER_TYPES.filter(f => !activeFilters.includes(f))

  const addFilter = (type: FilterType) => {
    switch (type) {
      case 'query': updateFilter({ query: '' }); break
      case 'types': updateFilter({ types: [] }); break
      case 'department': updateFilter({ department: 'art-design' }); break
      case 'typeTags': updateFilter({ typeTags: [] }); break
      case 'isKeyArt': updateFilter({ isKeyArt: true }); break
      case 'isFinal': updateFilter({ isFinal: true }); break
      case 'aiHasCharacters': updateFilter({ aiHasCharacters: true }); break
      case 'aiHasScene': updateFilter({ aiHasScene: true }); break
      case 'aiHasLocation': updateFilter({ aiHasLocation: true }); break
      case 'aiCharacters': updateFilter({ aiCharacters: [] }); break
      case 'aiScene': updateFilter({ aiScene: '' }); break
      case 'aiLocation': updateFilter({ aiLocation: '' }); break
      case 'aiConfidenceBelow': updateFilter({ aiConfidenceBelow: 0.7 }); break
    }
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

      <section>
        <h3 className="text-label-0-bold uppercase text-foreground-dim mb-3">
          Includes assets matching
        </h3>

        {activeFilters.length === 0 ? (
          <p className="text-label-1-regular text-foreground-dim mb-3">
            No filters yet. Add a filter to define which assets appear in this collection.
          </p>
        ) : (
          <div className="space-y-2 mb-3">
            {activeFilters.map((filterType) => (
              <FilterRow
                key={filterType}
                type={filterType}
                filter={filter}
                onUpdate={updateFilter}
                onRemove={() => removeFilter(filterType)}
              />
            ))}
          </div>
        )}

        {availableFilters.length > 0 && (
          <Popover open={addFilterOpen} onOpenChange={setAddFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="tertiary" compact icon={<Plus className="w-3 h-3" />}>
                Add filter
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-1 w-52 max-h-64 overflow-y-auto">
              <div className="flex flex-col">
                {availableFilters.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addFilter(type)}
                    className="px-3 py-2 text-left text-body-0-regular text-foreground hover:bg-surface-highlight rounded transition-colors"
                  >
                    {FILTER_LABELS[type]}
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

// --- Filter row ---

interface FilterRowProps {
  type: FilterType
  filter: AssetFilter
  onUpdate: (updates: Partial<AssetFilter>) => void
  onRemove: () => void
}

function FilterRow({ type, filter, onUpdate, onRemove }: FilterRowProps) {
  return (
    <div className="flex items-start gap-2 p-2 rounded bg-surface-2 group">
      <div className="flex-1 min-w-0">
        <span className="text-label-0-regular text-foreground-dim block mb-1">
          {FILTER_LABELS[type]}
        </span>
        <FilterEditor type={type} filter={filter} onUpdate={onUpdate} />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="p-1 text-foreground-dim hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove filter"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

// --- Filter value editors ---

interface FilterEditorProps {
  type: FilterType
  filter: AssetFilter
  onUpdate: (updates: Partial<AssetFilter>) => void
}

function FilterEditor({ type, filter, onUpdate }: FilterEditorProps) {
  switch (type) {
    case 'query':
      return (
        <Input
          type="text"
          value={filter.query || ''}
          onChange={(e) => onUpdate({ query: e.target.value || undefined })}
          placeholder="Search text..."
          autoComplete="off"
        />
      )

    case 'types':
      return (
        <div className="flex flex-wrap gap-1">
          {ASSET_TYPE_OPTIONS.map((option) => {
            const isSelected = filter.types?.includes(option.value as AssetType)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  const currentTypes = filter.types || []
                  const newTypes = isSelected
                    ? currentTypes.filter(t => t !== option.value)
                    : [...currentTypes, option.value as AssetType]
                  onUpdate({ types: newTypes.length > 0 ? newTypes : undefined })
                }}
                className={cn(
                  'px-2 py-0.5 rounded text-label-0-regular transition-colors',
                  isSelected
                    ? 'bg-indigo-500/20 text-foreground'
                    : 'bg-surface-flat text-foreground-subtle hover:bg-surface-highlight'
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      )

    case 'department':
      return (
        <FormSelect
          options={DEPARTMENT_OPTIONS}
          value={filter.department || ''}
          onChange={(value) => onUpdate({ department: value as DomainId })}
          size="compact"
        />
      )

    case 'typeTags':
      return (
        <TypeTagsEditor
          tags={filter.typeTags || []}
          onChange={(tags) => onUpdate({ typeTags: tags.length > 0 ? tags : undefined })}
        />
      )

    case 'isKeyArt':
    case 'isFinal': {
      const value = type === 'isKeyArt' ? filter.isKeyArt : filter.isFinal
      return (
        <Toggle
          checked={!!value}
          onChange={(v) => onUpdate({ [type]: v })}
        />
      )
    }

    // AI boolean flags — just confirm they're active
    case 'aiHasCharacters':
    case 'aiHasScene':
    case 'aiHasLocation':
      return (
        <Toggle
          checked={!!filter[type]}
          onChange={(v) => onUpdate({ [type]: v || undefined })}
        />
      )

    // AI specific value filters
    case 'aiCharacters':
      return (
        <TypeTagsEditor
          tags={filter.aiCharacters || []}
          onChange={(tags) => onUpdate({ aiCharacters: tags.length > 0 ? tags : undefined })}
          placeholder="Add character..."
        />
      )

    case 'aiScene':
      return (
        <Input
          type="text"
          value={filter.aiScene || ''}
          onChange={(e) => onUpdate({ aiScene: e.target.value || undefined })}
          placeholder="Scene name..."
          autoComplete="off"
        />
      )

    case 'aiLocation':
      return (
        <Input
          type="text"
          value={filter.aiLocation || ''}
          onChange={(e) => onUpdate({ aiLocation: e.target.value || undefined })}
          placeholder="Location name..."
          autoComplete="off"
        />
      )

    case 'aiConfidenceBelow':
      return (
        <Input
          type="number"
          min={0}
          max={1}
          step={0.1}
          value={filter.aiConfidenceBelow ?? 0.7}
          onChange={(e) => onUpdate({ aiConfidenceBelow: parseFloat(e.target.value) || undefined })}
          className="w-24"
        />
      )

    default:
      return null
  }
}

// --- Shared components ---

interface TypeTagsEditorProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

function TypeTagsEditor({ tags, onChange, placeholder }: TypeTagsEditorProps) {
  const [open, setOpen] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const availableTags = TYPE_TAG_PRESETS.filter(t => !tags.includes(t))
  const hasPresets = !placeholder // Only show presets for type tags, not character names

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      onChange([...tags, tag.trim()])
    }
    setCustomInput('')
    setOpen(false)
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag))
  }

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/20 text-label-0-regular text-foreground"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="hover:text-foreground-dim"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      {hasPresets ? (
        availableTags.length > 0 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-flat text-label-0-regular text-foreground-subtle hover:bg-surface-highlight transition-colors"
              >
                <Plus className="w-2.5 h-2.5" />
                Add
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-1 w-48 max-h-48 overflow-y-auto">
              <div className="flex flex-col">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="px-3 py-1.5 text-left text-body-0-regular text-foreground hover:bg-surface-highlight rounded transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )
      ) : (
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addTag(customInput) }
          }}
          placeholder={placeholder}
          className="flex-1 min-w-[100px] h-7 px-2 rounded text-label-0-regular bg-transparent text-foreground placeholder:text-foreground-dim focus:outline-none"
          autoComplete="off"
          data-1p-ignore
        />
      )}
    </div>
  )
}
