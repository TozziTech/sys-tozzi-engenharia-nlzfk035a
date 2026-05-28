import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export function ObraCronograma({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<any[]>([])

  const fetchTasks = async () => {
    const data = await pb.collection('tasks').getFullList({
      filter: `project = "${projectId}"`,
      sort: 'due_date',
    })
    setTasks(data)
  }

  useEffect(() => {
    fetchTasks()
  }, [projectId])
  useRealtime('tasks', fetchTasks)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cronograma (Tarefas)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <span className="text-xs font-semibold">
                  {task.due_date ? format(new Date(task.due_date), 'dd/MM') : '--'}
                </span>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 shadow-sm bg-card">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-slate-800">{task.title}</div>
                  <Badge variant={task.status === 'Concluído' ? 'default' : 'secondary'}>
                    {task.status || 'Pendente'}
                  </Badge>
                </div>
                <div className="text-slate-500 text-sm line-clamp-2">
                  {task.description || 'Sem descrição'}
                </div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma tarefa associada a esta obra.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
