import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useProjectStore from '@/stores/useProjectStore'
import { useToast } from '@/hooks/use-toast'

type TaskPriority = 'Baixa' | 'Média' | 'Alta'
type TaskStatus = 'A Fazer' | 'Em Andamento' | 'Concluído'

interface KanbanTask {
  id: string
  title: string
  status: TaskStatus
  assigneeId?: number
  deadline: string
  priority: TaskPriority
}

const INITIAL_TASKS: KanbanTask[] = [
  {
    id: '1',
    title: 'Levantamento topográfico',
    status: 'Concluído',
    assigneeId: 1,
    deadline: '2024-03-15',
    priority: 'Alta',
  },
  {
    id: '2',
    title: 'Projeto base',
    status: 'Em Andamento',
    assigneeId: 2,
    deadline: '2024-04-10',
    priority: 'Média',
  },
  {
    id: '3',
    title: 'Aprovação na prefeitura',
    status: 'A Fazer',
    assigneeId: undefined,
    deadline: '2024-05-20',
    priority: 'Alta',
  },
  {
    id: '4',
    title: 'Orçamento preliminar',
    status: 'A Fazer',
    assigneeId: 3,
    deadline: '2024-04-05',
    priority: 'Baixa',
  },
  {
    id: '5',
    title: 'Reunião com cliente',
    status: 'Em Andamento',
    assigneeId: 1,
    deadline: '2024-03-25',
    priority: 'Média',
  },
]

const COLUMNS: TaskStatus[] = ['A Fazer', 'Em Andamento', 'Concluído']

export function KanbanBoard({
  projectName,
  teamMembers,
}: {
  projectName: string
  teamMembers: any[]
}) {
  const { assignTask } = useProjectStore()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<KanbanTask[]>(INITIAL_TASKS)
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false)
  const [newTask, setNewTask] = useState<Partial<KanbanTask>>({
    title: '',
    status: 'A Fazer',
    priority: 'Média',
  })

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('taskId', id)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const onDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)))
  }

  const handleCreateTask = () => {
    if (!newTask.title) return
    const task: KanbanTask = {
      id: Math.random().toString(36).substring(2, 9),
      title: newTask.title,
      status: 'A Fazer',
      priority: newTask.priority || 'Média',
      deadline: newTask.deadline || new Date().toISOString().split('T')[0],
      assigneeId: newTask.assigneeId,
    }
    setTasks([...tasks, task])
    setIsNewTaskOpen(false)
    setNewTask({ title: '', status: 'A Fazer', priority: 'Média' })
    toast({ title: 'Tarefa criada', description: 'Adicionada ao quadro de tarefas.' })

    if (task.assigneeId) {
      const assignee = teamMembers.find((m) => m.id === task.assigneeId)
      if (assignee) assignTask(projectName, task.title, assignee.name)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-card p-4 border rounded-xl shadow-sm">
        <div>
          <h3 className="text-lg font-semibold">Quadro Kanban</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as tarefas do projeto arrastando os cards
          </p>
        </div>
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Ex: Revisar planta"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Select
                    value={newTask.assigneeId?.toString() || 'unassigned'}
                    onValueChange={(v) =>
                      setNewTask({
                        ...newTask,
                        assigneeId: v === 'unassigned' ? undefined : Number(v),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Nenhum</SelectItem>
                      {teamMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id.toString()}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(v) => setNewTask({ ...newTask, priority: v as TaskPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                      <SelectItem value="Média">Média</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prazo</Label>
                <Input
                  type="date"
                  value={newTask.deadline || ''}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateTask}>Criar Tarefa</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex min-h-[500px] w-full gap-4 overflow-x-auto pb-4 snap-x">
        {COLUMNS.map((col) => (
          <div
            key={col}
            className="flex-1 min-w-[300px] snap-center bg-muted/30 rounded-xl p-4 flex flex-col border border-border/40"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, col)}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-sm text-foreground/80 uppercase tracking-wider">
                {col}
              </h4>
              <Badge variant="secondary" className="rounded-full px-2">
                {tasks.filter((t) => t.status === col).length}
              </Badge>
            </div>
            <div className="flex-1 space-y-3">
              {tasks
                .filter((t) => t.status === col)
                .map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, task.id)}
                    className="bg-card border rounded-lg p-4 cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-md transition-all shadow-sm group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant={task.priority === 'Alta' ? 'destructive' : 'secondary'}
                        className={
                          task.priority === 'Média'
                            ? 'bg-amber-500 hover:bg-amber-600 text-white border-transparent'
                            : ''
                        }
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm mb-4 leading-snug">{task.title}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {task.deadline ? task.deadline.split('-').reverse().join('/') : 'S/ Data'}
                      </div>
                      {task.assigneeId && (
                        <div className="h-6 w-6 rounded-full overflow-hidden border border-border bg-muted">
                          <img
                            src={teamMembers.find((m) => m.id === task.assigneeId)?.avatar}
                            alt="Assignee"
                            className="h-full w-full object-cover"
                            title={teamMembers.find((m) => m.id === task.assigneeId)?.name}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              {tasks.filter((t) => t.status === col).length === 0 && (
                <div className="h-24 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-muted-foreground/50 font-medium">
                    Arraste tarefas para cá
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
