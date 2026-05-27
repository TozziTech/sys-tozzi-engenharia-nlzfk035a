import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export function InternalTasksChecklist({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<any[]>([])
  const [newTask, setNewTask] = useState('')
  const { toast } = useToast()

  const loadTasks = async () => {
    try {
      const records = await pb.collection('tasks').getFullList({
        filter: `project = "${projectId}" && is_internal = true`,
        sort: 'created',
      })
      setTasks(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [projectId])

  useRealtime('tasks', (e) => {
    if (e.record.project === projectId && e.record.is_internal) {
      loadTasks()
    }
  })

  const handleAdd = async () => {
    if (!newTask.trim()) return
    try {
      await pb.collection('tasks').create({
        project: projectId,
        title: newTask,
        is_internal: true,
        status: 'Pendente',
      })
      setNewTask('')
    } catch (e) {
      toast({ title: 'Erro ao adicionar tarefa', variant: 'destructive' })
    }
  }

  const toggleTask = async (task: any) => {
    const isCompleted = task.status === 'Concluído'
    try {
      await pb.collection('tasks').update(task.id, {
        status: isCompleted ? 'Pendente' : 'Concluído',
        completed_at: isCompleted ? null : new Date().toISOString(),
      })
    } catch (e) {
      toast({ title: 'Erro ao atualizar tarefa', variant: 'destructive' })
    }
  }

  const deleteTask = async (id: string) => {
    try {
      await pb.collection('tasks').delete(id)
    } catch (e) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Nova tarefa interna..."
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd} size="icon">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 p-2 bg-muted/50 rounded-md group hover:bg-muted/80 transition-colors"
          >
            <Checkbox
              checked={task.status === 'Concluído'}
              onCheckedChange={() => toggleTask(task)}
            />
            <span
              className={cn(
                'flex-1 text-sm transition-all',
                task.status === 'Concluído' && 'line-through text-muted-foreground',
              )}
            >
              {task.title}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 h-6 w-6 text-destructive transition-opacity"
              onClick={() => deleteTask(task.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            Nenhuma tarefa interna cadastrada.
          </p>
        )}
      </div>
    </div>
  )
}
