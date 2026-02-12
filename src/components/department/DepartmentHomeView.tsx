'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Stack,
  Text,
  AssetCard,
  Button,
  CardGrid,
  PageHeader,
  EmptyState,
  AppearanceDropdown,
  SortDropdown,
  HawkinsSearch,
  CompactBar,
  SelectionBar,
  Facepile,
  FileExplorer,
  SettingsPanel,
  SettingGroup,
  SettingSegmented,
  Tag,
} from '@/components/ui'
import type { FacepileUser } from '@/components/ui/facepile'
import type { FileNode } from '@/components/ui/file-explorer'
import type { SortCriterion } from '@/components/ui/sort-dropdown'
import { AppLayout } from '@/components/layouts'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAssetSelection, useCollectionAssets, useViewPreferences, useCompactBar, useDepartmentAccess } from '@/hooks'
import type { DepartmentAccessLevel } from '@/hooks'
import type { Asset, Collection } from '@/lib/data'
import type { DepartmentConfig } from './types'

interface DepartmentHomeViewProps {
  config: DepartmentConfig
  initialCollections: Collection[]
}

const SKELETON_ASSET_COUNT = 12

// Mock department members
const MOCK_DEPARTMENT_MEMBERS: FacepileUser[] = [
  { id: '1', name: 'Sarah Chen', avatarSrc: 'https://i.pravatar.cc/150?img=1' },
  { id: '2', name: 'Marcus Johnson', avatarSrc: 'https://i.pravatar.cc/150?img=3' },
  { id: '3', name: 'Emily Rodriguez', avatarSrc: 'https://i.pravatar.cc/150?img=5' },
  { id: '4', name: 'David Kim', avatarSrc: 'https://i.pravatar.cc/150?img=8' },
  { id: '5', name: 'Lisa Wang', avatarSrc: 'https://i.pravatar.cc/150?img=9' },
  { id: '6', name: 'James Miller', avatarSrc: 'https://i.pravatar.cc/150?img=11' },
  { id: '7', name: 'Anna Thompson', avatarSrc: 'https://i.pravatar.cc/150?img=16' },
]

// Mock file structure
const MOCK_FILES: FileNode[] = [
  {
    id: 'f1',
    name: 'Concept Art',
    type: 'folder',
    modifiedAt: '2024-03-15T10:30:00Z',
    children: [
      {
        id: 'f1-1',
        name: 'Characters',
        type: 'folder',
        modifiedAt: '2024-03-14T09:00:00Z',
        children: [
          { id: 'f1-1-1', name: 'eleven_concept_v3.psd', type: 'file', extension: 'psd', size: 45000000, modifiedAt: '2024-03-14T09:00:00Z', assetized: true },
          { id: 'f1-1-2', name: 'hopper_uniform_final.psd', type: 'file', extension: 'psd', size: 38000000, modifiedAt: '2024-03-13T14:30:00Z', assetized: true },
          { id: 'f1-1-3', name: 'demogorgon_iterations.psd', type: 'file', extension: 'psd', size: 120000000, modifiedAt: '2024-03-12T11:00:00Z', assetized: false },
        ],
      },
      {
        id: 'f1-2',
        name: 'Environments',
        type: 'folder',
        modifiedAt: '2024-03-10T16:00:00Z',
        children: [
          { id: 'f1-2-1', name: 'upside_down_forest.psd', type: 'file', extension: 'psd', size: 85000000, modifiedAt: '2024-03-10T16:00:00Z', assetized: true },
          { id: 'f1-2-2', name: 'hawkins_lab_interior.psd', type: 'file', extension: 'psd', size: 62000000, modifiedAt: '2024-03-09T10:00:00Z', assetized: true },
        ],
      },
    ],
  },
  {
    id: 'f2',
    name: 'Storyboards',
    type: 'folder',
    modifiedAt: '2024-03-12T14:00:00Z',
    children: [
      { id: 'f2-1', name: 'ep01_seq12_boards.pdf', type: 'file', extension: 'pdf', size: 15000000, modifiedAt: '2024-03-12T14:00:00Z', assetized: true },
      { id: 'f2-2', name: 'ep01_seq15_boards.pdf', type: 'file', extension: 'pdf', size: 12000000, modifiedAt: '2024-03-11T09:30:00Z', assetized: false },
      { id: 'f2-3', name: 'chase_sequence_rough.pdf', type: 'file', extension: 'pdf', size: 8000000, modifiedAt: '2024-03-10T11:00:00Z', assetized: false },
    ],
  },
  {
    id: 'f3',
    name: 'Reference',
    type: 'folder',
    modifiedAt: '2024-03-08T09:00:00Z',
    children: [
      { id: 'f3-1', name: '1980s_mall_photos.zip', type: 'file', extension: 'zip', size: 250000000, modifiedAt: '2024-03-08T09:00:00Z', assetized: false },
      { id: 'f3-2', name: 'retro_arcade_ref.zip', type: 'file', extension: 'zip', size: 180000000, modifiedAt: '2024-03-07T15:00:00Z', assetized: false },
    ],
  },
  { id: 'f4', name: 'color_palette_s5.ai', type: 'file', extension: 'ai', size: 2500000, modifiedAt: '2024-03-06T10:00:00Z', assetized: false },
  { id: 'f5', name: 'asset_naming_conventions.pdf', type: 'file', extension: 'pdf', size: 500000, modifiedAt: '2024-02-28T14:00:00Z', assetized: false },
]

