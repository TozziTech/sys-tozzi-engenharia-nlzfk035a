import { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2 } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'

interface InternalTask {
  id: string
  title: string
  status: string
  created: string
}

export function ProjectInternalChecklist({
  projectId,
  enabled,
}: {
  projectId: string
  enabled: boolean
}) {
  const [tasks, setTasks] = useState<InternalTask[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const loadTasks = useCallback(async () => {
    if (!projectId || !pb.authStore.isValid) return
    try {
      const records = await pb.collection('tasks').getFullList({
        filter: `project = "${projectId}" && is_internal = true`,
        sort: 'created',
      })
      setTasks(records as any)
    } catch (error) {
      console.error('Error loading internal tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  useRealtime('tasks', loadTasks, enabled)

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newTaskTitle.trim()) return
    try {
      await pb.collection('tasks').create({
        title: newTaskTitle.trim(),
        project: projectId,
        status: 'Pendente',
        is_internal: true,
      })
      setNewTaskTitle('')
    } catch (error) {
      toast({ title: 'Erro ao criar tarefa', variant: 'destructive' })
    }
  }

  const handleToggle = async (task: InternalTask) => {
    const isCompleted = task.status === 'Concluído'
    const newStatus = isCompleted ? 'Pendente' : 'Concluído'
    const newCompletedAt = isCompleted ? null : new Date().toISOString()
    try {
      await pb.collection('tasks').update(task.id, {
        status: newStatus,
        completed_at: newCompletedAt,
      })
    } catch (error) {
      toast({ title: 'Erro ao atualizar tarefa', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await pb.collection('tasks').delete(id)
    } catch (error) {
      toast({ title: 'Erro ao excluir tarefa', variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Checklist de Tarefas Internas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-9 bg-muted rounded-md w-full"></div>
            <div className="h-12 bg-muted rounded-md w-full"></div>
            <div className="h-12 bg-muted rounded-md w-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Checklist de Tarefas Internas</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Adicionar nova tarefa..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button type="submit" size="sm" disabled={!newTaskTitle.trim()}>
            Adicionar
          </Button>
        </form>

        <div className="space-y-1 mt-2 flex-1 overflow-y-auto max-h-[500px] pr-1">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground bg-muted/20 rounded-md border border-dashed">
              Nenhuma tarefa interna registrada para este projeto.
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between group p-2 hover:bg-muted/40 rounded-md border border-transparent hover:border-border transition-all"
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.status === 'Concluído'}
                    onCheckedChange={() => handleToggle(task)}
                    className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <label
                    htmlFor={`task-${task.id}`}
                    className={cn(
                      'text-sm cursor-pointer select-none flex-1 break-words transition-all duration-200',
                      task.status === 'Concluído'
                        ? 'line-through text-muted-foreground opacity-70'
                        : 'text-foreground font-medium',
                    )}
                  >
                    {task.title}
                  </label>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 shrink-0 ml-2"
                  onClick={() => handleDelete(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
