import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Columns, Download, PlusCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { TaskRow, type TaskNode } from './TaskRow'

const buildTree = (tasks: any[]): TaskNode[] => {
  const map = new Map<string, TaskNode>()
  const roots: TaskNode[] = []
  tasks.forEach((t) => map.set(t.id, { ...t, children: [] }))
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

const isOverdue = (dueDate: string | null | undefined) => {
  if (!dueDate) return false
  const date = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() < today.getTime()
}

export function ProjectTreeGrid({ projectId }: { projectId: string }) {
  const { toast } = useToast()
  const [rawTasks, setRawTasks] = useState<any[]>([])
  const [columns, setColumns] = useState({
    tarefa: true,
    responsavel: true,
    dataEntrega: true,
    status: true,
    acoes: true,
  })
  const [users, setUsers] = useState<any[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{
    id: string
    position: 'before' | 'after' | 'inside'
  } | null>(null)
  const [filter, setFilter] = useState<'todas' | 'aberto' | 'concluidas' | 'pendentes'>('todas')

  const loadData = useCallback(async () => {
    try {
      const [pbTasks, pbUsers] = await Promise.all([
        pb.collection('tasks').getFullList({ filter: `project = "${projectId}"`, sort: 'created' }),
        pb.collection('users').getFullList({ sort: 'name' }),
      ])
      setUsers(pbUsers)
      setRawTasks(pbTasks)
      setExpandedIds((prev) => (prev.size === 0 ? new Set(pbTasks.map((t) => t.id)) : prev))
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar tarefas.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [projectId, toast])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('tasks', loadData)

  const tasksTree = useMemo(() => buildTree(rawTasks), [rawTasks])

  const updateProgress = useCallback(async () => {
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
  }, [projectId])

  const handleAddTask = useCallback(
    async (pid?: string) => {
      const title = window.prompt('Nome da tarefa:')
      if (!title) return
      try {
        await pb
          .collection('tasks')
          .create({ project: projectId, title, status: 'Pendente', parent_task: pid || '' })
        if (pid) setExpandedIds((prev) => new Set(prev).add(pid))
        await updateProgress()
      } catch {
        toast({ title: 'Erro ao criar tarefa', variant: 'destructive' })
      }
    },
    [projectId, updateProgress, toast],
  )

  const handleDel = useCallback(
    async (id: string) => {
      if (!window.confirm('Excluir esta tarefa e suas subtarefas?')) return
      try {
        await pb.collection('tasks').delete(id)
        await updateProgress()
      } catch {
        toast({ title: 'Erro ao excluir tarefa', variant: 'destructive' })
      }
    },
    [updateProgress, toast],
  )

  const handleUpd = useCallback(
    async (id: string, data: any) => {
      setRawTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)))
      try {
        await pb.collection('tasks').update(id, data)
        if ('status' in data) await updateProgress()
      } catch {
        toast({ title: 'Erro ao atualizar', variant: 'destructive' })
        loadData()
      }
    },
    [updateProgress, toast, loadData],
  )

  const getNode = useCallback(
    (id: string, nodes: TaskNode[] = tasksTree): TaskNode | null => {
      for (const n of nodes) {
        if (n.id === id) return n
        const found = getNode(id, n.children)
        if (found) return found
      }
      return null
    },
    [tasksTree],
  )

  const handleDropEvent = useCallback(
    async (dragId: string, targetId: string, pos: 'before' | 'after' | 'inside') => {
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

      setRawTasks((prev) =>
        prev.map((t) => (t.id === dragId ? { ...t, parent_task: newParentId } : t)),
      )

      try {
        await pb.collection('tasks').update(dragId, { parent_task: newParentId })
      } catch {
        toast({ title: 'Erro ao mover tarefa', variant: 'destructive' })
        loadData()
      }
    },
    [getNode, loadData, toast],
  )

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((p) => {
      const n = new Set(p)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }, [])

  const onDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => setDraggedId(id), 0)
  }, [])

  const onDragOver = useCallback(
    (e: React.DragEvent, id: string) => {
      e.preventDefault()
      if (draggedId === id) return
      const rect = e.currentTarget.getBoundingClientRect()
      const y = e.clientY - rect.top
      let pos: 'before' | 'after' | 'inside' = 'inside'
      if (y < rect.height * 0.25) pos = 'before'
      else if (y > rect.height * 0.75) pos = 'after'
      setDropTarget({ id, position: pos })
    },
    [draggedId],
  )

  const onDrop = useCallback(
    (e: React.DragEvent, id: string) => {
      e.preventDefault()
      if (dropTarget && draggedId && draggedId !== dropTarget.id) {
        handleDropEvent(draggedId, dropTarget.id, dropTarget.position)
      }
      setDropTarget(null)
      setDraggedId(null)
    },
    [dropTarget, draggedId, handleDropEvent],
  )

  const onDragEnd = useCallback(() => {
    setDraggedId(null)
    setDropTarget(null)
  }, [])

  const flatNodes = useMemo(() => flattenTree(tasksTree, 0, expandedIds), [tasksTree, expandedIds])

  const visibleNodes = useMemo(
    () =>
      flatNodes.filter(({ task }) => {
        if (filter === 'todas') return true
        if (filter === 'aberto') return task.status !== 'Concluído'
        if (filter === 'concluidas') return task.status === 'Concluído'
        if (filter === 'pendentes') return task.status !== 'Concluído' && isOverdue(task.due_date)
        return true
      }),
    [flatNodes, filter],
  )

  const handleExportCSV = useCallback(() => {
    const exportData = visibleNodes.map(({ task }) => ({
      ...task,
      responsibleName: users.find((u) => u.id === task.responsible)?.name || '',
    }))
    import('@/lib/export').then((m) => m.exportTasksCSV(exportData, 'Projeto'))
  }, [visibleNodes, users])

  const handleExportPDF = useCallback(() => {
    const exportData = visibleNodes.map(({ task }) => ({
      ...task,
      responsibleName: users.find((u) => u.id === task.responsible)?.name || '',
    }))
    import('@/lib/exportPdf').then((m) => m.exportTasksPDF(exportData, 'Projeto', 'Usuário Local'))
  }, [visibleNodes, users])

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Carregando tarefas...
      </div>
    )

  return (
    <div className="flex flex-col h-[500px] sm:h-[600px] bg-white dark:bg-slate-950 border rounded-lg shadow-sm overflow-hidden">
      <div className="p-3 border-b flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 rounded-md border shadow-sm">
          {(['todas', 'aberto', 'concluidas', 'pendentes'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(f)}
              className="h-7 text-xs capitalize"
            >
              {f === 'todas'
                ? 'Todas'
                : f === 'aberto'
                  ? 'Em aberto'
                  : f === 'concluidas'
                    ? 'Concluídas'
                    : 'Pendentes'}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-2">
                <Columns className="h-3 w-3" />
                Colunas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.keys(columns).map((k) => (
                <DropdownMenuCheckboxItem
                  key={k}
                  checked={columns[k as keyof typeof columns]}
                  onCheckedChange={(v) => setColumns((p) => ({ ...p, [k]: v }))}
                  className="capitalize"
                >
                  {k === 'dataEntrega' ? 'Data de Entrega' : k}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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
              {columns.tarefa && (
                <TableHead className="border-r border-b min-w-[250px] w-full">Tarefa</TableHead>
              )}
              {columns.responsavel && (
                <TableHead className="border-r border-b w-[200px]">Responsável</TableHead>
              )}
              {columns.dataEntrega && (
                <TableHead className="border-r border-b w-[160px]">Data de Entrega</TableHead>
              )}
              {columns.status && (
                <TableHead className="border-r border-b w-[140px]">Status</TableHead>
              )}
              {columns.acoes && (
                <TableHead className="border-b w-[50px] p-0 text-center"></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleNodes.map(({ task, depth }) => (
              <TaskRow
                key={task.id}
                task={task}
                depth={depth}
                columns={columns}
                users={users}
                isExpanded={expandedIds.has(task.id)}
                draggedId={draggedId}
                dropTarget={dropTarget}
                onAdd={handleAddTask}
                onUpdate={handleUpd}
                onDelete={handleDel}
                onToggleExpand={handleToggleExpand}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                isOverdue={isOverdue}
              />
            ))}
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
