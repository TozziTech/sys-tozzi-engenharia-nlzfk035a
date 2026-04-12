import React, { useState, useMemo, useEffect } from 'react'
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
  ChevronRight,
  ChevronDown,
  Plus,
  PlusCircle,
  User,
  Calendar,
  CornerDownRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import {
  getModuleTasks,
  updateTaskStatus,
  updateTaskResponsible,
  createTask,
} from '@/services/tasks'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { CreateTaskDialog } from './CreateTaskDialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface TreeTask {
  id: string
  title: string
  status: string
  responsible?: { id: string; name: string; avatar?: string }
  due_date?: string
  children?: TreeTask[]
  project?: string
}

const MOCK_TREE_DATA: TreeTask[] = [
  {
    id: '1',
    title: '1. Projeto Básico de Arquitetura',
    status: 'Em Andamento',
    responsible: { id: 'u1', name: 'João Carlos' },
    due_date: '2024-05-10',
    children: [
      {
        id: '1.1',
        title: '1.1. Levantamento Planialtimétrico',
        status: 'Concluído',
        responsible: { id: 'u2', name: 'Ana Silva' },
        due_date: '2024-04-20',
        children: [
          {
            id: '1.1.1',
            title: '1.1.1. Visita ao Terreno e Medições',
            status: 'Concluído',
            due_date: '2024-04-15',
          },
          {
            id: '1.1.2',
            title: '1.1.2. Elaboração da Planta Topográfica',
            status: 'Concluído',
            due_date: '2024-04-20',
          },
        ],
      },
      {
        id: '1.2',
        title: '1.2. Estudo Preliminar',
        status: 'Em Andamento',
        responsible: { id: 'u3', name: 'Marcos Paulo' },
        due_date: '2024-05-05',
        children: [
          {
            id: '1.2.1',
            title: '1.2.1. Apresentação de Croquis',
            status: 'Pendente',
            due_date: '2024-05-02',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    title: '2. Projetos Complementares',
    status: 'Pendente',
    due_date: '2024-08-15',
    children: [
      {
        id: '2.1',
        title: '2.1. Estrutural',
        status: 'Pendente',
      },
      {
        id: '2.2',
        title: '2.2. Instalações Elétricas',
        status: 'Pendente',
      },
    ],
  },
]

type FlatNode = { task: TreeTask; depth: number }

const flattenTree = (nodes: TreeTask[], depth = 0, expandedIds: Set<string>): FlatNode[] => {
  let result: FlatNode[] = []
  for (const node of nodes) {
    result.push({ task: node, depth })
    if (expandedIds.has(node.id) && node.children && node.children.length > 0) {
      result = result.concat(flattenTree(node.children, depth + 1, expandedIds))
    }
  }
  return result
}

const buildTreeFromPB = (flatTasks: any[]): TreeTask[] => {
  const taskMap = new Map<string, TreeTask>()
  const roots: TreeTask[] = []

  flatTasks.forEach((t) => {
    taskMap.set(t.id, {
      id: t.id,
      title: t.title,
      status: t.status || 'Pendente',
      project: t.project,
      responsible: t.expand?.responsible
        ? {
            id: t.expand.responsible.id,
            name: t.expand.responsible.name || 'Usuário',
            avatar: t.expand.responsible.avatar
              ? pb.files.getURL(t.expand.responsible, t.expand.responsible.avatar)
              : undefined,
          }
        : undefined,
      due_date: t.due_date,
      children: [],
    })
  })

  flatTasks.forEach((t) => {
    const node = taskMap.get(t.id)!
    if (t.parent_task) {
      const parent = taskMap.get(t.parent_task)
      if (parent) {
        parent.children!.push(node)
      } else {
        roots.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  return roots
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    Concluído: 'bg-emerald-500 hover:bg-emerald-600',
    'Em Andamento': 'bg-blue-500 hover:bg-blue-600',
    Pendente: 'bg-slate-500 hover:bg-slate-600',
    Pausado: 'bg-amber-500 hover:bg-amber-600',
    Atrasado: 'bg-red-500 hover:bg-red-600',
  }
  return (
    <Badge className={cn('text-white border-none w-max', colors[status] || 'bg-slate-500')}>
      {status}
    </Badge>
  )
}

export function ModuleTreeGrid({ moduleId }: { moduleId: string }) {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<TreeTask[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1', '1.1']))
  const [loading, setLoading] = useState(true)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)

  const [users, setUsers] = useState<any[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)

  const [inlineCreateParentId, setInlineCreateParentId] = useState<string | null>(null)
  const [subTaskTitle, setSubTaskTitle] = useState('')

  const loadTasks = async () => {
    const pbTasks = await getModuleTasks(moduleId)
    if (pbTasks.length > 0) {
      setProjectId(pbTasks[0].project)
      const tree = buildTreeFromPB(pbTasks)
      setTasks(tree)
      setExpandedIds(new Set(tree.map((t) => t.id)))
    } else {
      try {
        const mod = await pb.collection('project_modules').getOne(moduleId)
        setProjectId(mod.project)
      } catch (e) {
        // Ignorar
      }
      setTasks(MOCK_TREE_DATA)
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await loadTasks()
      try {
        const res = await pb
          .collection('users')
          .getFullList({ filter: 'status != "Inativo"', sort: 'name' })
        setUsers(res)
      } catch (e) {
        // Ignorar
      }
      setLoading(false)
    }
    init()
  }, [moduleId])

  useRealtime('tasks', () => {
    loadTasks()
  })

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const flatNodes = useMemo(() => flattenTree(tasks, 0, expandedIds), [tasks, expandedIds])

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (taskId.length < 15) {
      setTasks((prevTasks) => {
        const updateStatus = (nodes: TreeTask[]): TreeTask[] => {
          return nodes.map((node) => {
            if (node.id === taskId) return { ...node, status: newStatus }
            if (node.children) return { ...node, children: updateStatus(node.children) }
            return node
          })
        }
        return updateStatus(prevTasks)
      })
      toast({ title: 'Status atualizado (Simulação)' })
      return
    }
    try {
      await updateTaskStatus(taskId, newStatus)
      toast({ title: 'Status atualizado' })
    } catch (err) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  const handleResponsibleChange = async (taskId: string, userId: string | null) => {
    if (taskId.length < 15) {
      const selectedUser = users.find((u) => u.id === userId)
      setTasks((prevTasks) => {
        const updateResp = (nodes: TreeTask[]): TreeTask[] => {
          return nodes.map((node) => {
            if (node.id === taskId)
              return {
                ...node,
                responsible: selectedUser
                  ? {
                      id: selectedUser.id,
                      name: selectedUser.name,
                      avatar: selectedUser.avatar
                        ? pb.files.getURL(selectedUser, selectedUser.avatar)
                        : undefined,
                    }
                  : undefined,
              }
            if (node.children) return { ...node, children: updateResp(node.children) }
            return node
          })
        }
        return updateResp(prevTasks)
      })
      toast({ title: 'Responsável atualizado (Simulação)' })
      return
    }
    try {
      await updateTaskResponsible(taskId, userId)
      toast({ title: 'Responsável atualizado' })
    } catch (err) {
      toast({ title: 'Erro ao atualizar responsável', variant: 'destructive' })
    }
  }

  const handleCreateSubTask = async () => {
    if (!subTaskTitle.trim()) return
    if (!inlineCreateParentId) return

    if (inlineCreateParentId.length < 15) {
      const newMockTask = {
        id: Math.random().toString(),
        title: subTaskTitle,
        status: 'Pendente',
        children: [],
      }
      setTasks((prev) => {
        const addSubTask = (nodes: TreeTask[]): TreeTask[] => {
          return nodes.map((n) => {
            if (n.id === inlineCreateParentId) {
              return { ...n, children: [...(n.children || []), newMockTask] }
            }
            if (n.children) {
              return { ...n, children: addSubTask(n.children) }
            }
            return n
          })
        }
        return addSubTask(prev)
      })
      toast({ title: 'Subtarefa criada (Simulação)' })
      setExpandedIds((prev) => new Set(prev).add(inlineCreateParentId))
      setInlineCreateParentId(null)
      setSubTaskTitle('')
      return
    }

    try {
      await createTask({
        title: subTaskTitle,
        status: 'Pendente',
        project: projectId,
        module: moduleId,
        parent_task: inlineCreateParentId,
      })
      toast({ title: 'Subtarefa criada' })
      setExpandedIds((prev) => new Set(prev).add(inlineCreateParentId))
      setInlineCreateParentId(null)
      setSubTaskTitle('')
    } catch (e) {
      toast({ title: 'Erro ao criar subtarefa', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Carregando estrutura analítica...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 border rounded-lg shadow-sm overflow-hidden">
      <div className="flex-1 overflow-auto">
        <Table className="border-collapse w-full">
          <TableHeader className="bg-slate-100/50 dark:bg-slate-900/50 sticky top-0 z-10 shadow-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="border-r border-b w-[450px] font-semibold text-foreground">
                Tarefa
              </TableHead>
              <TableHead className="border-r border-b w-[160px] font-semibold text-foreground">
                Status
              </TableHead>
              <TableHead className="border-r border-b w-[200px] font-semibold text-foreground">
                Responsável
              </TableHead>
              <TableHead className="border-r border-b w-[140px] font-semibold text-foreground">
                Data
              </TableHead>
              <TableHead className="border-b w-[80px] text-center p-0">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flatNodes.map(({ task, depth }) => (
              <React.Fragment key={task.id}>
                <TableRow className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors group">
                  <TableCell className="border-r border-b p-2.5">
                    <div
                      className="flex items-center gap-2"
                      style={{ paddingLeft: `${depth * 24}px` }}
                    >
                      <Checkbox
                        checked={task.status === 'Concluído'}
                        onCheckedChange={(checked) => {
                          handleStatusChange(task.id, checked ? 'Concluído' : 'Pendente')
                        }}
                        className="data-[state=checked]:bg-primary"
                      />
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        {task.children && task.children.length > 0 ? (
                          <button
                            onClick={() => toggleExpand(task.id)}
                            className="p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                          >
                            {expandedIds.has(task.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        ) : null}
                      </div>
                      <span
                        className={`text-sm ${depth === 0 ? 'font-semibold' : depth === 1 ? 'font-medium' : 'text-muted-foreground'}`}
                      >
                        {task.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-b p-2.5">
                    <Select
                      value={task.status}
                      onValueChange={(val) => handleStatusChange(task.id, val)}
                    >
                      <SelectTrigger className="h-8 border-none bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 w-full focus:ring-0 px-2 [&>span]:w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">
                          <StatusBadge status="Pendente" />
                        </SelectItem>
                        <SelectItem value="Em Andamento">
                          <StatusBadge status="Em Andamento" />
                        </SelectItem>
                        <SelectItem value="Pausado">
                          <StatusBadge status="Pausado" />
                        </SelectItem>
                        <SelectItem value="Concluído">
                          <StatusBadge status="Concluído" />
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="border-r border-b p-2.5">
                    <Select
                      value={task.responsible?.id || 'unassigned'}
                      onValueChange={(val) =>
                        handleResponsibleChange(task.id, val === 'unassigned' ? null : val)
                      }
                    >
                      <SelectTrigger className="h-8 border-none bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 w-full focus:ring-0 px-2 [&>span]:w-full [&>span]:flex [&>span]:items-center">
                        <SelectValue>
                          <div className="flex items-center gap-2 text-muted-foreground/50">
                            <div className="w-6 h-6 rounded-full border border-dashed flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                              <User className="w-3 h-3" />
                            </div>
                            <span className="text-xs italic">Atribuir</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="unassigned">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-6 h-6 rounded-full border border-dashed flex items-center justify-center">
                              <User className="w-3 h-3" />
                            </div>
                            <span className="text-xs italic">Não atribuído</span>
                          </div>
                        </SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6 border">
                                <AvatarImage
                                  src={u.avatar ? pb.files.getURL(u, u.avatar) : undefined}
                                />
                                <AvatarFallback className="text-[10px]">
                                  {u.name?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs truncate max-w-[120px]">{u.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                        {task.responsible && !users.find((u) => u.id === task.responsible!.id) && (
                          <SelectItem value={task.responsible.id} className="hidden">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6 border">
                                <AvatarImage src={task.responsible.avatar} />
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {task.responsible.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium truncate max-w-[120px]">
                                {task.responsible.name}
                              </span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="border-r border-b p-2.5 text-xs font-medium">
                    {task.due_date ? (
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 px-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(task.due_date), 'dd/MM/yyyy')}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50 italic px-2">-</span>
                    )}
                  </TableCell>
                  <TableCell className="border-b p-2.5 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setInlineCreateParentId(task.id)
                        setExpandedIds((prev) => new Set(prev).add(task.id))
                      }}
                      title="Adicionar Subtarefa"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>

                {inlineCreateParentId === task.id && (
                  <TableRow className="bg-slate-50/50 dark:bg-slate-900/30">
                    <TableCell colSpan={5} className="p-2 border-b">
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: `${(depth + 1) * 24}px` }}
                      >
                        <CornerDownRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        <Input
                          autoFocus
                          placeholder="Título da subtarefa..."
                          value={subTaskTitle}
                          onChange={(e) => setSubTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateSubTask()
                            if (e.key === 'Escape') {
                              setInlineCreateParentId(null)
                              setSubTaskTitle('')
                            }
                          }}
                          className="h-8 text-sm max-w-sm"
                        />
                        <Button size="sm" className="h-8" onClick={handleCreateSubTask}>
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          onClick={() => {
                            setInlineCreateParentId(null)
                            setSubTaskTitle('')
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
            {flatNodes.length === 0 && (
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
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setIsCreateTaskOpen(true)}
        >
          <PlusCircle className="w-4 h-4 text-primary" />
          Adicionar Tarefa Raiz
        </Button>
      </div>

      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        moduleId={moduleId}
        availableParents={flatNodes.map((n) => ({ id: n.task.id, title: n.task.title }))}
      />
    </div>
  )
}
