import { notFound } from 'next/navigation'
import { WorkspaceView } from '../workspace-view'
import type { DepartmentId } from '@/components/department/types'

const VALID_DEPARTMENTS: DepartmentId[] = [
  'art-design',
  'camera',
  'editorial',
  'vfx',
  'audio-sound',
]

interface Props {
  params: Promise<{ path?: string[] }>
}

export default async function WorkspacePage({ params }: Props) {
  const { path } = await params

  // No path segments → workspace landing with department folders
  if (!path || path.length === 0) {
    return <WorkspaceView folderPath={[]} />
  }

  // First segment must be a valid department ID
  const departmentId = path[0] as DepartmentId
  if (!VALID_DEPARTMENTS.includes(departmentId)) {
    // Not a department — treat as a workspace-level transient folder on the landing page
    return <WorkspaceView folderPath={[]} landingFolderId={path[0]} />
  }

  // Remaining segments are the folder path within the department
  const folderPath = path.slice(1)

  return <WorkspaceView departmentId={departmentId} folderPath={folderPath} />
}
