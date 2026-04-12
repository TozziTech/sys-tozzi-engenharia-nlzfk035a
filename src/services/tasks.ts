import pb from '@/lib/pocketbase/client'
import { addDays } from 'date-fns'

export const getModuleTasks = async (moduleId: string) => {
  return pb.collection('tasks').getFullList({
    filter: `module = "${moduleId}"`,
    expand: 'responsible,parent_task,project,module',
  })
}

export const getDeadlineTasks = async () => {
  const today = new Date()
  const nextWeek = addDays(today, 7)
  const nextWeekStr = nextWeek.toISOString().replace('T', ' ')

  return pb.collection('tasks').getFullList({
    filter: `due_date != "" && due_date <= "${nextWeekStr}" && status != "Concluído"`,
    expand: 'project,module,responsible',
    sort: 'due_date',
  })
}

export const updateTaskStatus = async (taskId: string, status: string) => {
  return pb.collection('tasks').update(taskId, { status })
}
