'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
  SettingsPanel,
  SettingGroup,
  SettingSegmented,
  Tag,

  Tabs,
  TabsList,
  Tab,
  TabsContent,
} from '@/components/ui'
import type { FacepileUser } from '@/components/ui/facepile'
import type { SortCriterion } from '@/components/ui/sort-dropdown'
import { AppLayout } from '@/components/layouts'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAssetSelection, useViewPreferences, useCompactBar, useDepartmentAccess, useUserCollections, useWorkspaceState } from '@/hooks'
import type { DepartmentAccessLevel } from '@/hooks'
import type { Asset, Collection } from '@/lib/data'
import type { DepartmentConfig } from './types'
import { WorkspaceFilesTab } from './WorkspaceFilesTab'
import { instanceToAsset } from '@/lib/asset-instances'

interface DepartmentHomeViewProps {
  config: DepartmentConfig
  /** Global collections for metadata lookup (names, types, avatars) */
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

// Department labels for settings panel
const DEPARTMENT_LABELS: Record<string, string> = {
  'art-design': 'Art & Design',
  'vfx': 'VFX',
  'camera': 'Camera',
  'editorial': 'Editorial',
  'audio-sound': 'Audio & Sound',
}

// Access level options for settings
const ACCESS_LEVEL_OPTIONS: { value: DepartmentAccessLevel; label: string }[] = [
  { value: 'full', label: 'Full' },
  { value: 'partial', label: 'Partial' },
  { value: 'none', label: 'Locked' },
]


export function DepartmentHomeView({ config, initialCollections }: DepartmentHomeViewProps) {
  const pathname = usePathname()
  const menuHref = `/nextgen/menu?return=${encodeURIComponent(pathname)}`
  const { selectedIds, primaryId, handleAssetClick, clearSelection } = useAssetSelection()
  const { getAccessLevel, setAccessLevel, allDepartments, accessLevels } = useDepartmentAccess()
  const { scrollRef, headerRef, showCompactBar } = useCompactBar()
  const { createCollection } = useUserCollections()
  const { instanceGroups } = useWorkspaceState(config.id, 'files')

  // Department assets - single source of truth for this department's assets
  const [departmentAssets, setDepartmentAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<Error | null>(null)

  // Collection drilldown state (department-scoped)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)

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

  // Fetch all department assets on mount (single API call)
  useEffect(() => {
    const fetchDepartmentAssets = async () => {
      setIsLoading(true)
      setLoadError(null)

      try {
        const response = await fetch(`/api/departments/${config.id}/assets`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const assets = await response.json()
        setDepartmentAssets(assets)
      } catch (error) {
        console.error('Failed to fetch department assets:', error)
        setLoadError(error instanceof Error ? error : new Error('Failed to fetch assets'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchDepartmentAssets()
  }, [config.id])

  // IDs of assets that came from workspace instances
  const workspaceAssetIds = useMemo(() => {
    return new Set(instanceGroups.flatMap(g => g.instances.map(inst => inst.id)))
  }, [instanceGroups])

  // All assets (library + workspace instances) sorted by date (newest first)
  const sortedAssets = useMemo(() => {
    const workspaceAssets = instanceGroups.flatMap(g => g.instances).map(instanceToAsset)
    return [...departmentAssets, ...workspaceAssets].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
      return dateB - dateA
    })
  }, [departmentAssets, instanceGroups])

  // Assets for current collection view (filtered from department assets)
  const collectionAssets = useMemo(() => {
    if (!selectedCollection) return []
    return departmentAssets.filter((a) => a.collectionIds?.includes(selectedCollection.id))
  }, [departmentAssets, selectedCollection])

  // Collection navigation handlers
  const loadCollection = useCallback((collection: Collection) => {
    setSelectedCollection(collection)
  }, [])

  const goBack = useCallback(() => {
    setSelectedCollection(null)
  }, [])


  const handleMenuClick = (asset: Asset) => {
    console.log('Menu clicked for:', asset.name)
  }

  // Get selected assets
  const selectedAssets = useMemo(() => {
    const sourceAssets = selectedCollection ? collectionAssets : departmentAssets
    return sourceAssets.filter((asset) => selectedIds.has(asset.id))
  }, [departmentAssets, collectionAssets, selectedCollection, selectedIds])

  const handleCreateCollection = (name: string) => {
    createCollection(name, selectedAssets.map(a => a.id))
    clearSelection()
  }

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
                    {isLoading ? (
                      <CardGrid
                        gap="4"
                        columns={layout === 'gallery' ? 3 : cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}
                        layout={layout === 'list' ? 'list' : 'grid'}
                      >
                        {[...Array(6)].map((_, i) => (
                          <AssetCard key={i} loading />
                        ))}
                      </CardGrid>
                    ) : departmentAssets.length > 0 ? (
                      <CardGrid
                        gap="4"
                        columns={layout === 'gallery' ? 3 : cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}
                        layout={layout === 'list' ? 'list' : 'grid'}
                      >
                        {departmentAssets.slice(0, 12).map((asset) => (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            selected={selectedIds.has(asset.id)}
                            primary={primaryId === asset.id}
                            onClick={(a, e) => handleAssetClick(a, e, departmentAssets)}
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
            onCreateCollection={handleCreateCollection}
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
                      {collectionAssets.length === 0
                        ? 'No assets in this department'
                        : `${collectionAssets.length} asset${collectionAssets.length !== 1 ? 's' : ''} from ${config.shortName}`
                      }
                    </Text>
                  </div>

                  {collectionAssets.length > 0 ? (
                    <CardGrid
                      gap="4"
                      columns={layout === 'gallery' ? 3 : cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}
                      layout={layout === 'list' ? 'list' : 'grid'}
                    >
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
            onCreateCollection={handleCreateCollection}
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
            count={departmentAssets.length}
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
                  <HawkinsSearch
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    filters={filterOptions}
                  />
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
                  </div>
                </div>

                <Tabs defaultValue="assets">
                  <TabsList>
                    <Tab value="assets">Assets</Tab>
                    <Tab value="files">Files</Tab>
                  </TabsList>

                  <TabsContent value="assets">
                    <Stack spacing="lg">
                      {/* All Assets Stream */}
                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Text variant="headline-2" weight="bold">
                              All Assets
                            </Text>
                            <Text variant="body-1" color="secondary">
                              {sortedAssets.length} {sortedAssets.length === 1 ? 'asset' : 'assets'}
                            </Text>
                          </div>
                          <div className="flex items-center gap-2">
                            <SortDropdown
                              fields={sortFields}
                              value={sortCriteria}
                              onChange={setSortCriteria}
                              iconOnly
                            />
                            <AppearanceDropdown
                              layout={layout}
                              onLayoutChange={setLayout}
                              cardSize={cardSize}
                              onCardSizeChange={setCardSize}
                              iconOnly
                            />
                          </div>
                        </div>
                        {isLoading ? (
                          <CardGrid
                            gap="4"
                            columns={layout === 'gallery' ? 3 : cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}
                            layout={layout === 'list' ? 'list' : 'grid'}
                          >
                            {[...Array(12)].map((_, i) => (
                              <AssetCard key={i} loading />
                            ))}
                          </CardGrid>
                        ) : sortedAssets.length > 0 ? (
                          <CardGrid
                            gap="4"
                            columns={layout === 'gallery' ? 3 : cardSize === 'sm' ? 6 : cardSize === 'lg' ? 3 : 4}
                            layout={layout === 'list' ? 'list' : 'grid'}
                          >
                            {sortedAssets.map((asset) => (
                              <AssetCard
                                key={asset.id}
                                asset={asset}
                                selected={selectedIds.has(asset.id)}
                                primary={primaryId === asset.id}
                                onClick={(a, e) => handleAssetClick(a, e, departmentAssets)}
                                onMenuClick={handleMenuClick}
                                fromWorkspace={workspaceAssetIds.has(asset.id)}
                              />
                            ))}
                          </CardGrid>
                        ) : (
                          <EmptyState
                            title="No assets yet"
                            message="Assets uploaded to your department folder will appear here"
                          />
                        )}
                      </section>
                    </Stack>
                  </TabsContent>

                  <TabsContent value="files">
                    <WorkspaceFilesTab departmentId={config.id} />
                  </TabsContent>
                </Tabs>
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
          onCreateCollection={handleCreateCollection}
          onShare={() => console.log('Share:', Array.from(selectedIds))}
        />
      </div>
    </AppLayout>
  )
}
