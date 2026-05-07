import { useState, useEffect, useMemo, KeyboardEvent } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
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
import {
  Trash2,
  GripVertical,
  Plus,
  ChevronRight,
  ChevronDown,
  CheckSquare,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { useQuery, queryClient } from '@/hooks/use-query'

const getTaskStatusColor = (status: string) => {
  switch (status) {
    case 'Concluído':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
    case 'Em Andamento':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
    case 'Cancelado':
      return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
    case 'Pendente':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
  }
}

export function MyTasksList({ dateRange }: { dateRange?: { from: Date; to: Date } }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{
    id: string
    position: 'before' | 'after' | 'inside'
  } | null>(null)

  const [inlineCreateId, setInlineCreateId] = useState<string | null>(null)
  const [inlineCreateTitle, setInlineCreateTitle] = useState('')

  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)

  // Inline Editing State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const {
    data: tasks = [],
    isLoading,
    refetch,
  } = useQuery(
    `tasks_my_list_${user?.id}`,
    () =>
      pb.collection('tasks').getFullList({
        filter: `responsible = "${user?.id}"`,
        sort: 'ordem',
        expand: 'project,parent_task',
      }),
    { enabled: !!user },
  )

  useRealtime('tasks', refetch)

  const filteredTasks = useMemo(() => {
    if (!dateRange) return tasks
    const matchingIds = new Set<string>()

    tasks.forEach((t) => {
      let matches = false
      if (t.due_date) {
        const d = new Date(t.due_date)
        d.setHours(d.getHours() + 12)
        if (d >= dateRange.from && d <= dateRange.to) matches = true
      }
      if (t.completed_at) {
        const d = new Date(t.completed_at)
        d.setHours(d.getHours() + 12)
        if (d >= dateRange.from && d <= dateRange.to) matches = true
      }

      if (matches) {
        matchingIds.add(t.id)
        let curr = t
        while (curr.parent_task) {
          matchingIds.add(curr.parent_task)
          curr = tasks.find((x) => x.id === curr.parent_task) || curr
          if (curr.id === t.id) break
        }
      }
    })

    return tasks.filter((t) => matchingIds.has(t.id))
  }, [tasks, dateRange])

  const tree = useMemo(() => {
    const map = new Map()
    filteredTasks.forEach((t) => map.set(t.id, { ...t, children: [] }))
    const roots: any[] = []
    filteredTasks.forEach((t) => {
      if (t.parent_task && map.has(t.parent_task)) {
        map.get(t.parent_task).children.push(map.get(t.id))
      } else {
        roots.push(map.get(t.id))
      }
    })
    const sortFn = (a: any, b: any) => (a.ordem || 0) - (b.ordem || 0)
    roots.sort(sortFn)
    const sortChildren = (node: any) => {
      node.children.sort(sortFn)
      node.children.forEach(sortChildren)
    }
    roots.forEach(sortChildren)
    return roots
  }, [filteredTasks])

  const visibleIds = useMemo(() => {
    const ids: string[] = []
    const traverse = (nodes: any[]) => {
      for (const n of nodes) {
        ids.push(n.id)
        if (expandedIds.has(n.id)) traverse(n.children)
      }
    }
    traverse(tree)
    return ids
  }, [tree, expandedIds])

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExpandedIds(newSet)
  }

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSet = new Set(selectedIds)
    if (e.shiftKey && lastSelectedId) {
      const start = visibleIds.indexOf(lastSelectedId)
      const end = visibleIds.indexOf(id)
      if (start !== -1 && end !== -1) {
        const min = Math.min(start, end)
        const max = Math.max(start, end)
        for (let i = min; i <= max; i++) {
          newSet.add(visibleIds[i])
        }
      }
    } else {
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
    }
    setSelectedIds(newSet)
    setLastSelectedId(id)
  }

  const handleBatchStatus = async (status: string) => {
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => pb.collection('tasks').update(id, { status })),
      )
      queryClient().invalidateQueries(`tasks_my_list_${user?.id}`)
      queryClient().invalidateQueries(`designer_urgent_tasks_`)
      toast({ title: 'Status atualizados com sucesso' })
      setSelectedIds(new Set())
    } catch (e) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  const handleBatchDelete = async () => {
    if (!confirm('Excluir as tarefas selecionadas?')) return
    try {
      await Promise.all(Array.from(selectedIds).map((id) => pb.collection('tasks').delete(id)))
      queryClient().invalidateQueries(`tasks_my_list_${user?.id}`)
      queryClient().invalidateQueries(`designer_urgent_tasks_`)
      toast({ title: 'Tarefas excluídas com sucesso' })
      setSelectedIds(new Set())
    } catch (e) {
      toast({ title: 'Erro ao excluir tarefas', variant: 'destructive' })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return
    try {
      const idsToDelete = new Set<string>()
      const collectIds = (id: string) => {
        idsToDelete.add(id)
        const children = tasks.filter((t) => t.parent_task === id)
        children.forEach((c) => collectIds(c.id))
      }
      collectIds(taskToDelete)

      await Promise.all(Array.from(idsToDelete).map((id) => pb.collection('tasks').delete(id)))

      queryClient().invalidateQueries(`tasks_my_list_${user?.id}`)
      queryClient().invalidateQueries(`designer_urgent_tasks_`)
      toast({ title: 'Tarefa(s) excluída(s) com sucesso' })

      const newSelected = new Set(selectedIds)
      idsToDelete.forEach((id) => newSelected.delete(id))
      setSelectedIds(newSelected)
    } catch (e) {
      toast({ title: 'Erro ao excluir tarefa(s)', variant: 'destructive' })
    } finally {
      setTaskToDelete(null)
    }
  }

  const handleCreateInline = async () => {
    if (!inlineCreateTitle.trim() || !inlineCreateId) return
    try {
      await pb.collection('tasks').create({
        title: inlineCreateTitle,
        parent_task: inlineCreateId === 'root' ? null : inlineCreateId,
        status: 'Pendente',
        responsible: user?.id,
        ordem: Date.now() / 1000,
        due_date: dateRange ? dateRange.to.toISOString() : undefined,
      })
      queryClient().invalidateQueries(`tasks_my_list_${user?.id}`)
      queryClient().invalidateQueries(`designer_urgent_tasks_`)
      setInlineCreateTitle('')
      setInlineCreateId(null)
      if (inlineCreateId !== 'root') {
        setExpandedIds((prev) => new Set(prev).add(inlineCreateId))
      }
      toast({ title: 'Tarefa criada' })
    } catch (e) {
      toast({ title: 'Erro ao criar tarefa', variant: 'destructive' })
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCreateInline()
    if (e.key === 'Escape') {
      setInlineCreateId(null)
      setInlineCreateTitle('')
    }
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    const node = tasks.find((t) => t.id === editingId)
    if (!node) return

    const newTitle = editingTitle.trim()
    if (!newTitle || newTitle === node.title) {
      setEditingId(null)
      return
    }

    try {
      await pb.collection('tasks').update(editingId, { title: newTitle })
      queryClient().invalidateQueries(`tasks_my_list_${user?.id}`)
      setEditingId(null)
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveEdit()
    if (e.key === 'Escape') setEditingId(null)
  }

  const handleUpdateDueDate = async (id: string, dateStr: string) => {
    try {
      await pb.collection('tasks').update(id, {
        due_date: dateStr ? `${dateStr} 12:00:00.000Z` : null,
      })
      queryClient().invalidateQueries(`tasks_my_list_${user?.id}`)
      queryClient().invalidateQueries(`designer_urgent_tasks_`)
      toast({ title: 'Data atualizada' })
    } catch (e) {
      toast({ title: 'Erro ao atualizar data', variant: 'destructive' })
    }
  }

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    setDraggedId(id)
  }

  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (id === draggedId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const x = e.clientX - rect.left

    let position: 'before' | 'after' | 'inside' = 'inside'

    if (x > 40) {
      position = 'inside'
    } else {
      if (y < rect.height * 0.3) position = 'before'
      else if (y > rect.height * 0.7) position = 'after'
    }

    setDropTarget({ id, position })
  }

  const onDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId || !dropTarget) {
      setDraggedId(null)
      setDropTarget(null)
      return
    }

    const dragged = tasks.find((t) => t.id === draggedId)
    const target = tasks.find((t) => t.id === targetId)
    if (!dragged || !target) return

    let newParent = dragged.parent_task
    if (dropTarget.position === 'inside') {
      newParent = target.id
    } else {
      newParent = target.parent_task
    }

    let newOrdem = 0
    if (dropTarget.position === 'inside') {
      const children = tasks.filter((t) => t.parent_task === target.id)
      newOrdem = children.length > 0 ? Math.max(...children.map((c) => c.ordem || 0)) + 1 : 1
    } else if (dropTarget.position === 'before') {
      newOrdem = (target.ordem || 0) - 0.5
    } else if (dropTarget.position === 'after') {
      newOrdem = (target.ordem || 0) + 0.5
    }

    try {
      await pb.collection('tasks').update(draggedId, {
        parent_task: newParent || null,
        ordem: newOrdem,
      })
      queryClient().invalidateQueries(`tasks_my_list_${user?.id}`)
    } catch (err) {
      console.error(err)
    }

    setDraggedId(null)
    setDropTarget(null)
  }

  const renderNode = (node: any, depth = 0) => {
    const isExpanded = expandedIds.has(node.id)
    const isSelected = selectedIds.has(node.id)
    const hasChildren = node.children && node.children.length > 0

    return (
      <div key={node.id}>
        <div
          draggable
          onDragStart={(e) => onDragStart(e, node.id)}
          onDragOver={(e) => onDragOver(e, node.id)}
          onDrop={(e) => onDrop(e, node.id)}
          onDragEnd={() => {
            setDraggedId(null)
            setDropTarget(null)
          }}
          className={cn(
            'group flex items-center gap-2 py-1.5 px-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-transparent hover:border-slate-100 dark:hover:border-slate-800 relative',
            draggedId === node.id && 'opacity-50',
            dropTarget?.id === node.id &&
              dropTarget.position === 'inside' &&
              'bg-accent/50 border-l-2 border-l-primary',
            dropTarget?.id === node.id &&
              dropTarget.position === 'before' &&
              'border-t-2 border-t-primary rounded-t-none',
            dropTarget?.id === node.id &&
              dropTarget.position === 'after' &&
              'border-b-2 border-b-primary rounded-b-none',
          )}
          style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
        >
          <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 text-slate-400 shrink-0">
            <GripVertical className="h-4 w-4" />
          </div>
          <div
            onClickCapture={(e) => toggleSelection(node.id, e)}
            className="flex items-center cursor-pointer shrink-0"
          >
            <Checkbox checked={isSelected} onCheckedChange={() => {}} />
          </div>

          <div className="flex items-center opacity-100 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0 gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 text-slate-400 hover:text-primary hover:bg-primary/10"
              onClick={() => {
                setInlineCreateId(node.id)
                setExpandedIds((prev) => new Set(prev).add(node.id))
              }}
              title="Adicionar subtarefa"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => setTaskToDelete(node.id)}
              title="Excluir tarefa"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 shrink-0"
            onClick={() => toggleExpand(node.id)}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <span className="h-4 w-4" />
            )}
          </Button>

          <div className="flex-1 flex items-center min-w-0 mr-4">
            {editingId === node.id ? (
              <Input
                autoFocus
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleEditKeyDown}
                className="h-7 text-sm py-1 px-2 m-0 w-full"
              />
            ) : (
              <span
                onClick={() => {
                  setEditingId(node.id)
                  setEditingTitle(node.title)
                }}
                className={cn(
                  'text-sm font-medium cursor-text px-1.5 py-0.5 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 truncate transition-colors',
                  node.status === 'Concluído'
                    ? 'line-through text-slate-400'
                    : 'text-slate-700 dark:text-slate-200',
                )}
                title="Clique para editar o título"
              >
                {node.title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-900/50 px-2 py-0.5 rounded border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-colors">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="date"
              className="text-xs bg-transparent border-none outline-none cursor-pointer text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 w-[100px] sm:w-[110px]"
              value={node.due_date ? node.due_date.split(' ')[0] : ''}
              onChange={(e) => handleUpdateDueDate(node.id, e.target.value)}
              title="Data de Vencimento"
            />
          </div>

          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded border whitespace-nowrap shrink-0 ml-2 font-medium',
              getTaskStatusColor(node.status || 'Pendente'),
            )}
          >
            {node.status || 'Pendente'}
          </span>

          {node.expand?.project && (
            <span
              className="text-xs text-slate-400 truncate max-w-[120px] shrink-0 ml-3 hidden sm:inline-block"
              title={node.expand.project.name}
            >
              {node.expand.project.name}
            </span>
          )}
        </div>

        {inlineCreateId === node.id && (
          <div
            className="flex items-center gap-2 py-2 px-3 border-l-2 border-primary/30 ml-[2.25rem]"
            style={{ paddingLeft: `${(depth + 1) * 1.5}rem` }}
          >
            <Input
              autoFocus
              value={inlineCreateTitle}
              onChange={(e) => setInlineCreateTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!inlineCreateTitle.trim()) {
                  setInlineCreateId(null)
                }
              }}
              placeholder="Digite o título da subtarefa e pressione Enter..."
              className="h-8 text-sm"
            />
          </div>
        )}

        {isExpanded && hasChildren && (
          <div>{node.children.map((child: any) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <Card className="mt-8 border-slate-200 dark:border-slate-800">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              Minhas Tarefas
            </h3>
            <p className="text-sm text-slate-500">
              Gerencie suas responsabilidades. Edite títulos clicando neles, adicione subtarefas ou
              arraste para reorganizar.
            </p>
          </div>
          <Button size="sm" onClick={() => setInlineCreateId('root')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa Raiz
          </Button>
        </div>

        {inlineCreateId === 'root' && (
          <div className="flex items-center gap-2 py-2 px-3 mb-2 bg-slate-50 dark:bg-slate-800/50 rounded-md">
            <Input
              autoFocus
              value={inlineCreateTitle}
              onChange={(e) => setInlineCreateTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!inlineCreateTitle.trim()) setInlineCreateId(null)
              }}
              placeholder="Digite o título da tarefa raiz e pressione Enter..."
              className="h-8 text-sm"
            />
          </div>
        )}

        <div className="border border-slate-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 overflow-hidden">
          {isLoading ? (
            <div className="py-8 text-center text-slate-500 text-sm">Carregando tarefas...</div>
          ) : tree.length === 0 && inlineCreateId !== 'root' ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              Nenhum registro encontrado para este período.
            </div>
          ) : (
            <div className="py-2">{tree.map((node) => renderNode(node, 0))}</div>
          )}
        </div>

        <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir tarefa</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita e
                excluirá todas as subtarefas associadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700"
                onClick={handleDeleteConfirm}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-full px-6 py-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {selectedIds.size} {selectedIds.size === 1 ? 'selecionada' : 'selecionadas'}
            </span>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Alterar Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[
                  'Pendente',
                  'Em Andamento',
                  'Revisão',
                  'Espera',
                  'Atrasado',
                  'Concluído',
                  'Cancelado',
                ].map((s) => (
                  <DropdownMenuItem key={s} onClick={() => handleBatchStatus(s)}>
                    {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
