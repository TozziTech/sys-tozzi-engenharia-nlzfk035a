import pb from '@/lib/pocketbase/client'
import { ProjectModule } from '@/types/project_modules'

export const getProjectModules = async (projectId: string) => {
  return pb.collection('project_modules').getFullList<ProjectModule>({
    filter: `project = "${projectId}"`,
    sort: '-created',
  })
}

export const createProjectModule = async (data: Partial<ProjectModule>, userId: string) => {
  const record = await pb.collection('project_modules').create<ProjectModule>(data)

  await pb
    .collection('audit_logs')
    .create({
      user_id: userId,
      action: 'Create',
      resource: 'project_modules',
      details: { module_name: record.name, project_id: record.project },
    })
    .catch(console.error)

  return record
}

export const updateProjectModule = async (
  id: string,
  data: Partial<ProjectModule>,
  userId: string,
) => {
  const record = await pb.collection('project_modules').update<ProjectModule>(id, data)

  await pb
    .collection('audit_logs')
    .create({
      user_id: userId,
      action: 'Update',
      resource: 'project_modules',
      details: { module_name: record.name, project_id: record.project, changes: data },
    })
    .catch(console.error)

  return record
}

export const deleteProjectModule = async (
  id: string,
  moduleName: string,
  projectId: string,
  userId: string,
) => {
  await pb.collection('project_modules').delete(id)

  await pb
    .collection('audit_logs')
    .create({
      user_id: userId,
      action: 'Delete',
      resource: 'project_modules',
      details: { module_name: moduleName, project_id: projectId },
    })
    .catch(console.error)
}
