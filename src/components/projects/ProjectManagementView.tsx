import { InternalTasksChecklist } from './InternalTasksChecklist'
import { ProjectNotesList } from './ProjectNotesList'

export function ProjectManagementView({ projectId }: { projectId: string }) {
  if (!projectId) return null

  return (
    <div className="flex flex-col space-y-8 w-full animate-in fade-in duration-500">
      <InternalTasksChecklist projectId={projectId} />
      <ProjectNotesList projectId={projectId} />
    </div>
  )
}
