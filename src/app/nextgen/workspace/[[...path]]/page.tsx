import { WorkspaceView } from '../workspace-view'

interface Props {
  params: Promise<{ path?: string[] }>
}

export default async function WorkspacePage({ params }: Props) {
  const { path } = await params
  return <WorkspaceView folderPath={path ?? []} />
}
