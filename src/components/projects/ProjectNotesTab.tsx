import { InternalTasksChecklist } from './InternalTasksChecklist'
import { ProjectNotesManager } from './ProjectNotesManager'

export function ProjectNotesTab({ projectId }: { projectId: string }) {
  if (!projectId) return null

  return (
    <div className="space-y-6 w-full animate-fade-in">
      <InternalTasksChecklist projectId={projectId} />
      <ProjectNotesManager projectId={projectId} />
    </div>
  )
}
