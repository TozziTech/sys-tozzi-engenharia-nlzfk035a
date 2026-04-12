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
import { ChevronRight, ChevronDown, Plus, PlusCircle, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
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
  parent_id?: string
  dados_customizados: Record<string, any>
  children: HTreeTask[]
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

const buildTree = (tasks: any[]): HTreeTask[] => {
  const map = new Map<string, HTreeTask>()
  const roots: HTreeTask[] = []

  tasks.forEach((t) => {
    map.set(t.id, {
      id: t.id,
      titulo: t.titulo,
      concluida: t.concluida || false,
      parent_id: t.parent_id,
      dados_customizados: t.dados_customizados || {},
      children: [],
    })
  })

  tasks.forEach((t) => {
    const node = map.get(t.id)!
    if (t.parent_id && map.has(t.parent_id)) {
      map.get(t.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

export function ProjectTreeGrid({ projectId }: { projectId: string }) {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<HTreeTask[]>([])
  const [columns, setColumns] = useState<any[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [pbTasks, pbCols] = await Promise.all([
        getHierarchicalTasks(projectId),
        getProjectColumns(projectId),
      ])
      const tree = buildTree(pbTasks)
      setTasks(tree)
      setColumns(pbCols)

      if (expandedIds.size === 0) {
        setExpandedIds(new Set(tree.map((t) => t.id)))
      }
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

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const n = new Set(prev)
      if (n.has(id)) {
        n.delete(id)
      } else {
        n.add(id)
      }
      return n
    })
  }

  const handleAddCol = async () => {
    const nome = window.prompt('Nome da nova coluna (ex: "Status", "Data"):')
    if (!nome) return
    try {
      await createProjectColumn({ projeto_id: projectId, nome, tipo_dado: 'text' })
    } catch {
      toast({ title: 'Erro ao criar coluna', variant: 'destructive' })
    }
  }

  const handleAddTask = async (pid?: string) => {
    const titulo = window.prompt('Nome da tarefa:')
    if (!titulo) return
    try {
      await createHierarchicalTask({ projeto_id: projectId, titulo, parent_id: pid || null })
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
      toast({ title: 'Erro ao atualizar tarefa', variant: 'destructive' })
    }
  }

  const flatNodes = useMemo(() => flattenTree(tasks, 0, expandedIds), [tasks, expandedIds])

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando grid...</div>
    )
  }

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
                <Button variant="ghost" size="icon" onClick={handleAddCol} title="Adicionar Coluna">
                  <Plus className="h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flatNodes.map(({ task, depth }) => (
              <TableRow
                key={task.id}
                className="group hover:bg-slate-50 dark:hover:bg-slate-900/40"
              >
                <TableCell className="border-r border-b p-2">
                  <div
                    className="flex items-center gap-2"
                    style={{ paddingLeft: `${depth * 20}px` }}
                  >
                    <Checkbox
                      checked={task.concluida}
                      onCheckedChange={(c) => handleUpd(task.id, { concluida: !!c })}
                    />
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      {task.children.length > 0 && (
                        <button
                          onClick={() => handleToggle(task.id)}
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
                  <TableCell key={c.id} className="border-r border-b p-1">
                    <Input
                      className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent"
                      defaultValue={task.dados_customizados?.[c.nome] || ''}
                      onBlur={(e) => {
                        if (e.target.value !== (task.dados_customizados?.[c.nome] || '')) {
                          handleUpd(task.id, {
                            dados_customizados: {
                              ...task.dados_customizados,
                              [c.nome]: e.target.value,
                            },
                          })
                        }
                      }}
                    />
                  </TableCell>
                ))}
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
            ))}
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
          <PlusCircle className="w-4 h-4 text-primary" />
          Adicionar Tarefa Raiz
        </Button>
      </div>
    </div>
  )
}
