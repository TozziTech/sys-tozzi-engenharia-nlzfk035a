import { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2, GripVertical } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface InternalTask {
  id: string
  title: string
  status: string
  priority: string
  ordem: number
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
  const [newPriority, setNewPriority] = useState('Média')
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)

  const loadTasks = useCallback(async () => {
    if (!projectId || !pb.authStore.isValid) return
    try {
      const records = await pb.collection('tasks').getFullList({
        filter: `project = "${projectId}" && is_internal = true`,
        sort: 'ordem,created',
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
      const maxOrdem = tasks.reduce((max, t) => Math.max(max, t.ordem || 0), -1)
      await pb.collection('tasks').create({
        title: newTaskTitle.trim(),
        project: projectId,
        status: 'Pendente',
        priority: newPriority,
        ordem: maxOrdem + 1,
        is_internal: true,
      })
      setNewTaskTitle('')
      setNewPriority('Média')
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

  const handleUpdatePriority = async (task: InternalTask, priority: string) => {
    try {
      await pb.collection('tasks').update(task.id, { priority })
    } catch (error) {
      toast({ title: 'Erro ao atualizar prioridade', variant: 'destructive' })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgente':
        return 'bg-red-500 hover:bg-red-600 text-white border-red-600 focus:ring-red-500'
      case 'Alta':
        return 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 focus:ring-amber-500'
      case 'Média':
        return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600 focus:ring-blue-500'
      case 'Baixa':
        return 'bg-slate-500 hover:bg-slate-600 text-white border-slate-600 focus:ring-slate-500'
      default:
        return 'bg-slate-500 hover:bg-slate-600 text-white border-slate-600'
    }
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id)
    e.dataTransfer.effectAllowed = 'move'

    const target = e.target as HTMLElement
    setTimeout(() => {
      target.style.opacity = '0.5'
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTaskId(null)
    setDragOverTaskId(null)
    const target = e.target as HTMLElement
    target.style.opacity = '1'
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id !== dragOverTaskId) {
      setDragOverTaskId(id)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const target = e.currentTarget as HTMLElement
    target.style.opacity = '1'

    if (!draggedTaskId || draggedTaskId === targetId) {
      setDragOverTaskId(null)
      return
    }

    const draggedIndex = tasks.findIndex((t) => t.id === draggedTaskId)
    const targetIndex = tasks.findIndex((t) => t.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDragOverTaskId(null)
      return
    }

    const newTasks = [...tasks]
    const [draggedItem] = newTasks.splice(draggedIndex, 1)
    newTasks.splice(targetIndex, 0, draggedItem)

    const updatedTasks = newTasks.map((t, idx) => ({ ...t, ordem: idx }))
    setTasks(updatedTasks)
    setDragOverTaskId(null)
    setDraggedTaskId(null)

    try {
      await Promise.all(
        updatedTasks.map((t) => pb.collection('tasks').update(t.id, { ordem: t.ordem })),
      )
    } catch (error) {
      toast({ title: 'Erro ao reordenar', variant: 'destructive' })
      loadTasks()
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
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
    <Card className="w-full flex flex-col shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Checklist de Tarefas Internas</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Adicionar nova tarefa interna..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="flex gap-2 shrink-0">
            <Select value={newPriority} onValueChange={setNewPriority}>
              <SelectTrigger className="h-9 w-[130px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Baixa">Baixa</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" size="sm" disabled={!newTaskTitle.trim()} className="h-9">
              Adicionar
            </Button>
          </div>
        </form>

        <div className="space-y-2 mt-2 flex-1 overflow-y-auto max-h-[500px] pr-1">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground bg-muted/20 rounded-md border border-dashed">
              Nenhuma tarefa interna registrada para este projeto.
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, task.id)}
                onDrop={(e) => handleDrop(e, task.id)}
                className={cn(
                  'flex flex-col sm:flex-row sm:items-center justify-between group p-2 hover:bg-muted/40 rounded-md border transition-all gap-3',
                  dragOverTaskId === task.id ? 'border-primary border-t-2' : 'border-border',
                  task.status === 'Concluído' ? 'bg-muted/10 opacity-70' : 'bg-card',
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground">
                    <GripVertical className="h-4 w-4" />
                  </div>
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
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground font-medium',
                    )}
                  >
                    {task.title}
                  </label>
                </div>
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto pl-10 sm:pl-0 gap-2 shrink-0">
                  <Select
                    value={task.priority || 'Média'}
                    onValueChange={(val) => handleUpdatePriority(task, val)}
                  >
                    <SelectTrigger
                      className={cn(
                        'h-7 w-[110px] text-xs font-semibold',
                        getPriorityColor(task.priority || 'Média'),
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                      <SelectItem value="Média">Média</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleDelete(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
