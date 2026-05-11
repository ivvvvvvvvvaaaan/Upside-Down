'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Play, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { EmptyState } from '@/components/ui/empty-state'
import { Stack } from '@/components/ui/stack'
import { AssetCard } from '@/components/ui/asset-card'
import { CardGrid } from '@/components/ui/card-grid'
import { getProductionShot, getProductionScene } from '@/lib/ontology-meta'
import { getMediaAssetsByProductionShot } from '@/lib/prototype-assets'

interface Props {
  shotKey: string
}

function formatEpisode(episode: string): string {
  return episode.replace(/^EP/, 'Episode ')
}

export function ProductionShotDetailView({ shotKey }: Props) {
  const router = useRouter()
  const shot = useMemo(() => getProductionShot(shotKey), [shotKey])
  const productionScene = useMemo(() => {
    return shot ? getProductionScene(shot.productionScene) : undefined
  }, [shot])
  const components = useMemo(() => getMediaAssetsByProductionShot(shotKey), [shotKey])

  // Picture (camera or proxy) is the natural playable. Prefer proxy for editorial speed,
  // fall back to camera if no proxy exists.
  const primaryPlayable = useMemo(() => {
    return (
      components.find(a => a.mediaAssetType === 'dailies-proxy') ??
      components.find(a => a.mediaAssetType === 'proxy') ??
      components.find(a => a.mediaAssetType === 'camera-clip')
    )
  }, [components])

  const otherFiles = useMemo(() => {
    return components.filter(a => a.id !== primaryPlayable?.id)
  }, [components, primaryPlayable])

  if (!shot) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Stack spacing="lg">
              <EmptyState
                title="Shot not found"
                message={`No shot exists with reference "${shotKey}".`}
              >
                <Button variant="secondary" onClick={() => router.push('/nextgen')} className="mt-4">
                  Back to home
                </Button>
              </EmptyState>
            </Stack>
          </div>
        </div>
      </div>
    )
  }

  const heroDuration = primaryPlayable?.shotMeta?.duration ?? primaryPlayable?.videoMeta?.duration
  const takeCameraLabel = `Take ${shot.take}  ·  Camera ${shot.camera}${shot.circle ? '  ·  circled' : ''}`

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <Stack spacing="lg">
            <Button asChild variant="icon" size="icon" aria-label="Back" className="-my-2">
              <button onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Button>

            {/* Hero: video preview + identity */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[480px_1fr] md:gap-8">
              <div className="aspect-video w-full rounded bg-surface-low flex items-center justify-center relative group cursor-pointer hover:bg-surface-mid transition-colors">
                <div className="rounded-full bg-surface-high p-4 group-hover:bg-surface-flat transition-colors">
                  <Play className="h-7 w-7 fill-foreground text-foreground" />
                </div>
                {heroDuration && (
                  <div className="absolute bottom-2 right-2 rounded bg-surface-flat/80 px-1.5 py-0.5 text-label-0-regular text-foreground">
                    {heroDuration}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 min-w-0">
                <div className="flex flex-col gap-2">
                  <h2 className="truncate text-heading-2 font-bold font-mono">{shotKey}</h2>
                  <Text variant="body-1" color="secondary">
                    {shot.narrativeScene}
                  </Text>
                  <Text variant="body-1" color="secondary">
                    {formatEpisode(shot.episode)}  ·  {takeCameraLabel}
                    {shot.lens ? `  ·  ${shot.lens}` : ''}
                  </Text>
                </div>
                {shot.description && (
                  <Text variant="body-1" color="primary">
                    {shot.description}
                  </Text>
                )}
                {productionScene && (
                  <Text variant="body-2" color="secondary">
                    Shot on {productionScene.shootDate}
                    {productionScene.unit ? `, ${productionScene.unit}` : ''}
                    {productionScene.shootDay ? `, day ${productionScene.shootDay}` : ''}
                  </Text>
                )}
                {shot.notes && (
                  <div className="flex flex-col gap-1">
                    <p className="text-label-0-bold text-foreground-dim uppercase">Production notes</p>
                    <Text variant="body-1" color="primary">{shot.notes}</Text>
                  </div>
                )}
              </div>
            </div>

            {/* Source files */}
            {otherFiles.length > 0 && (
              <section className="flex flex-col gap-3">
                <h3 className="text-heading-4 font-bold">Source files</h3>
                <CardGrid columns={4} gap="4">
                  {otherFiles.map(asset => (
                    <AssetCard key={asset.id} asset={asset} showTags showDepartment={false} />
                  ))}
                </CardGrid>
              </section>
            )}
          </Stack>
        </div>
      </div>
    </div>
  )
}
