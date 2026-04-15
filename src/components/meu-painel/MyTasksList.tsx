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
import { Trash2, GripVertical, Plus, ChevronRight, ChevronDown, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'

export function MyTasksList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<any[]>([])
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

  const loadTasks = async () => {
    if (!user) return
    try {
      const data = await pb.collection('tasks').getFullList({
        filter: `responsible = "${user.id}"`,
        sort: 'ordem',
        expand: 'project,parent_task',
      })
      setTasks(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [user])
  useRealtime('tasks', loadTasks)

  const tree = useMemo(() => {
    const map = new Map()
    tasks.forEach((t) => map.set(t.id, { ...t, children: [] }))
    const roots: any[] = []
    tasks.forEach((t) => {
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
  }, [tasks])

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
      toast({ title: 'Tarefas excluídas com sucesso' })
      setSelectedIds(new Set())
    } catch (e) {
      toast({ title: 'Erro ao excluir tarefas', variant: 'destructive' })
    }
  }

  const handleCreateInline = async () => {
    if (!inlineCreateTitle.trim() || !inlineCreateId) return
    try {
      await pb.collection('tasks').create({
        title: inlineCreateTitle,
        parent_task: inlineCreateId === 'root' ? '' : inlineCreateId,
        status: 'Pendente',
        responsible: user?.id,
        ordem: Date.now() / 1000,
      })
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

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    setDraggedId(id)
  }

  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (id === draggedId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    let position: 'before' | 'after' | 'inside' = 'inside'
    if (y < rect.height * 0.25) position = 'before'
    else if (y > rect.height * 0.75) position = 'after'
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
        parent_task: newParent || '',
        ordem: newOrdem,
      })
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
            'group flex items-center gap-2 py-2 px-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-md transition-colors border-b border-transparent hover:border-slate-100 dark:hover:border-slate-800',
            draggedId === node.id && 'opacity-50',
            dropTarget?.id === node.id && dropTarget.position === 'inside' && 'bg-accent/50',
            dropTarget?.id === node.id &&
              dropTarget.position === 'before' &&
              'border-t-2 border-t-primary rounded-t-none',
            dropTarget?.id === node.id &&
              dropTarget.position === 'after' &&
              'border-b-2 border-b-primary rounded-b-none',
          )}
          style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
        >
          <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 text-slate-400">
            <GripVertical className="h-4 w-4" />
          </div>
          <div
            onClickCapture={(e) => toggleSelection(node.id, e)}
            className="flex items-center cursor-pointer"
          >
            <Checkbox checked={isSelected} onCheckedChange={() => {}} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0"
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

          <span
            className={cn(
              'flex-1 text-sm font-medium',
              node.status === 'Concluído'
                ? 'line-through text-slate-400'
                : 'text-slate-700 dark:text-slate-200',
            )}
          >
            {node.title}
          </span>

          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 whitespace-nowrap">
            {node.status || 'Pendente'}
          </span>

          {node.expand?.project && (
            <span
              className="text-xs text-slate-400 truncate max-w-[120px]"
              title={node.expand.project.name}
            >
              {node.expand.project.name}
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 shrink-0"
            onClick={() => {
              setInlineCreateId(node.id)
              setExpandedIds((prev) => new Set(prev).add(node.id))
            }}
            title="Adicionar subtarefa"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {inlineCreateId === node.id && (
          <div
            className="flex items-center gap-2 py-2 px-3"
            style={{ paddingLeft: `${(depth + 1) * 1.5 + 0.75}rem` }}
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
              placeholder="Digite o título e pressione Enter..."
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
              Gerencie suas responsabilidades de forma hierárquica.
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
          {tree.length === 0 && inlineCreateId !== 'root' ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              Nenhuma tarefa atribuída a você no momento.
            </div>
          ) : (
            <div className="py-2">{tree.map((node) => renderNode(node, 0))}</div>
          )}
        </div>

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
                {['Pendente', 'Em Andamento', 'Revisão', 'Espera', 'Atrasado', 'Concluído'].map(
                  (s) => (
                    <DropdownMenuItem key={s} onClick={() => handleBatchStatus(s)}>
                      {s}
                    </DropdownMenuItem>
                  ),
                )}
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
