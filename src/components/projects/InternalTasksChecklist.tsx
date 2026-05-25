import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, ListTodo } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  status: string
  is_internal: boolean
  ordem: number
  project: string
}

export function InternalTasksChecklist({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [loading, setLoading] = useState(true)

  const loadTasks = async () => {
    if (!projectId) return
    try {
      const records = await pb.collection('tasks').getFullList<Task>({
        filter: `project = '${projectId}' && is_internal = true`,
        sort: 'ordem,-created',
      })
      setTasks(records)
    } catch (error) {
      console.error('Error loading internal tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [projectId])

  useRealtime('tasks', (e) => {
    if (e.action === 'delete') {
      setTasks((prev) => prev.filter((t) => t.id !== e.record.id))
      return
    }

    if (e.record.project === projectId && e.record.is_internal) {
      loadTasks()
    }
  })

  const handleToggle = async (task: Task) => {
    const newStatus = task.status === 'Concluído' ? 'Pendente' : 'Concluído'
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)))
    try {
      await pb.collection('tasks').update(task.id, { status: newStatus })
    } catch (error) {
      loadTasks()
    }
  }

  const handleDelete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    try {
      await pb.collection('tasks').delete(id)
    } catch (error) {
      loadTasks()
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim() || !projectId) return

    const title = newTaskTitle.trim()
    setNewTaskTitle('')
    const maxOrdem = tasks.reduce((max, t) => Math.max(max, t.ordem || 0), 0)

    const tempId = `temp-${Date.now()}`
    const newTask: Task = {
      id: tempId,
      title,
      status: 'Pendente',
      is_internal: true,
      ordem: maxOrdem + 1,
      project: projectId,
    }
    setTasks((prev) => [...prev, newTask])

    try {
      await pb.collection('tasks').create({
        title,
        project: projectId,
        is_internal: true,
        status: 'Pendente',
        ordem: maxOrdem + 1,
      })
    } catch (error) {
      console.error('Error creating internal task:', error)
      loadTasks()
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4 border rounded-lg bg-card animate-pulse mb-6">
        <div className="h-6 w-1/3 bg-muted rounded"></div>
        <div className="h-10 w-full bg-muted rounded mt-2"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-5 border rounded-lg bg-card shadow-sm mb-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
          <ListTodo className="h-5 w-5 text-primary" />
          Checklist de Tarefas Internas
        </h3>
      </div>

      <div className="flex flex-col gap-1">
        {tasks.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center border-2 border-dashed rounded-md bg-muted/10">
            Nenhuma tarefa interna cadastrada para este projeto.
            <br />
            Adicione uma abaixo.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'flex items-center gap-3 p-2 hover:bg-accent/50 rounded-md group transition-all border border-transparent hover:border-border',
                task.id.startsWith('temp-') && 'opacity-50 pointer-events-none',
              )}
            >
              <Checkbox
                checked={task.status === 'Concluído'}
                onCheckedChange={() => handleToggle(task)}
                id={`task-${task.id}`}
                className="h-5 w-5 rounded-sm transition-all"
              />
              <label
                htmlFor={`task-${task.id}`}
                className={cn(
                  'flex-1 text-sm cursor-pointer select-none transition-all duration-200',
                  task.status === 'Concluído'
                    ? 'text-muted-foreground line-through opacity-70'
                    : 'text-foreground font-medium',
                )}
              >
                {task.title}
              </label>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(task.id)}
                title="Excluir tarefa"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAdd} className="flex items-center gap-2 mt-2">
        <Input
          placeholder="Adicionar nova tarefa interna..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-1 bg-background"
        />
        <Button type="submit" size="sm" disabled={!newTaskTitle.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </form>
    </div>
  )
}
