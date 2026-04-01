import type { DepartmentId } from '@/components/department/types'
import type { AccessEntryKind } from '@/lib/access'

export type SharedResourceRef = {
  resourceId: string
  resourceType: AccessEntryKind
  departmentId?: DepartmentId
}

export function getSharedResourceHref(resource: SharedResourceRef): string | undefined {
  if (resource.resourceType === 'asset') return `/nextgen/assets/${resource.resourceId}`
  if (resource.resourceType === 'collection') return `/nextgen/collections/${resource.resourceId}`
  if (resource.resourceType === 'smart-collection') return `/nextgen/smart-collections/${resource.resourceId}`
  if (resource.resourceType === 'folder') {
    if (!resource.departmentId) return '/nextgen/workspace'
    const deptRoot = `/nextgen/workspace/${resource.departmentId}`
    // Link to the specific folder, not just the department root
    return resource.resourceId ? `${deptRoot}/${resource.resourceId}` : deptRoot
  }

  return undefined
}
