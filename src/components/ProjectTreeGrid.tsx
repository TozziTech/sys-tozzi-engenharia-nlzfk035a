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
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ChevronRight, ChevronDown, Plus, PlusCircle, Trash2, GripVertical } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'
import { DateMaskedInput, CurrencyMaskedInput } from './ProjectGridCells'
import {
  getProjectColumns,
  getHierarchicalTasks,
  createHierarchicalTask,
  updateHierarchicalTask,
  createProjectColumn,
  deleteHierarchicalTask,
} from '@/services/project_grid'

export interface HTreeTask {
  id: string
  titulo: string
  concluida: boolean
  parent_id?: string | null
  ordem?: number
  dados_customizados: Record<string, any>
  children: HTreeTask[]
}

const buildTree = (tasks: any[]): HTreeTask[] => {
  const map = new Map<string, HTreeTask>()
  const roots: HTreeTask[] = []
  tasks.forEach((t) => {
    map.set(t.id, {
      ...t,
      concluida: t.concluida || false,
      dados_customizados: t.dados_customizados || {},
      children: [],
    })
  })
  const sorted = Array.from(map.values()).sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
  sorted.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

const flattenTree = (
  nodes: HTreeTask[],
  depth = 0,
  expandedIds: Set<string>,
): { task: HTreeTask; depth: number }[] => {
  let result: { task: HTreeTask; depth: number }[] = []
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
  const [tasks, setTasks] = useState<HTreeTask[]>([])
  const [columns, setColumns] = useState<any[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{
    id: string
    position: 'before' | 'after' | 'inside'
  } | null>(null)

  const [colOpen, setColOpen] = useState(false)
  const [colName, setColName] = useState('')
  const [colType, setColType] = useState('Texto')

  const loadData = async () => {
    try {
      const [pbTasks, pbCols] = await Promise.all([
        getHierarchicalTasks(projectId),
        getProjectColumns(projectId),
      ])
      const tree = buildTree(pbTasks)
      setTasks(tree)
      setColumns(pbCols)
      if (expandedIds.size === 0) setExpandedIds(new Set(tree.map((t) => t.id)))
    } catch {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [projectId])
  useRealtime('tarefas_hierarquicas', loadData)
  useRealtime('colunas_projeto', loadData)

  const getNode = (id: string, nodes: HTreeTask[] = tasks): HTreeTask | null => {
    for (const n of nodes) {
      if (n.id === id) return n
      const found = getNode(id, n.children)
      if (found) return found
    }
    return null
  }

  const handleAddCol = async () => {
    if (!colName) return
    try {
      await createProjectColumn({ projeto_id: projectId, nome: colName, tipo_dado: colType })
      setColOpen(false)
      setColName('')
      setColType('Texto')
    } catch {
      toast({ title: 'Erro ao criar coluna', variant: 'destructive' })
    }
  }

  const handleAddTask = async (pid?: string) => {
    const titulo = window.prompt('Nome da tarefa:')
    if (!titulo) return
    const siblings = pid ? getNode(pid)?.children || [] : tasks
    const newOrdem = siblings.length > 0 ? (siblings[siblings.length - 1].ordem || 0) + 1 : 1
    try {
      await createHierarchicalTask({
        projeto_id: projectId,
        titulo,
        parent_id: pid || null,
        ordem: newOrdem,
      })
      if (pid) setExpandedIds((prev) => new Set(prev).add(pid))
    } catch {
      toast({ title: 'Erro ao criar tarefa', variant: 'destructive' })
    }
  }

  const handleDel = async (id: string) => {
    if (!window.confirm('Excluir esta tarefa e suas subtarefas?')) return
    try {
      await deleteHierarchicalTask(id)
    } catch {
      toast({ title: 'Erro ao excluir tarefa', variant: 'destructive' })
    }
  }

  const handleUpd = async (id: string, data: any) => {
    try {
      await updateHierarchicalTask(id, data)
    } catch {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  const handleDrop = async (
    dragId: string,
    targetId: string,
    pos: 'before' | 'after' | 'inside',
  ) => {
    const target = getNode(targetId)
    if (!target) return
    let curr = target
    while (curr) {
      if (curr.id === dragId) {
        toast({
          title: 'Ação inválida',
          description: 'Não é possível mover para dentro de si mesma.',
          variant: 'destructive',
        })
        return
      }
      curr = curr.parent_id ? getNode(curr.parent_id)! : (null as any)
    }

    let newParentId = target.parent_id || null
    let newOrdem = 0

    if (pos === 'inside') {
      newParentId = target.id
      const sibs = target.children.filter((s) => s.id !== dragId)
      newOrdem = sibs.length > 0 ? (sibs[sibs.length - 1].ordem || 0) + 1 : 1
      setExpandedIds((prev) => new Set(prev).add(target.id))
    } else {
      const parentNode = target.parent_id ? getNode(target.parent_id) : null
      const sibs = (parentNode ? parentNode.children : tasks).filter((s) => s.id !== dragId)
      const idx = sibs.findIndex((s) => s.id === target.id)

      if (pos === 'before') {
        const prev = sibs[idx - 1]
        newOrdem = prev ? ((prev.ordem || 0) + (target.ordem || 0)) / 2 : (target.ordem || 0) - 1
      } else {
        const next = sibs[idx + 1]
        newOrdem = next ? ((target.ordem || 0) + (next.ordem || 0)) / 2 : (target.ordem || 0) + 1
      }
    }

    try {
      await updateHierarchicalTask(dragId, { parent_id: newParentId, ordem: newOrdem })
      loadData()
    } catch {
      toast({ title: 'Erro ao mover tarefa', variant: 'destructive' })
    }
  }

  const flatNodes = useMemo(() => flattenTree(tasks, 0, expandedIds), [tasks, expandedIds])

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando grid...</div>
    )

  return (
    <div className="flex flex-col h-[500px] sm:h-[600px] bg-white dark:bg-slate-950 border rounded-lg shadow-sm overflow-hidden">
      <div className="flex-1 overflow-auto">
        <Table className="w-full relative">
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 shadow-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="border-r border-b w-[350px]">Tarefa</TableHead>
              {columns.map((c) => (
                <TableHead key={c.id} className="border-r border-b min-w-[120px]">
                  {c.nome}
                </TableHead>
              ))}
              <TableHead className="border-b w-[50px] p-0 text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setColOpen(true)}
                  title="Adicionar Coluna"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flatNodes.map(({ task, depth }) => {
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
                      <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
                      <Checkbox
                        checked={task.concluida}
                        onCheckedChange={(c) => handleUpd(task.id, { concluida: !!c })}
                      />
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {task.children.length > 0 && (
                          <button
                            onClick={() =>
                              setExpandedIds((p) => {
                                const n = new Set(p)
                                n.has(task.id) ? n.delete(task.id) : n.add(task.id)
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
                      <span className="text-sm flex-1 truncate font-medium">{task.titulo}</span>
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
                  {columns.map((c) => (
                    <TableCell
                      key={c.id}
                      className={cn(
                        'border-r border-b p-1',
                        isDropTarget && dropPos === 'before' && 'border-t-2 border-t-primary',
                        isDropTarget && dropPos === 'after' && 'border-b-2 border-b-primary',
                      )}
                    >
                      {c.tipo_dado === 'Data' ? (
                        <DateMaskedInput
                          value={task.dados_customizados?.[c.nome] || ''}
                          onBlur={(v) =>
                            handleUpd(task.id, {
                              dados_customizados: { ...task.dados_customizados, [c.nome]: v },
                            })
                          }
                        />
                      ) : c.tipo_dado === 'Moeda' ? (
                        <CurrencyMaskedInput
                          value={task.dados_customizados?.[c.nome] || ''}
                          onBlur={(v) =>
                            handleUpd(task.id, {
                              dados_customizados: { ...task.dados_customizados, [c.nome]: v },
                            })
                          }
                        />
                      ) : (
                        <Input
                          className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent"
                          defaultValue={task.dados_customizados?.[c.nome] || ''}
                          onBlur={(e) =>
                            e.target.value !== (task.dados_customizados?.[c.nome] || '') &&
                            handleUpd(task.id, {
                              dados_customizados: {
                                ...task.dados_customizados,
                                [c.nome]: e.target.value,
                              },
                            })
                          }
                        />
                      )}
                    </TableCell>
                  ))}
                  <TableCell
                    className={cn(
                      'border-b p-1 text-center',
                      isDropTarget && dropPos === 'before' && 'border-t-2 border-t-primary',
                      isDropTarget && dropPos === 'after' && 'border-b-2 border-b-primary',
                    )}
                  >
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
            {flatNodes.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 2}
                  className="h-32 text-center text-muted-foreground"
                >
                  Nenhuma tarefa registrada. Adicione a primeira!
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

      <Dialog open={colOpen} onOpenChange={setColOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Coluna</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input
                value={colName}
                onChange={(e) => setColName(e.target.value)}
                placeholder="Ex: Custo, Fim..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Tipo de Dado</Label>
              <Select value={colType} onValueChange={setColType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Texto">Texto</SelectItem>
                  <SelectItem value="Data">Data</SelectItem>
                  <SelectItem value="Moeda">Moeda / Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setColOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCol}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
