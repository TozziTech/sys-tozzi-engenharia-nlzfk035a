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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  ChevronRight,
  ChevronDown,
  Plus,
  PlusCircle,
  Calendar,
  CornerDownRight,
  Paperclip,
  Loader2,
  Download,
  Trash2,
  Eye,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  getModuleTasks,
  updateTaskStatus,
  updateTaskTitle,
  updateTaskDueDate,
  createTask,
  uploadTaskAttachments,
  deleteTaskAttachment,
} from '@/services/tasks'
import { TextMaskedInput, DateMaskedInput } from '@/components/ProjectGridCells'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'

const pbDateToBR = (dateStr?: string) => {
  if (!dateStr) return ''
  const ymd = dateStr.substring(0, 10)
  const parts = ymd.split('-')
  if (parts.length !== 3) return ''
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

import { CreateTaskDialog } from './CreateTaskDialog'
import { PermissionGuard } from './auth/PermissionGuard'
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
  due_date?: string
  children?: TreeTask[]
  project?: string
  attachments?: string[]
}

const MOCK_TREE_DATA: TreeTask[] = [
  {
    id: '1',
    title: '1. Projeto Básico de Arquitetura',
    status: 'Em Andamento',
    due_date: '2024-05-10',
    attachments: ['planta_baixa_v1.pdf', 'referencias.zip'],
    children: [
      {
        id: '1.1',
        title: '1.1. Levantamento Planialtimétrico',
        status: 'Concluído',
        due_date: '2024-04-20',
        attachments: ['levantamento.pdf'],
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
      due_date: t.due_date,
      attachments: t.attachments || [],
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
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null)

  const [projectId, setProjectId] = useState<string | null>(null)

  const [inlineCreateParentId, setInlineCreateParentId] = useState<string | null>(null)
  const [subTaskTitle, setSubTaskTitle] = useState('')
  const [previewFile, setPreviewFile] = useState<{
    url: string
    name: string
    type: string
  } | null>(null)

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
    const isCompleted = newStatus === 'Concluído'
    const nowIso = isCompleted ? new Date().toISOString() : null

    setTasks((prevTasks) => {
      const updateStatus = (nodes: TreeTask[]): TreeTask[] => {
        return nodes.map((node) => {
          if (node.id === taskId) {
            return { ...node, status: newStatus, due_date: isCompleted ? nowIso : undefined }
          }
          if (node.children) return { ...node, children: updateStatus(node.children) }
          return node
        })
      }
      return updateStatus(prevTasks)
    })

    if (taskId.length < 15) {
      toast({ title: 'Status atualizado (Simulação)' })
      return
    }
    try {
      await updateTaskStatus(taskId, newStatus, isCompleted ? nowIso : null)
      toast({ title: 'Status atualizado' })
    } catch (err) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
      loadTasks()
    }
  }

  const handleTitleChange = async (taskId: string, newTitle: string) => {
    if (!newTitle.trim()) return

    setTasks((prevTasks) => {
      const updateTitle = (nodes: TreeTask[]): TreeTask[] => {
        return nodes.map((node) => {
          if (node.id === taskId) return { ...node, title: newTitle }
          if (node.children) return { ...node, children: updateTitle(node.children) }
          return node
        })
      }
      return updateTitle(prevTasks)
    })

    if (taskId.length < 15) {
      toast({ title: 'Título atualizado (Simulação)' })
      return
    }
    try {
      await updateTaskTitle(taskId, newTitle)
      toast({ title: 'Título atualizado' })
    } catch (err) {
      toast({ title: 'Erro ao atualizar título', variant: 'destructive' })
      loadTasks()
    }
  }

  const handleDateChange = async (taskId: string, newDateStr: string) => {
    let isoDate: string | null = null
    if (newDateStr.length === 10) {
      const [d, m, y] = newDateStr.split('/')
      const parsedDate = new Date(`${y}-${m}-${d}T12:00:00Z`)
      if (isNaN(parsedDate.getTime())) {
        toast({ title: 'Data inválida', variant: 'destructive' })
        return
      }
      isoDate = `${y}-${m}-${d} 12:00:00.000Z`
    } else if (newDateStr.length === 0) {
      isoDate = null
    } else {
      toast({ title: 'Data inválida (use DD/MM/AAAA)', variant: 'destructive' })
      return
    }

    setTasks((prevTasks) => {
      const updateDate = (nodes: TreeTask[]): TreeTask[] => {
        return nodes.map((node) => {
          if (node.id === taskId) return { ...node, due_date: isoDate || undefined }
          if (node.children) return { ...node, children: updateDate(node.children) }
          return node
        })
      }
      return updateDate(prevTasks)
    })

    if (taskId.length < 15) {
      toast({ title: 'Data atualizada (Simulação)' })
      return
    }
    try {
      await updateTaskDueDate(taskId, isoDate)
      toast({ title: 'Data atualizada' })
    } catch (err) {
      toast({ title: 'Erro ao atualizar data', variant: 'destructive' })
      loadTasks()
    }
  }

  const handleFileUpload = async (taskId: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 5242880) {
        toast({
          title: 'Erro de validação',
          description: `O arquivo ${files[i].name} excede o limite de 5MB.`,
          variant: 'destructive',
        })
        return
      }
    }

    if (taskId.length < 15) {
      toast({ title: 'Upload simulado (Tarefa Mock)' })
      return
    }

    setUploadingTaskId(taskId)
    try {
      await uploadTaskAttachments(taskId, files)
      toast({ title: 'Anexo(s) enviado(s) com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao enviar arquivo', description: err.message, variant: 'destructive' })
    } finally {
      setUploadingTaskId(null)
      const el = document.getElementById(`file-${taskId}`) as HTMLInputElement
      if (el) el.value = ''
    }
  }

  const handleDeleteAttachment = async (taskId: string, filename: string) => {
    if (taskId.length < 15) {
      toast({ title: 'Exclusão simulada (Tarefa Mock)' })
      return
    }
    try {
      await deleteTaskAttachment(taskId, filename)
      toast({ title: 'Anexo removido com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao remover anexo', description: err.message, variant: 'destructive' })
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
              <TableHead className="border-r border-b w-[160px] font-semibold text-foreground">
                Documentos
              </TableHead>
              <TableHead className="border-r border-b w-[140px] font-semibold text-foreground">
                Data
              </TableHead>
              <TableHead className="border-b w-[80px] text-center p-0">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flatNodes.map(({ task, depth }) => {
              const rows = []
              rows.push(
                <TableRow
                  key={task.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors group"
                >
                  <TableCell className="border-r border-b p-2.5">
                    <div
                      className="flex items-center gap-2"
                      style={{ paddingLeft: `${depth * 24}px` }}
                    >
                      <PermissionGuard
                        module="projetos"
                        action="write"
                        fallback={
                          <Checkbox
                            checked={task.status === 'Concluído'}
                            disabled
                            className="data-[state=checked]:bg-primary opacity-50"
                          />
                        }
                      >
                        <Checkbox
                          checked={task.status === 'Concluído'}
                          onCheckedChange={(checked) => {
                            handleStatusChange(task.id, checked ? 'Concluído' : 'Pendente')
                          }}
                          className="data-[state=checked]:bg-primary"
                        />
                      </PermissionGuard>
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
                      <div className="flex-1 min-w-0">
                        <PermissionGuard
                          module="projetos"
                          action="write"
                          fallback={
                            <div
                              className={`h-7 px-1 py-0.5 -ml-1 w-full text-sm truncate ${depth === 0 ? 'font-semibold' : depth === 1 ? 'font-medium' : 'text-muted-foreground'}`}
                            >
                              {task.title}
                            </div>
                          }
                        >
                          <TextMaskedInput
                            value={task.title}
                            onBlur={(val) => {
                              if (val !== task.title) handleTitleChange(task.id, val)
                            }}
                            className={`h-7 px-1 py-0 -ml-1 w-full text-sm border-transparent hover:border-input focus:border-input bg-transparent ${depth === 0 ? 'font-semibold' : depth === 1 ? 'font-medium' : 'text-muted-foreground'}`}
                          />
                        </PermissionGuard>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-b p-2.5">
                    <PermissionGuard
                      module="projetos"
                      action="write"
                      fallback={
                        <div className="px-2 py-1">
                          <StatusBadge status={task.status} />
                        </div>
                      }
                    >
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
                    </PermissionGuard>
                  </TableCell>
                  <TableCell className="border-r border-b p-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {task.attachments && task.attachments.length > 0 ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100 hover:text-foreground"
                              >
                                <Paperclip className="w-3 h-3" />
                                {task.attachments.length}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-2 shadow-lg z-50">
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium border-b pb-1">Anexos</h4>
                                <div className="max-h-[200px] overflow-y-auto pr-1">
                                  {task.attachments.map((filename) => {
                                    const ext = filename.split('.').pop()?.toLowerCase()
                                    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(
                                      ext || '',
                                    )
                                    const isPdf = ext === 'pdf'
                                    const canPreview = isImage || isPdf
                                    const fileUrl = pb.files.getURL(
                                      {
                                        id: task.id,
                                        collectionId: 'tasks',
                                        collectionName: 'tasks',
                                      },
                                      filename,
                                    )

                                    return (
                                      <div
                                        key={filename}
                                        className="flex items-center justify-between text-sm p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group/file"
                                      >
                                        <span
                                          className="truncate max-w-[150px] text-xs font-medium"
                                          title={filename}
                                        >
                                          {filename}
                                        </span>
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover/file:opacity-100 transition-opacity">
                                          {canPreview && (
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 text-muted-foreground hover:text-primary"
                                              onClick={() =>
                                                setPreviewFile({
                                                  url: fileUrl,
                                                  name: filename,
                                                  type: isImage ? 'image' : 'pdf',
                                                })
                                              }
                                              title="Visualizar"
                                            >
                                              <Eye className="w-3 h-3" />
                                            </Button>
                                          )}
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                            onClick={() => window.open(fileUrl, '_blank')}
                                            title="Baixar"
                                          >
                                            <Download className="w-3 h-3" />
                                          </Button>
                                          <PermissionGuard module="projetos" action="write">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                              onClick={() =>
                                                handleDeleteAttachment(task.id, filename)
                                              }
                                              title="Remover"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </PermissionGuard>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-xs text-muted-foreground italic px-2">
                            Sem anexos
                          </span>
                        )}
                      </div>

                      <PermissionGuard module="projetos" action="write">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="relative">
                              <input
                                type="file"
                                id={`file-${task.id}`}
                                className="hidden"
                                multiple
                                onChange={(e) => handleFileUpload(task.id, e.target.files)}
                                accept=".pdf,image/jpeg,image/png,image/gif,image/webp,.xlsx,.xls,.docx,.doc,.zip"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground shrink-0"
                                onClick={() => document.getElementById(`file-${task.id}`)?.click()}
                                disabled={uploadingTaskId === task.id}
                              >
                                {uploadingTaskId === task.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                ) : (
                                  <Plus className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Anexar arquivo</TooltipContent>
                        </Tooltip>
                      </PermissionGuard>
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-b p-1">
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 pl-1 pr-0.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0 ml-1 text-muted-foreground" />
                      <PermissionGuard
                        module="projetos"
                        action="write"
                        fallback={
                          <span className="text-xs font-medium pl-1">
                            {pbDateToBR(task.due_date)}
                          </span>
                        }
                      >
                        <DateMaskedInput
                          value={pbDateToBR(task.due_date)}
                          onBlur={(val) => handleDateChange(task.id, val)}
                          className="h-8 text-xs font-medium border-transparent hover:border-input focus:border-input bg-transparent w-full text-left"
                        />
                      </PermissionGuard>
                    </div>
                  </TableCell>
                  <TableCell className="border-b p-2.5 text-center">
                    <PermissionGuard module="projetos" action="write">
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
                    </PermissionGuard>
                  </TableCell>
                </TableRow>,
              )

              if (inlineCreateParentId === task.id) {
                rows.push(
                  <TableRow
                    key={`${task.id}-inline`}
                    className="bg-slate-50/50 dark:bg-slate-900/30"
                  >
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
                  </TableRow>,
                )
              }

              return rows
            })}
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
      <PermissionGuard module="projetos" action="write">
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
      </PermissionGuard>

      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        moduleId={moduleId}
        availableParents={flatNodes.map((n) => ({ id: n.task.id, title: n.task.title }))}
      />

      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b shrink-0 bg-background">
            <DialogTitle className="text-base truncate pr-6">{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-slate-100/50 dark:bg-slate-900/50 flex items-center justify-center p-4 relative">
            {previewFile?.type === 'image' && (
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-w-full max-h-full object-contain rounded-md shadow-sm"
              />
            )}
            {previewFile?.type === 'pdf' && (
              <iframe
                src={previewFile.url}
                className="w-full h-full border-0 rounded-md shadow-sm bg-white"
                title={previewFile.name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