// Department labels for settings panel
const DEPARTMENT_LABELS: Record<string, string> = {
  'art-design': 'Art & Design',
  'vfx': 'VFX',
}

// Access level options for settings
const ACCESS_LEVEL_OPTIONS: { value: DepartmentAccessLevel; label: string }[] = [
  { value: 'full', label: 'Full' },
  { value: 'partial', label: 'Partial' },
  { value: 'none', label: 'Locked' },
]


export function DepartmentHomeView({ config, initialCollections }: DepartmentHomeViewProps) {
  const [collections] = useState<Collection[]>(initialCollections)
  const pathname = usePathname()
  const menuHref = `/nextgen/menu?return=${encodeURIComponent(pathname)}`
  const { selectedIds, primaryId, handleAssetClick, clearSelection } = useAssetSelection()
  const { getAccessLevel, setAccessLevel, allDepartments, accessLevels } = useDepartmentAccess()
  const {
    selectedCollection,
    assets: collectionAssets,
    loading: loadingAssets,
    error: loadError,
    loadCollection,
    retry: retryLoad,
    goBack,
  } = useCollectionAssets({ onNavigate: () => {} })
  const { scrollRef, headerRef, showCompactBar } = useCompactBar()

  // Appearance settings
  const { layout, setLayout, cardSize, setCardSize } = useViewPreferences()

  // Sort settings
  const sortFields = [
    { value: 'name', label: 'Name' },
    { value: 'date', label: 'Date Modified' },
    { value: 'type', label: 'Type' },
  ]
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([
    { field: 'name', direction: 'asc' }
  ])
  const [searchQuery, setSearchQuery] = useState('')

  const filterOptions = [
    { id: 'type', label: 'Type' },
    { id: 'modified', label: 'Modified' },
  ]

  // Pre-loaded asset data
  const [loadedAssets, setLoadedAssets] = useState<Record<string, Asset[]>>({})
  const [isPreloading, setIsPreloading] = useState(true)

  // Pre-fetch all collection assets on mount
  useEffect(() => {
    const fetchAllAssets = async () => {
      setIsPreloading(true)

      const fetchPromises = collections.map(async (collection) => {
        try {
          const response = await fetch(`/api/collections/${collection.id}/assets`)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const assets = await response.json()
          return { id: collection.id, assets, failed: false }
        } catch (error) {
          console.error('Failed to pre-fetch assets:', error)
          return { id: collection.id, assets: [], failed: true }
        }
      })

      const results = await Promise.all(fetchPromises)
      const assetsMap: Record<string, Asset[]> = {}

      for (const result of results) {
        assetsMap[result.id] = result.assets
      }

      setLoadedAssets(assetsMap)
      setIsPreloading(false)
    }

    fetchAllAssets()
  }, [collections])

  // Flatten all assets (deduplicated)
  const flattenedAssets = useMemo(() => {
    const seen = new Set<string>()
    const assets: Asset[] = []

    for (const collectionAssets of Object.values(loadedAssets)) {
      for (const asset of collectionAssets) {
        if (!seen.has(asset.id)) {
          seen.add(asset.id)
          assets.push(asset)
        }
      }
    }

    return assets
  }, [loadedAssets])

  // Recent assets (sorted by date, limited)
  const recentAssets = useMemo(() => {
    return [...flattenedAssets]
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      })
      .slice(0, 12)
  }, [flattenedAssets])


  const handleMenuClick = (asset: Asset) => {
    console.log('Menu clicked for:', asset.name)
  }

  // Get selected assets
  const selectedAssets = useMemo(() => {
    const sourceAssets = selectedCollection ? collectionAssets : flattenedAssets
    return sourceAssets.filter((asset) => selectedIds.has(asset.id))
  }, [flattenedAssets, collectionAssets, selectedCollection, selectedIds])

  const isCompactBarVisible = !selectedCollection && showCompactBar


  // Check department access
  const accessLevel = getAccessLevel(config.id)

  // Settings panel component (shared across all views)
  const settingsPanel = (
    <SettingsPanel>
      <SettingGroup label="Department Access">
        {allDepartments.map((deptId) => (
          <SettingSegmented
            key={deptId}
            label={DEPARTMENT_LABELS[deptId] || deptId}
            options={ACCESS_LEVEL_OPTIONS}
            value={accessLevels[deptId] ?? 'full'}
            onChange={(level) => setAccessLevel(deptId, level)}
          />
        ))}
      </SettingGroup>
    </SettingsPanel>
  )

  // Full locked view - no access at all
  if (accessLevel === 'none') {
    return (
      <AppLayout>
        <div className="h-full flex flex-col">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="p-6">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-center h-96">
                  <EmptyState
                    title="Access Restricted"
                    message={`You don't have access to the ${config.name} department. Contact your administrator to request access.`}
                  />
                </div>
              </div>
            </div>
          </div>
          {settingsPanel}
        </div>
      </AppLayout>
    )
  }

  // Partial access view - shared collections only
  if (accessLevel === 'partial') {
    return (
      <AppLayout>
        <div className="h-full flex flex-col">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="p-6">
              <div className="max-w-7xl mx-auto">
                <Stack spacing="lg">
                  {/* Mobile menu button */}
                  <div className="md:hidden">
                    <Button asChild variant="icon" size="icon" aria-label="Menu">
                      <Link href={menuHref}>
                        <ArrowLeft className="w-4 h-4" />
                        <span className="sr-only">Menu</span>
                      </Link>
                    </Button>
                  </div>

                  {/* Header */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <PageHeader title={config.name} />
                        <Tag type="notice" size="compact">Limited Access</Tag>
                      </div>
                      <Facepile users={MOCK_DEPARTMENT_MEMBERS} max={5} size="sm" />
                    </div>
                  </div>

                  {/* Shared Assets */}
                  <section>
                    <Text variant="headline-2" weight="bold" className="mb-4">
                      Shared
                    </Text>
                    {isPreloading ? (
                      <CardGrid gap="4" columns={cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}>
                        {[...Array(6)].map((_, i) => (
                          <AssetCard key={i} loading />
                        ))}
                      </CardGrid>
                    ) : flattenedAssets.length > 0 ? (
                      <CardGrid gap="4" columns={cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}>
                        {flattenedAssets.slice(0, 12).map((asset) => (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            selected={selectedIds.has(asset.id)}
                            primary={primaryId === asset.id}
                            onClick={(a, e) => handleAssetClick(a, e, flattenedAssets)}
                            onMenuClick={handleMenuClick}
                          />
                        ))}
                      </CardGrid>
                    ) : (
                      <Text variant="body-1" color="secondary">No shared assets</Text>
                    )}
                  </section>
                </Stack>
              </div>
            </div>
          </div>

          {settingsPanel}

          <SelectionBar
            selectedCount={selectedIds.size}
            selectedAssets={selectedAssets}
            onClear={clearSelection}
            onCreateCollection={(name) => console.log('Create collection:', name, 'with assets:', Array.from(selectedIds))}
            onShare={() => console.log('Share:', Array.from(selectedIds))}
          />
        </div>
      </AppLayout>
    )
  }

  // Collection detail view
  if (selectedCollection) {
    return (
      <AppLayout>
        <div className="h-full flex flex-col">
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
            <div className="p-6">
              <div className="max-w-7xl mx-auto">
                <Stack spacing="lg">
                  <div className="md:hidden">
                    <Button asChild variant="icon" size="icon" aria-label="Menu">
                      <Link href={menuHref}>
                        <ArrowLeft className="w-4 h-4" />
                        <span className="sr-only">Menu</span>
                      </Link>
                    </Button>
                  </div>
                  <div>
                    <Button
                      variant="tertiary"
                      compact
                      icon={<ArrowLeft className="w-4 h-4" />}
                      onClick={goBack}
                      className="mb-4"
                    >
                      Back to {config.shortName}
                    </Button>
                    <Text variant="headline-1" weight="bold" className="mb-2">
                      {selectedCollection.name}
                    </Text>
                    <Text variant="body-2" color="secondary">
                      {loadingAssets
                        ? 'Loading assets...'
                        : collectionAssets.length === 0
                        ? 'No assets'
                        : `${collectionAssets.length} asset${collectionAssets.length !== 1 ? 's' : ''}`
                      }
                    </Text>
                  </div>

                  {loadingAssets ? (
                    <CardGrid gap="4" columns={cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}>
                      {[...Array(SKELETON_ASSET_COUNT)].map((_, i) => (
                        <AssetCard key={i} loading />
                      ))}
                    </CardGrid>
                  ) : loadError ? (
                    <EmptyState
                      title="Failed to load assets"
                      message={loadError.message}
                    >
                      <Button variant="secondary" onClick={retryLoad} className="mt-4">
                        Try Again
                      </Button>
                    </EmptyState>
                  ) : collectionAssets.length > 0 ? (
                    <CardGrid gap="4" columns={cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}>
                      {collectionAssets.map((asset) => (
                        <AssetCard
                          key={asset.id}
                          asset={asset}
                          selected={selectedIds.has(asset.id)}
                          primary={primaryId === asset.id}
                          onClick={(a, e) => handleAssetClick(a, e, collectionAssets)}
                          onMenuClick={handleMenuClick}
                        />
                      ))}
                    </CardGrid>
                  ) : (
                    <EmptyState
                      title="No assets found"
                      message="This collection doesn't have any assets yet"
                    />
                  )}
                </Stack>
              </div>
            </div>
          </div>

          <SelectionBar
            selectedCount={selectedIds.size}
            selectedAssets={selectedAssets}
            onClear={clearSelection}
            onCreateCollection={(name) => console.log('Create collection:', name, 'with assets:', Array.from(selectedIds))}
            onShare={() => console.log('Share:', Array.from(selectedIds))}
          />
        </div>
      </AppLayout>
    )
  }

  // Main view - all assets
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
          <CompactBar
            visible={isCompactBarVisible}
            title={config.name}
            count={flattenedAssets.length}
            countLabel="asset"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterOptions={filterOptions}
            sortFields={sortFields}
            sortCriteria={sortCriteria}
            onSortChange={setSortCriteria}
            layout={layout}
            onLayoutChange={setLayout}
            cardSize={cardSize}
            onCardSizeChange={setCardSize}
          />

          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Stack spacing="lg">
                {/* Mobile menu button */}
                <div className="flex items-center justify-between w-full md:hidden">
                  <Button asChild variant="icon" size="icon" aria-label="Menu">
                    <Link href={menuHref}>
                      <ArrowLeft className="w-4 h-4" />
                      <span className="sr-only">Menu</span>
                    </Link>
                  </Button>
                  <div className="flex items-center gap-2">
                    <HawkinsSearch
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      filters={filterOptions}
                    />
                    <SortDropdown
                      fields={sortFields}
                      value={sortCriteria}
                      onChange={setSortCriteria}
                      iconOnly
                    />
                    <AppearanceDropdown iconOnly
                      layout={layout}
                      onLayoutChange={setLayout}
                      cardSize={cardSize}
                      onCardSizeChange={setCardSize}
                    />
                  </div>
                </div>

                {/* Header with facepile */}
                <div ref={headerRef} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <PageHeader
                      title={config.name}
                      description={config.description}
                    />
                    <Facepile users={MOCK_DEPARTMENT_MEMBERS} max={5} size="sm" />
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <HawkinsSearch
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      filters={filterOptions}
                    />
                    <SortDropdown
                      fields={sortFields}
                      value={sortCriteria}
                      onChange={setSortCriteria}
                    />
                    <AppearanceDropdown
                      layout={layout}
                      onLayoutChange={setLayout}
                      cardSize={cardSize}
                      onCardSizeChange={setCardSize}
                    />
                  </div>
                </div>

                {/* Recent Assets - one row */}
                <section>
                  <Text variant="headline-2" weight="bold" className="mb-4">
                    Recent
                  </Text>
                  {isPreloading ? (
                    <CardGrid gap="4" columns={cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}>
                      {[...Array(cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4)].map((_, i) => (
                        <AssetCard key={i} loading />
                      ))}
                    </CardGrid>
                  ) : recentAssets.length > 0 ? (
                    <CardGrid gap="4" columns={cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}>
                      {recentAssets.slice(0, cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4).map((asset) => (
                        <AssetCard
                          key={asset.id}
                          asset={asset}
                          selected={selectedIds.has(asset.id)}
                          primary={primaryId === asset.id}
                          onClick={(a, e) => handleAssetClick(a, e, flattenedAssets)}
                          onMenuClick={handleMenuClick}
                        />
                      ))}
                    </CardGrid>
                  ) : (
                    <Text variant="body-1" color="secondary">No recent assets</Text>
                  )}
                </section>

                {/* Files */}
                <section>
                  <FileExplorer
                    title="Files"
                    files={MOCK_FILES}
                    onFileClick={(file) => console.log('File clicked:', file.name)}
                    onFolderClick={(folder) => console.log('Folder clicked:', folder.name)}
                  />
                </section>
              </Stack>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {settingsPanel}

        <SelectionBar
          selectedCount={selectedIds.size}
          selectedAssets={selectedAssets}
          onClear={clearSelection}
          onCreateCollection={(name) => console.log('Create collection:', name, 'with assets:', Array.from(selectedIds))}
          onShare={() => console.log('Share:', Array.from(selectedIds))}
        />
      </div>
    </AppLayout>
  )
}
