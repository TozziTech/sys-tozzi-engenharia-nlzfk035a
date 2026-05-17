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
  Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { useQuery, queryClient } from '@/hooks/use-query'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { CreateRootTaskDialog } from '@/components/CreateRootTaskDialog'

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

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

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
    async () => {
      if (!user?.id) return []
      const upaRes = await pb.collection('user_project_access').getFullList({
        filter: `user = "${user.id}"`,
      })
      const assignedProjectIds = user.assigned_projects || []
      const accessProjectIds = upaRes.map((u: any) => u.project)
      const allProjectIds = Array.from(new Set([...assignedProjectIds, ...accessProjectIds]))

      let projectFilter = `(projeto_id.engineer ~ "${user.name}" || projeto_id.engineer = "${user.id}")`
      if (allProjectIds.length > 0) {
        const idsFilter = allProjectIds.map((id) => `projeto_id="${id}"`).join(' || ')
        projectFilter = `(${projectFilter}) || (${idsFilter})`
      }

      const [tasksRes, checklistsRes, hierarquicasRes] = await Promise.all([
        pb.collection('tasks').getFullList({
          filter: `responsible = "${user.id}"`,
          sort: 'ordem',
          expand: 'project,parent_task,module',
        }),
        pb.collection('project_admin_checklist').getFullList({
          filter: `responsible = "${user.id}"`,
          sort: '-created',
          expand: 'project',
        }),
        pb.collection('tarefas_hierarquicas').getFullList({
          filter: projectFilter,
          sort: 'ordem',
          expand: 'projeto_id,parent_id',
        }),
      ])

      const mappedChecklists = checklistsRes.map((c) => ({
        ...c,
        title: c.item,
        due_date: c.deadline,
        is_admin_checklist: true,
        parent_task: null,
      }))

      const mappedHierarquicas = hierarquicasRes
        .filter(
          (h) =>
            !h.dados_customizados?.responsible || h.dados_customizados?.responsible === user.id,
        )
        .map((h) => ({
          ...h,
          title: h.titulo,
          due_date: h.dados_customizados?.due_date || null,
          status: h.dados_customizados?.status || (h.concluida ? 'Concluído' : 'Pendente'),
          project: h.projeto_id,
          parent_task: h.parent_id || null,
          is_hierarquica: true,
          expand: { ...h.expand, project: h.expand?.projeto_id, parent_task: h.expand?.parent_id },
        }))

      return [...tasksRes, ...mappedChecklists, ...mappedHierarquicas]
    },
    { enabled: !!user },
  )

  useRealtime('tasks', refetch)
  useRealtime('project_admin_checklist', refetch)
  useRealtime('tarefas_hierarquicas', refetch)

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
      if (!t.due_date && !t.completed_at) {
        matches = true
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

  const { treeWithDate, treeWithoutDate, tree } = useMemo(() => {
    const map = new Map()
    filteredTasks.forEach((t) => map.set(t.id, { ...t, children: [] }))
    const rootsWithDate: any[] = []
    const rootsWithoutDate: any[] = []
    filteredTasks.forEach((t) => {
      if (t.parent_task && map.has(t.parent_task)) {
        map.get(t.parent_task).children.push(map.get(t.id))
      } else {
        if (!t.due_date) {
          rootsWithoutDate.push(map.get(t.id))
        } else {
          rootsWithDate.push(map.get(t.id))
        }
      }
    })
    const sortFn = (a: any, b: any) => (a.ordem || 0) - (b.ordem || 0)
    rootsWithDate.sort(sortFn)
    rootsWithoutDate.sort(sortFn)

    const sortChildren = (node: any) => {
      node.children.sort(sortFn)
      node.children.forEach(sortChildren)
    }
    rootsWithDate.forEach(sortChildren)
    rootsWithoutDate.forEach(sortChildren)

    return {
      treeWithDate: rootsWithDate,
      treeWithoutDate: rootsWithoutDate,
      tree: [...rootsWithoutDate, ...rootsWithDate],
    }
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
        Array.from(selectedIds).map((id) => {
          const node = tasks.find((t) => t.id === id)
          if (node?.is_admin_checklist) {
            return pb.collection('project_admin_checklist').update(id, { status })
          } else if (node?.is_hierarquica) {
            const custom = node.dados_customizados || {}
            return pb.collection('tarefas_hierarquicas').update(id, {
              concluida: status === 'Concluído',
              dados_customizados: { ...custom, status },
            })
          }
          return pb.collection('tasks').update(id, { status })
        }),
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
      await Promise.all(
        Array.from(selectedIds).map((id) => {
          const node = tasks.find((t) => t.id === id)
          if (node?.is_admin_checklist) {
            return pb.collection('project_admin_checklist').delete(id)
          } else if (node?.is_hierarquica) {
            return pb.collection('tarefas_hierarquicas').delete(id)
          }
          return pb.collection('tasks').delete(id)
        }),
      )
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
        const children = tasks.filter((t) => t.parent_task === id && !t.is_admin_checklist)
        children.forEach((c) => collectIds(c.id))
      }
      collectIds(taskToDelete)

      await Promise.all(
        Array.from(idsToDelete).map((id) => {
          const node = tasks.find((t) => t.id === id)
          if (node?.is_admin_checklist) {
            return pb.collection('project_admin_checklist').delete(id)
          } else if (node?.is_hierarquica) {
            return pb.collection('tarefas_hierarquicas').delete(id)
          }
          return pb.collection('tasks').delete(id)
        }),
      )

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
      const parentNode = tasks.find((t) => t.id === inlineCreateId)
      if (parentNode?.is_hierarquica) {
        await pb.collection('tarefas_hierarquicas').create({
          titulo: inlineCreateTitle,
          parent_id: inlineCreateId === 'root' ? null : inlineCreateId,
          projeto_id: parentNode.project,
          concluida: false,
          ordem: Date.now() / 1000,
          dados_customizados: {
            status: 'Pendente',
            responsible: user?.id,
            due_date: dateRange ? dateRange.to.toISOString() : undefined,
          },
        })
      } else {
        await pb.collection('tasks').create({
          title: inlineCreateTitle,
          parent_task: inlineCreateId === 'root' ? null : inlineCreateId,
          project: parentNode?.project,
          status: 'Pendente',
          responsible: user?.id,
          ordem: Date.now() / 1000,
          due_date: dateRange ? dateRange.to.toISOString() : undefined,
        })
      }
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
      if (node.is_admin_checklist) {
        await pb.collection('project_admin_checklist').update(editingId, { item: newTitle })
      } else if (node.is_hierarquica) {
        await pb.collection('tarefas_hierarquicas').update(editingId, { titulo: newTitle })
      } else {
        await pb.collection('tasks').update(editingId, { title: newTitle })
      }
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
      const node = tasks.find((t) => t.id === id)
      if (node?.is_admin_checklist) {
        await pb.collection('project_admin_checklist').update(id, {
          deadline: dateStr ? `${dateStr} 12:00:00.000Z` : null,
        })
      } else if (node?.is_hierarquica) {
        const custom = node.dados_customizados || {}
        await pb.collection('tarefas_hierarquicas').update(id, {
          dados_customizados: { ...custom, due_date: dateStr ? `${dateStr} 12:00:00.000Z` : null },
        })
      } else {
        await pb.collection('tasks').update(id, {
          due_date: dateStr ? `${dateStr} 12:00:00.000Z` : null,
        })
      }
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

    if (dragged.is_admin_checklist || target.is_admin_checklist) {
      setDraggedId(null)
      setDropTarget(null)
      return
    }

    if (
      (dragged.is_hierarquica && !target.is_hierarquica) ||
      (!dragged.is_hierarquica && target.is_hierarquica)
    ) {
      setDraggedId(null)
      setDropTarget(null)
      return
    }

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
      if (dragged.is_hierarquica) {
        await pb.collection('tarefas_hierarquicas').update(draggedId, {
          parent_id: newParent || null,
          ordem: newOrdem,
        })
      } else {
        await pb.collection('tasks').update(draggedId, {
          parent_task: newParent || null,
          ordem: newOrdem,
        })
      }
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
            {!node.is_admin_checklist && (
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
            )}
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

          {node.is_admin_checklist ? (
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1.5 shrink-0 ml-2 hidden sm:inline-flex bg-amber-500/10 text-amber-600 border-amber-500/20"
            >
              Checklist Admin
            </Badge>
          ) : node.is_hierarquica ? (
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1.5 shrink-0 ml-2 hidden sm:inline-flex bg-purple-500/10 text-purple-600 border-purple-500/20"
            >
              Tarefa Hierárquica
            </Badge>
          ) : node.is_internal ? (
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1.5 shrink-0 ml-2 hidden sm:inline-flex bg-primary/5 text-primary border-primary/20"
            >
              Checklist Interno
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1.5 shrink-0 ml-2 hidden sm:inline-flex bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
            >
              Tarefa de Projeto
            </Badge>
          )}

          {node.expand?.module && (
            <span
              className="text-xs text-slate-400 truncate max-w-[120px] shrink-0 ml-2 hidden sm:inline-block"
              title={`Disciplina: ${node.expand.module.name}`}
            >
              {node.expand.module.name}
            </span>
          )}

          {node.expand?.project && (
            <Link
              to={`/projects/${node.project}`}
              className="text-xs text-primary hover:text-primary/80 hover:underline truncate max-w-[150px] shrink-0 ml-2 hidden sm:inline-flex items-center gap-1"
              title={`Projeto: ${node.expand.project.name}`}
            >
              <Briefcase className="h-3 w-3" />
              {node.expand.project.name}
            </Link>
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
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa Raiz
          </Button>
        </div>

        <div className="border border-slate-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 overflow-hidden">
          {isLoading ? (
            <div className="py-8 text-center text-slate-500 text-sm">Carregando tarefas...</div>
          ) : tree.length === 0 && inlineCreateId !== 'root' ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              Nenhum registro pendente encontrado.
            </div>
          ) : (
            <div className="py-2 flex flex-col gap-4">
              {treeWithoutDate.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 bg-rose-50/50 dark:bg-rose-950/20 border-y border-rose-100 dark:border-rose-900 text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Pendente de Agendamento (Sem Data)
                  </div>
                  {treeWithoutDate.map((node) => renderNode(node, 0))}
                </div>
              )}
              {treeWithDate.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Tarefas Agendadas
                  </div>
                  {treeWithDate.map((node) => renderNode(node, 0))}
                </div>
              )}
            </div>
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

        <CreateRootTaskDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={() => refetch()}
        />
      </CardContent>
    </Card>
  )
}
