import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { CheckSquare } from 'lucide-react'

export function InternalTasksChecklist({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = async () => {
    try {
      const records = await pb.collection('tasks').getFullList({
        filter: `project = "${projectId}" && is_internal = true`,
        sort: 'ordem,created',
      })
      setTasks(records)
    } catch (err) {
      console.error('Failed to fetch internal tasks', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) fetchTasks()
  }, [projectId])

  useRealtime('tasks', () => {
    fetchTasks()
  })

  const toggleStatus = async (task: any) => {
    const isCompleted = task.status === 'Concluído'

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: isCompleted ? 'Pendente' : 'Concluído' } : t,
      ),
    )

    try {
      await pb.collection('tasks').update(task.id, {
        status: isCompleted ? 'Pendente' : 'Concluído',
        completed_at: isCompleted ? null : new Date().toISOString(),
      })
    } catch (err) {
      console.error('Failed to toggle task', err)
      // Revert on error
      fetchTasks()
    }
  }

  if (!projectId) return null

  return (
    <Card className="mb-6 w-full shadow-sm">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          Checklist de tarefas internas
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {loading ? (
            <div className="animate-pulse flex space-x-4">
              <div className="h-4 w-4 bg-muted rounded"></div>
              <div className="h-4 w-3/4 bg-muted rounded"></div>
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma tarefa interna configurada para este projeto.
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center space-x-3 group p-1 -mx-1 rounded-md hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.status === 'Concluído'}
                  onCheckedChange={() => toggleStatus(task)}
                  className="mt-0.5"
                />
                <label
                  htmlFor={`task-${task.id}`}
                  className={cn(
                    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none flex-1 py-1',
                    task.status === 'Concluído' && 'line-through text-muted-foreground',
                  )}
                >
                  {task.title}
                </label>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
