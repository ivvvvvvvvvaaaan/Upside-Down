'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Input } from './input'
import { FormSelect } from './form-select'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'
import type { AssetFilter, AssetType, DepartmentId } from '@/lib/data'

/**
 * Smart Collection Filter Builder
 *
 * Progressive disclosure UI for building filter rules.
 * - Name always visible at top
 * - Active filters shown as removable rows
 * - "Add filter" button to progressively add rules
 * - All rules combined with AND logic
 */

type FilterType = 'query' | 'types' | 'department' | 'typeTags' | 'isKeyArt'

const FILTER_TYPE_LABELS: Record<FilterType, string> = {
  query: 'Name contains',
  types: 'Asset type',
  department: 'Department',
  typeTags: 'Type tag',
  isKeyArt: 'Key art only',
}

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
  'Concept Art',
  'Storyboards',
  'Character',
  'Location',
  'Environment',
  'Scene',
  'Color Palette',
  'Blueprint',
  'Reference',
  'Costume Design',
  'Prop Design',
  'Final',
  'VFX Preview',
  'Dailies',
  'Rough Cut',
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
    delete newFilter[type]
    onFilterChange(newFilter)
  }

  // Determine which filters are active
  const activeFilters: FilterType[] = []
  if (filter.query) activeFilters.push('query')
  if (filter.types && filter.types.length > 0) activeFilters.push('types')
  if (filter.department) activeFilters.push('department')
  if (filter.typeTags && filter.typeTags.length > 0) activeFilters.push('typeTags')
  if (filter.isKeyArt !== undefined) activeFilters.push('isKeyArt')

  // Filters available to add
  const availableFilters: FilterType[] = (['query', 'types', 'department', 'typeTags', 'isKeyArt'] as FilterType[])
    .filter(f => !activeFilters.includes(f))

  const addFilter = (type: FilterType) => {
    switch (type) {
      case 'query':
        updateFilter({ query: '' })
        break
      case 'types':
        updateFilter({ types: [] })
        break
      case 'department':
        updateFilter({ department: 'art-design' })
        break
      case 'typeTags':
        updateFilter({ typeTags: [] })
        break
      case 'isKeyArt':
        updateFilter({ isKeyArt: true })
        break
    }
    setAddFilterOpen(false)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Name */}
      <Input
        label="Name"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Collection name"
        autoComplete="off"
        data-1p-ignore
      />

      {/* Section: Filter Rules */}
      <section>
        <h3 className="text-label-0-bold uppercase text-foreground-dim mb-3">Filter Rules</h3>

        {activeFilters.length === 0 ? (
          <p className="text-label-1-regular text-foreground-dim mb-3">
            No filters. Matches all assets.
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

        {/* Add Filter Button */}
        {availableFilters.length > 0 && (
          <Popover open={addFilterOpen} onOpenChange={setAddFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="tertiary" compact icon={<Plus className="w-3 h-3" />}>
                Add filter
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-1 w-48">
              <div className="flex flex-col">
                {availableFilters.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addFilter(type)}
                    className="px-3 py-2 text-left text-body-0-regular text-foreground hover:bg-surface-highlight rounded transition-colors"
                  >
                    {FILTER_TYPE_LABELS[type]}
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

/**
 * Individual filter row component
 */
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
          {FILTER_TYPE_LABELS[type]}
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

/**
 * Filter value editor based on type
 */
interface FilterEditorProps {
  type: FilterType
  filter: AssetFilter
  onUpdate: (updates: Partial<AssetFilter>) => void
}

function FilterEditor({ type, filter, onUpdate }: FilterEditorProps) {
  switch (type) {
    case 'query':
      return (
        <input
          type="text"
          value={filter.query || ''}
          onChange={(e) => onUpdate({ query: e.target.value || undefined })}
          placeholder="Search text..."
          className="w-full h-8 px-3 rounded text-body-0-regular bg-surface-flat dark:bg-white/[0.04] border border-border-dim text-foreground placeholder:text-foreground-dim focus:outline-none focus:border-border-system-focus focus:ring-1 focus:ring-inset focus:ring-border-system-focus"
          autoComplete="off"
          data-1p-ignore
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
          onChange={(value) => onUpdate({ department: value as DepartmentId })}
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
      return (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onUpdate({ isKeyArt: !filter.isKeyArt })}
            className={cn(
              'w-8 h-5 rounded-full transition-colors relative',
              filter.isKeyArt ? 'bg-indigo-500' : 'bg-surface-flat border border-border-dim'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                filter.isKeyArt ? 'translate-x-3.5' : 'translate-x-0.5'
              )}
            />
          </button>
          <span className="text-body-0-regular text-foreground">
            {filter.isKeyArt ? 'Yes' : 'No'}
          </span>
        </div>
      )

    default:
      return null
  }
}

/**
 * Type tags editor with chips and add dropdown
 */
interface TypeTagsEditorProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

function TypeTagsEditor({ tags, onChange }: TypeTagsEditorProps) {
  const [open, setOpen] = useState(false)
  const availableTags = TYPE_TAG_PRESETS.filter(t => !tags.includes(t))

  const addTag = (tag: string) => {
    onChange([...tags, tag])
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
      {availableTags.length > 0 && (
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
      )}
    </div>
  )
}
