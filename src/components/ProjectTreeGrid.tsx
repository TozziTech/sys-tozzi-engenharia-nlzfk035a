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
import { Columns, Download, PlusCircle, Plus, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
export interface TaskNode {
  id: string
  projeto_id: string
  titulo: string
  concluida: boolean
  dados_customizados?: any
  created: string
  updated: string
  parent_id?: string
  parent_task?: string
  ordem?: number
  descricao?: string
  children: TaskNode[]
}

const buildTree = (tasks: any[]): TaskNode[] => {
  const map = new Map<string, TaskNode>()
  const roots: TaskNode[] = []
  tasks.forEach((t) => map.set(t.id, { ...t, children: [] }))
  const sorted = Array.from(map.values()).sort((a, b) => {
    const orderA = a.ordem ?? 999999
    const orderB = b.ordem ?? 999999
    if (orderA !== orderB) return orderA - orderB
    return new Date(a.created).getTime() - new Date(b.created).getTime()
  })
  sorted.forEach((node) => {
    const pid = node.parent_id || node.parent_task
    if (pid && map.has(pid)) {
      map.get(pid)!.children.push(node)
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
  const [selectedTask, setSelectedTask] = useState<any>(null)

  const [customColumns, setCustomColumns] = useState<any[]>([])
  const [isAddColOpen, setIsAddColOpen] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [colError, setColError] = useState('')
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [columnToDelete, setColumnToDelete] = useState<any | null>(null)

  const loadColumns = useCallback(async () => {
    try {
      const cols = await pb
        .collection('colunas_projeto')
        .getFullList({ filter: `projeto_id = "${projectId}"`, sort: 'created' })
      setCustomColumns(cols)
    } catch (e) {
      console.error(e)
    }
  }, [projectId])

  const loadData = useCallback(async () => {
    try {
      const [pbTasks, pbUsers] = await Promise.all([
        pb
          .collection('tarefas_hierarquicas')
          .getFullList({ filter: `projeto_id = "${projectId}"`, sort: 'ordem,created' }),
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
    loadColumns()
    loadData()
  }, [loadColumns, loadData])

  useRealtime('tarefas_hierarquicas', loadData)
  useRealtime('colunas_projeto', loadColumns)

  const tasksTree = useMemo(() => buildTree(rawTasks), [rawTasks])

  const updateProgress = useCallback(async () => {
    try {
      const pbTasks = await pb
        .collection('tarefas_hierarquicas')
        .getFullList({ filter: `projeto_id = "${projectId}"` })
      const total = pbTasks.length
      const concluidaCount = pbTasks.filter((t) => t.concluida).length
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
          .collection('tarefas_hierarquicas')
          .create({ projeto_id: projectId, titulo: title, concluida: false, parent_id: pid || '' })
        if (pid) setExpandedIds((prev) => new Set(prev).add(pid))
        await updateProgress()
      } catch {
        toast({ title: 'Erro ao criar tarefa', variant: 'destructive' })
      }
    },
    [projectId, updateProgress, toast],
  )

  const handleDel = useCallback((id: string) => {
    setTaskToDelete(id)
  }, [])

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return
    try {
      const deleteRecursively = async (taskId: string) => {
        const children = rawTasks.filter((t) => t.parent_id === taskId || t.parent_task === taskId)
        for (const child of children) {
          await deleteRecursively(child.id)
        }
        await pb.collection('tarefas_hierarquicas').delete(taskId)
      }
      await deleteRecursively(taskToDelete)
      await updateProgress()
      toast({ title: 'Tarefa excluída com sucesso' })
    } catch {
      toast({ title: 'Erro ao excluir tarefa', variant: 'destructive' })
    } finally {
      setTaskToDelete(null)
    }
  }

  const confirmDeleteColumn = async () => {
    if (!columnToDelete) return
    try {
      await pb.collection('colunas_projeto').delete(columnToDelete.id)
      toast({ title: 'Coluna excluída com sucesso' })
      loadColumns()
    } catch {
      toast({ title: 'Erro ao excluir coluna', variant: 'destructive' })
    } finally {
      setColumnToDelete(null)
    }
  }

  const handleUpd = useCallback(
    async (id: string, data: any) => {
      setRawTasks((prev) =>
        prev.map((t) => {
          if (t.id === id) {
            const merged = { ...t, ...data }
            if (data.dados_customizados) {
              merged.dados_customizados = {
                ...(t.dados_customizados || {}),
                ...data.dados_customizados,
              }
            }
            return merged
          }
          return t
        }),
      )
      try {
        const taskToUpdate = rawTasks.find((t) => t.id === id)
        const payload = { ...data }
        if (data.dados_customizados) {
          payload.dados_customizados = {
            ...(taskToUpdate?.dados_customizados || {}),
            ...data.dados_customizados,
          }
        }
        await pb.collection('tarefas_hierarquicas').update(id, payload)
        if ('concluida' in data) await updateProgress()
      } catch {
        toast({ title: 'Erro ao atualizar', variant: 'destructive' })
        loadData()
      }
    },
    [rawTasks, updateProgress, toast, loadData],
  )

  const handleAddColumn = async () => {
    if (!newColName.trim()) {
      setColError('O nome da coluna é obrigatório')
      return
    }
    try {
      await pb.collection('colunas_projeto').create({
        projeto_id: projectId,
        nome: newColName.trim(),
        tipo_dado: 'Texto Livre',
      })
      setIsAddColOpen(false)
      setNewColName('')
      toast({ title: 'Coluna criada com sucesso' })
    } catch {
      toast({ title: 'Erro ao criar coluna', variant: 'destructive' })
    }
  }

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

      let newParentId = target.parent_id || target.parent_task || ''
      if (pos === 'inside') {
        newParentId = target.id
        setExpandedIds((prev) => new Set(prev).add(target.id))
      }

      setRawTasks((prev) =>
        prev.map((t) => (t.id === dragId ? { ...t, parent_id: newParentId } : t)),
      )

      try {
        await pb.collection('tarefas_hierarquicas').update(dragId, { parent_id: newParentId })
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
        const isDone = task.concluida
        const dueDate = task.dados_customizados?.due_date

        if (filter === 'todas') return true
        if (filter === 'aberto') return !isDone
        if (filter === 'concluidas') return isDone
        if (filter === 'pendentes') return !isDone && isOverdue(dueDate)
        return true
      }),
    [flatNodes, filter],
  )

  const handleExportCSV = useCallback(() => {
    const exportData = visibleNodes.map(({ task }) => ({
      ...task,
      responsibleName: users.find((u) => u.id === task.dados_customizados?.responsible)?.name || '',
    }))
    import('@/lib/export').then((m) => m.exportTasksCSV(exportData, 'Projeto'))
  }, [visibleNodes, users])

  const handleExportPDF = useCallback(() => {
    const exportData = visibleNodes.map(({ task }) => ({
      ...task,
      responsibleName: users.find((u) => u.id === task.dados_customizados?.responsible)?.name || '',
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => handleAddTask()} size="sm" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Nova Tarefa
          </Button>
          <div className="flex rounded-md border border-input p-1 bg-muted/50">
            {(['todas', 'aberto', 'concluidas', 'pendentes'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Columns className="h-4 w-4" />
                Colunas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuCheckboxItem
                checked={columns.tarefa}
                onCheckedChange={(c) => setColumns((p) => ({ ...p, tarefa: c }))}
              >
                Tarefa
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columns.responsavel}
                onCheckedChange={(c) => setColumns((p) => ({ ...p, responsavel: c }))}
              >
                Responsável
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columns.dataEntrega}
                onCheckedChange={(c) => setColumns((p) => ({ ...p, dataEntrega: c }))}
              >
                Data de Entrega
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columns.status}
                onCheckedChange={(c) => setColumns((p) => ({ ...p, status: c }))}
              >
                Status
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={handleExportCSV} title="Exportar CSV">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.tarefa && <TableHead className="w-[40%]">Tarefa</TableHead>}
              {columns.responsavel && <TableHead>Responsável</TableHead>}
              {columns.dataEntrega && <TableHead>Data de Entrega</TableHead>}
              {columns.status && <TableHead>Status</TableHead>}
              {columns.acoes && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleNodes.length > 0 ? (
              visibleNodes.map(({ task, depth }) => (
                <TableRow key={task.id}>
                  {columns.tarefa && (
                    <TableCell>
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: `${depth * 1.5}rem` }}
                      >
                        {task.children?.length > 0 ? (
                          <button
                            onClick={() => handleToggleExpand(task.id)}
                            className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            {expandedIds.has(task.id) ? '-' : '+'}
                          </button>
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                        <span className="font-medium text-sm">{task.titulo}</span>
                      </div>
                    </TableCell>
                  )}
                  {columns.responsavel && (
                    <TableCell className="text-muted-foreground text-sm">
                      {users.find((u) => u.id === task.dados_customizados?.responsible)?.name ||
                        'Não atribuído'}
                    </TableCell>
                  )}
                  {columns.dataEntrega && (
                    <TableCell className="text-muted-foreground text-sm">
                      {task.dados_customizados?.due_date
                        ? new Date(task.dados_customizados.due_date).toLocaleDateString('pt-BR')
                        : '-'}
                    </TableCell>
                  )}
                  {columns.status && (
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          task.concluida
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : isOverdue(task.dados_customizados?.due_date)
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}
                      >
                        {task.concluida
                          ? 'Concluída'
                          : isOverdue(task.dados_customizados?.due_date)
                            ? 'Atrasada'
                            : 'Em andamento'}
                      </span>
                    </TableCell>
                  )}
                  {columns.acoes && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleAddTask(task.id)}
                          title="Adicionar subtarefa"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDel(task.id)}
                          title="Excluir tarefa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhuma tarefa encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tarefa? Todas as subtarefas também serão
              removidas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTask}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
