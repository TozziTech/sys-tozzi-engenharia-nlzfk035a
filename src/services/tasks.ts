import pb from '@/lib/pocketbase/client'
import { addDays } from 'date-fns'

export const getModuleTasks = async (moduleId: string) => {
  return pb.collection('tasks').getFullList({
    filter: `module = "${moduleId}"`,
    expand: 'parent_task,project,module',
  })
}

export const getDeadlineTasks = async () => {
  const today = new Date()
  const nextWeek = addDays(today, 7)
  const nextWeekStr = nextWeek.toISOString().replace('T', ' ')

  return pb.collection('tasks').getFullList({
    filter: `due_date != "" && due_date <= "${nextWeekStr}" && status != "Concluído"`,
    expand: 'project,module',
    sort: 'due_date',
  })
}

export const updateTaskStatus = async (taskId: string, status: string) => {
  return pb.collection('tasks').update(taskId, { status })
}

export const updateTaskTitle = async (taskId: string, title: string) => {
  return pb.collection('tasks').update(taskId, { title })
}

export const updateTaskDueDate = async (taskId: string, due_date: string | null) => {
  return pb.collection('tasks').update(taskId, { due_date })
}

export const createTask = async (data: any) => {
  return pb.collection('tasks').create(data)
}

export const uploadTaskAttachments = async (taskId: string, files: FileList | File[]) => {
  const formData = new FormData()
  Array.from(files).forEach((file) => formData.append('attachments', file))
  return pb.collection('tasks').update(taskId, formData)
}

export const deleteTaskAttachment = async (taskId: string, filename: string) => {
  return pb.collection('tasks').update(taskId, {
    'attachments-': filename,
  })
}
