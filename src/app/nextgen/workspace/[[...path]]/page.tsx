import { WorkspaceView } from '../workspace-view'
import type { ProductionDomainId } from '@/components/department/types'

const VALID_DOMAINS: ProductionDomainId[] = [
  'art-design',
  'camera',
  'editorial',
  'vfx',
  'audio-sound',
]

interface Props {
  params: { path?: string[] }
}

export default function WorkspacePage({ params }: Props) {
  const { path } = params

  // No path segments → workspace landing with domain folders
  if (!path || path.length === 0) {
    return <WorkspaceView folderPath={[]} />
  }

  // First segment must be a valid domain ID
  const domainId = path[0] as ProductionDomainId
  if (!VALID_DOMAINS.includes(domainId)) {
    // Not a domain — treat as a landing-scoped shared/workspace folder route
    return <WorkspaceView folderPath={path.slice(1)} landingFolderId={path[0]} />
  }

  // Remaining segments are the folder path within the domain
  const folderPath = path.slice(1)

  return <WorkspaceView domainId={domainId} folderPath={folderPath} />
}
