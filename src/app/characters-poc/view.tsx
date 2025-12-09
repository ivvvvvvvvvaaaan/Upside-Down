'use client'

import { useState } from 'react'
import { Stack, Text, Card, Button, Input, Badge, Divider } from '@/components/ui'
import { Search, Filter, LayoutGrid, List as ListIcon, MoreHorizontal, Image as ImageIcon, Video, File } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Asset } from '@/lib/data'

export function CharactersPocView({ title, assets }: { title: string, assets: Asset[] }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Stack spacing="lg">
        
        {/* Header & Controls */}
        <Stack spacing="md">
          <Stack direction="horizontal" justify="between" align="center">
            <Text variant="headline-1">{title}</Text>
            <Button variant="primary">Upload Assets</Button>
          </Stack>
          
          <Stack direction="horizontal" justify="between" align="center" className="gap-4">
            <div className="w-full max-w-md">
              <Input placeholder="Filter assets..." icon={<Search className="w-4 h-4" />} iconPosition="left" />
            </div>
            <Stack direction="horizontal" spacing="sm" align="center">
              <div className="flex items-center border border-border-subtle rounded-md p-1 bg-surface-0">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn("p-2 rounded-sm transition-colors", viewMode === 'grid' ? "bg-surface-highlight text-foreground shadow-sm" : "text-foreground-dim hover:text-foreground")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn("p-2 rounded-sm transition-colors", viewMode === 'list' ? "bg-surface-highlight text-foreground shadow-sm" : "text-foreground-dim hover:text-foreground")}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
              <Divider orientation="vertical" className="h-6" />
              <Button variant="secondary" icon={<Filter className="w-4 h-4" />}>Filter</Button>
            </Stack>
          </Stack>
        </Stack>

        {/* Content Area */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <Card key={asset.id} padding="none" variant="elevated" className="overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                <div className="aspect-[4/3] bg-surface-highlight flex items-center justify-center relative">
                   {asset.type === 'video' ? <Video className="w-8 h-8 text-foreground-dim" /> : 
                   asset.type === 'file' ? <File className="w-8 h-8 text-foreground-dim" /> :
                   <ImageIcon className="w-8 h-8 text-foreground-dim" />}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button variant="icon" size="icon" className="bg-white/90 dark:bg-black/90"><MoreHorizontal className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div className="p-3">
                  <Stack spacing="xs">
                    <Text variant="body-2" weight="medium" className="truncate">{asset.name}</Text>
                    <Stack direction="horizontal" justify="between" align="center">
                      <Text variant="caption" color="secondary">{asset.size}</Text>
                      <Badge compact color="gray">{asset.format}</Badge>
                    </Stack>
                  </Stack>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card padding="none" variant="outlined">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border-subtle bg-surface-2 text-xs font-medium text-foreground-dim uppercase tracking-wider">
              <div className="col-span-5">Name</div>
              <div className="col-span-3">Type</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <div className="divide-y divide-border-subtle">
              {assets.map((asset) => (
                <div key={asset.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-surface-highlight transition-colors cursor-pointer group">
                  <div className="col-span-5 flex items-center gap-3">
                    {asset.type === 'video' ? <Video className="w-4 h-4 text-purple-400" /> : 
                     asset.type === 'file' ? <File className="w-4 h-4 text-blue-400" /> :
                     <ImageIcon className="w-4 h-4 text-orange-400" />}
                    <Text variant="body-2" weight="medium">{asset.name}</Text>
                  </div>
                  <div className="col-span-3">
                    <Badge compact color="gray">{asset.format}</Badge>
                  </div>
                  <div className="col-span-2">
                    <Text variant="body-2" color="secondary">{asset.size}</Text>
                  </div>
                  <div className="col-span-2 text-right opacity-0 group-hover:opacity-100">
                    <Button variant="icon" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        
      </Stack>
    </div>
  )
}
