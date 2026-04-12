import { useState, useMemo, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  ChevronRight,
  ChevronDown,
  Plus,
  PlusCircle,
  Trash2,
  GripVertical,
  CalendarIcon,
  Download,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'

export interface TaskNode {
  id: string
  title: string
  status: string
  parent_task?: string | null
  responsible?: string | null
  due_date?: string | null
  created: string
  children: TaskNode[]
}

const buildTree = (tasks: any[]): TaskNode[] => {
  const map = new Map<string, TaskNode>()
  const roots: TaskNode[] = []

  tasks.forEach((t) => {
    map.set(t.id, {
      ...t,
      children: [],
    })
  })

  const sorted = Array.from(map.values()).sort(
    (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime(),
  )

  sorted.forEach((node) => {
    if (node.parent_task && map.has(node.parent_task)) {
      map.get(node.parent_task)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

const flattenTree = (
  nodes: TaskNode[],
  depth = 0,
  expandedIds: Set<string>,
): { task: TaskNode; depth: number }[] => {
  let result: { task: TaskNode; depth: number }[] = []
  for (const node of nodes) {
    result.push({ task: node, depth })
    if (expandedIds.has(node.id) && node.children?.length > 0) {
      result = result.concat(flattenTree(node.children, depth + 1, expandedIds))
    }
  }
  return result
}

export function ProjectTreeGrid({ projectId }: { projectId: string }) {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<TaskNode[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{
    id: string
    position: 'before' | 'after' | 'inside'
  } | null>(null)

  const loadData = async () => {
    try {
      const [pbTasks, pbUsers] = await Promise.all([
        pb.collection('tasks').getFullList({ filter: `project = "${projectId}"`, sort: 'created' }),
        pb.collection('users').getFullList({ sort: 'name' }),
      ])
      setUsers(pbUsers)
      const tree = buildTree(pbTasks)
      setTasks(tree)
      if (expandedIds.size === 0) setExpandedIds(new Set(tree.map((t) => t.id)))
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar tarefas.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [projectId])

  useRealtime('tasks', loadData)

  const getNode = (id: string, nodes: TaskNode[] = tasks): TaskNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n
      const found = getNode(id, n.children)
      if (found) return found
    }
    return null
  }

  const updateProgress = async () => {
    try {
      const pbTasks = await pb
        .collection('tasks')
        .getFullList({ filter: `project = "${projectId}"` })
      const total = pbTasks.length
      const concluidaCount = pbTasks.filter((t) => t.status === 'Concluído').length
      const progress = total > 0 ? Math.round((concluidaCount / total) * 100) : 0
      await pb.collection('projects').update(projectId, { progress })
    } catch (e) {
      console.error('Error updating progress', e)
    }
  }

  const handleAddTask = async (pid?: string) => {
    const title = window.prompt('Nome da tarefa:')
    if (!title) return
    try {
      await pb.collection('tasks').create({
        project: projectId,
        title,
        status: 'Pendente',
        parent_task: pid || '',
      })
      if (pid) setExpandedIds((prev) => new Set(prev).add(pid))
      await updateProgress()
    } catch {
      toast({ title: 'Erro ao criar tarefa', variant: 'destructive' })
    }
  }

  const handleDel = async (id: string) => {
    if (!window.confirm('Excluir esta tarefa e suas subtarefas?')) return
    try {
      await pb.collection('tasks').delete(id)
      await updateProgress()
    } catch {
      toast({ title: 'Erro ao excluir tarefa', variant: 'destructive' })
    }
  }

  const handleUpd = async (id: string, data: any) => {
    setTasks((prev) => {
      const updateNode = (nodes: TaskNode[]): TaskNode[] => {
        return nodes.map((n) => {
          if (n.id === id) return { ...n, ...data }
          if (n.children) return { ...n, children: updateNode(n.children) }
          return n
        })
      }
      return updateNode(prev)
    })

    try {
      await pb.collection('tasks').update(id, data)
      toast({ description: 'Tarefa atualizada.', duration: 2000 })
      if ('status' in data) {
        await updateProgress()
      }
    } catch {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
      loadData()
    }
  }

  const handleDrop = async (
    dragId: string,
    targetId: string,
    pos: 'before' | 'after' | 'inside',
  ) => {
    const target = getNode(targetId)
    if (!target) return
    let curr: TaskNode | null = target
    while (curr) {
      if (curr.id === dragId) {
        toast({
          title: 'Ação inválida',
          description: 'Não é possível mover para dentro de si mesma.',
          variant: 'destructive',
        })
        return
      }
      curr = curr.parent_task ? getNode(curr.parent_task) : null
    }

    let newParentId = target.parent_task || ''

    if (pos === 'inside') {
      newParentId = target.id
      setExpandedIds((prev) => new Set(prev).add(target.id))
    }

    try {
      await pb.collection('tasks').update(dragId, { parent_task: newParentId })
      loadData()
    } catch {
      toast({ title: 'Erro ao mover tarefa', variant: 'destructive' })
    }
  }

  const flatNodes = useMemo(() => flattenTree(tasks, 0, expandedIds), [tasks, expandedIds])

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Carregando tarefas...
      </div>
    )

  const isOverdue = (dueDate: string | null | undefined) => {
    if (!dueDate) return false
    const date = new Date(dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date.getTime() < today.getTime()
  }

  const [filter, setFilter] = useState<'todas' | 'aberto' | 'concluidas' | 'pendentes'>('todas')

  const visibleNodes = useMemo(() => {
    return flatNodes.filter(({ task }) => {
      if (filter === 'todas') return true
      if (filter === 'aberto') return task.status !== 'Concluído'
      if (filter === 'concluidas') return task.status === 'Concluído'
      if (filter === 'pendentes') return task.status !== 'Concluído' && isOverdue(task.due_date)
      return true
    })
  }, [flatNodes, filter])

  const handleExportCSV = () => {
    const exportData = visibleNodes.map(({ task }) => ({
      ...task,
      responsibleName: users.find((u) => u.id === task.responsible)?.name || '',
    }))
    import('@/lib/export').then((m) => m.exportTasksCSV(exportData, 'Projeto'))
  }

  const handleExportPDF = () => {
    const exportData = visibleNodes.map(({ task }) => ({
      ...task,
      responsibleName: users.find((u) => u.id === task.responsible)?.name || '',
    }))
    import('@/lib/exportPdf').then((m) => m.exportTasksPDF(exportData, 'Projeto', 'Usuário Local'))
  }

  return (
    <div className="flex flex-col h-[500px] sm:h-[600px] bg-white dark:bg-slate-950 border rounded-lg shadow-sm overflow-hidden">
      <div className="p-3 border-b flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 rounded-md border shadow-sm">
          <Button
            variant={filter === 'todas' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('todas')}
            className="h-7 text-xs"
          >
            Todas
          </Button>
          <Button
            variant={filter === 'aberto' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('aberto')}
            className="h-7 text-xs"
          >
            Em aberto
          </Button>
          <Button
            variant={filter === 'concluidas' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('concluidas')}
            className="h-7 text-xs"
          >
            Concluídas
          </Button>
          <Button
            variant={filter === 'pendentes' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('pendentes')}
            className="h-7 text-xs"
          >
            Pendentes
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-2">
                <Download className="h-3 w-3" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>Exportar CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>Exportar PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <Table className="w-full relative">
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 shadow-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="border-r border-b min-w-[250px] w-full">Tarefa</TableHead>
              <TableHead className="border-r border-b w-[200px]">Responsável</TableHead>
              <TableHead className="border-r border-b w-[160px]">Data de Entrega</TableHead>
              <TableHead className="border-r border-b w-[140px]">Status</TableHead>
              <TableHead className="border-b w-[50px] p-0 text-center"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleNodes.map(({ task, depth }) => {
              const isDropTarget = dropTarget?.id === task.id
              const dropPos = dropTarget?.position
              return (
                <TableRow
                  key={task.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move'
                    setTimeout(() => setDraggedId(task.id), 0)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (draggedId === task.id) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    const y = e.clientY - rect.top
                    let pos: 'before' | 'after' | 'inside' = 'inside'
                    if (y < rect.height * 0.25) pos = 'before'
                    else if (y > rect.height * 0.75) pos = 'after'
                    setDropTarget({ id: task.id, position: pos })
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (dropTarget && draggedId && draggedId !== dropTarget.id)
                      handleDrop(draggedId, dropTarget.id, dropTarget.position)
                    setDropTarget(null)
                    setDraggedId(null)
                  }}
                  onDragEnd={() => {
                    setDraggedId(null)
                    setDropTarget(null)
                  }}
                  className={cn(
                    'group hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-grab active:cursor-grabbing',
                    draggedId === task.id && 'opacity-50',
                    isDropTarget && dropPos === 'inside' && 'bg-primary/10 dark:bg-primary/20',
                  )}
                >
                  <TableCell
                    className={cn(
                      'border-r border-b p-2',
                      isDropTarget && dropPos === 'before' && 'border-t-2 border-t-primary',
                      isDropTarget && dropPos === 'after' && 'border-b-2 border-b-primary',
                    )}
                  >
                    <div
                      className="flex items-center gap-2"
                      style={{ paddingLeft: `${depth * 20}px` }}
                    >
                      <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab shrink-0" />
                      <Checkbox
                        checked={task.status === 'Concluído'}
                        onCheckedChange={(c) =>
                          handleUpd(task.id, { status: c ? 'Concluído' : 'Pendente' })
                        }
                      />
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {task.children.length > 0 && (
                          <button
                            onClick={() =>
                              setExpandedIds((p) => {
                                const n = new Set(p)
                                if (n.has(task.id)) n.delete(task.id)
                                else n.add(task.id)
                                return n
                              })
                            }
                            className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                          >
                            {expandedIds.has(task.id) ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                      <span className="text-sm flex-1 truncate font-medium">{task.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                        onClick={() => handleAddTask(task.id)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>

                  {/* Responsável Column */}
                  <TableCell className="border-r border-b p-1">
                    <Select
                      value={task.responsible || 'unassigned'}
                      onValueChange={(val) =>
                        handleUpd(task.id, { responsible: val === 'unassigned' ? '' : val })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent w-full px-2 shadow-none">
                        <SelectValue placeholder="Sem responsável" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem
                          value="unassigned"
                          className="text-muted-foreground italic text-xs"
                        >
                          Sem responsável
                        </SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id} className="text-xs">
                            <div className="flex items-center gap-2">
                              <img
                                src={
                                  u.avatar
                                    ? pb.files.getUrl(u, u.avatar)
                                    : `https://img.usecurling.com/ppl/thumbnail?seed=${u.id}`
                                }
                                className="w-4 h-4 rounded-full object-cover shrink-0"
                                alt=""
                              />
                              <span className="truncate">{u.name || u.email || 'Usuário'}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Due Date Column */}
                  <TableCell className="border-r border-b p-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            'h-8 text-xs w-full justify-start text-left font-normal border-transparent hover:border-input px-2 shadow-none',
                            !task.due_date && 'text-muted-foreground',
                            task.status !== 'Concluído' &&
                              isOverdue(task.due_date) &&
                              'text-red-500 font-medium',
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3 shrink-0" />
                          {task.due_date ? (
                            format(new Date(task.due_date), 'dd/MM/yyyy')
                          ) : (
                            <span>Definir data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={task.due_date ? new Date(task.due_date) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const d = new Date(date)
                              d.setHours(12, 0, 0, 0)
                              handleUpd(task.id, { due_date: d.toISOString() })
                            } else {
                              handleUpd(task.id, { due_date: '' })
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </TableCell>

                  {/* Status Column */}
                  <TableCell className="border-r border-b p-1">
                    <Select
                      value={task.status || 'Pendente'}
                      onValueChange={(val) => handleUpd(task.id, { status: val })}
                    >
                      <SelectTrigger className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent w-full px-2 shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente" className="text-xs">
                          Pendente
                        </SelectItem>
                        <SelectItem value="Em Andamento" className="text-xs">
                          Em Andamento
                        </SelectItem>
                        <SelectItem value="Concluído" className="text-xs">
                          Concluído
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell className="border-b p-1 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
                      onClick={() => handleDel(task.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
            {visibleNodes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Nenhuma tarefa encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="p-3 border-t bg-slate-50 dark:bg-slate-900/50 flex items-center shrink-0">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => handleAddTask()}>
          <PlusCircle className="w-4 h-4 text-primary" /> Adicionar Tarefa Raiz
        </Button>
      </div>
    </div>
  )
}
