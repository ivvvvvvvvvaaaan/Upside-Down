import type { DomainId } from '@/components/department/types'
import type { AccessEntryKind } from '@/lib/access'

export type SharedResourceRef = {
  resourceId: string
  resourceType: AccessEntryKind
  domainId?: DomainId
}

export function getSharedResourceHref(resource: SharedResourceRef): string | undefined {
  if (resource.resourceType === 'asset') return `/nextgen/assets/${resource.resourceId}`
  if (resource.resourceType === 'cut') return `/nextgen/library`
  if (resource.resourceType === 'collection') return `/nextgen/collections/${resource.resourceId}`
  if (resource.resourceType === 'smart-collection') return `/nextgen/collections/${resource.resourceId}`
  if (resource.resourceType === 'folder') {
    const effectiveDomainId = resource.domainId
    if (!effectiveDomainId) return `/nextgen/workspace/${resource.resourceId}`
    return `/nextgen/workspace/${effectiveDomainId}/${resource.resourceId}`
  }

  return undefined
}
