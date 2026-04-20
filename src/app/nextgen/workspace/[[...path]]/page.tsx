import { WorkspaceView } from '../workspace-view'

interface Props {
  params: { path?: string[] }
}

export default function WorkspacePage({ params }: Props) {
  const { path } = params

  // No path segments → workspace landing with accessible root folders
  if (!path || path.length === 0) {
    return <WorkspaceView folderPath={[]} />
  }

  return <WorkspaceView folderPath={path.slice(1)} landingFolderId={path[0]} />
}
