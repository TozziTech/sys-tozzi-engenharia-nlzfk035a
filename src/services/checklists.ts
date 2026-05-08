import pb from '@/lib/pocketbase/client'

export const getChecklistTemplates = () =>
  pb.collection('checklist_templates').getFullList({ sort: 'name' })
export const createChecklistTemplate = (data: any) =>
  pb.collection('checklist_templates').create(data)
export const updateChecklistTemplate = (id: string, data: any) =>
  pb.collection('checklist_templates').update(id, data)
export const deleteChecklistTemplate = (id: string) =>
  pb.collection('checklist_templates').delete(id)

export const createChecklistExecution = (data: any) =>
  pb.collection('checklist_executions').create(data)

export const getChecklistExecutions = (options?: any) =>
  pb.collection('checklist_executions').getList(1, 50, { sort: '-created', ...options })
