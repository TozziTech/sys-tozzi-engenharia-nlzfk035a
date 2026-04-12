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
import { ChevronRight, ChevronDown, Plus, PlusCircle, User, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { getModuleTasks } from '@/services/tasks'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'

export interface TreeTask {
  id: string
  title: string
  status: string
  responsible?: { name: string; avatar?: string }
  due_date?: string
  children?: TreeTask[]
}

const MOCK_TREE_DATA: TreeTask[] = [
  {
    id: '1',
    title: '1. Projeto Básico de Arquitetura',
    status: 'Em Andamento',
    responsible: { name: 'João Carlos' },
    due_date: '2024-05-10',
    children: [
      {
        id: '1.1',
        title: '1.1. Levantamento Planialtimétrico',
        status: 'Concluído',
        responsible: { name: 'Ana Silva' },
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
        responsible: { name: 'Marcos Paulo' },
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
      responsible: t.expand?.responsible
        ? {
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
    Atrasado: 'bg-red-500 hover:bg-red-600',
  }
  return (
    <Badge className={`${colors[status] || 'bg-slate-500'} text-white border-none`}>{status}</Badge>
  )
}

export function ModuleTreeGrid({ moduleId }: { moduleId: string }) {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<TreeTask[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1', '1.1']))
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true)
      const pbTasks = await getModuleTasks(moduleId)
      if (pbTasks.length > 0) {
        const tree = buildTreeFromPB(pbTasks)
        setTasks(tree)
        // Expand top level roots by default for real data
        setExpandedIds(new Set(tree.map((t) => t.id)))
      } else {
        setTasks(MOCK_TREE_DATA)
      }
      setLoading(false)
    }
    loadTasks()
  }, [moduleId])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const flatNodes = useMemo(() => flattenTree(tasks, 0, expandedIds), [tasks, expandedIds])

  const handleSimulateAction = (action: string) => {
    toast({ title: 'Ação Simulada', description: `Você clicou em: ${action}` })
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
              <TableHead className="border-r border-b w-[150px] font-semibold text-foreground">
                Status
              </TableHead>
              <TableHead className="border-r border-b w-[200px] font-semibold text-foreground">
                Responsável
              </TableHead>
              <TableHead className="border-r border-b w-[150px] font-semibold text-foreground">
                Data
              </TableHead>
              <TableHead className="border-b w-[50px] text-center p-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => handleSimulateAction('Adicionar Coluna')}
                  title="Adicionar Coluna"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flatNodes.map(({ task, depth }) => (
              <TableRow
                key={task.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
              >
                <TableCell className="border-r border-b p-2.5">
                  <div
                    className="flex items-center gap-2"
                    style={{ paddingLeft: `${depth * 24}px` }}
                  >
                    <Checkbox
                      checked={selectedIds.has(task.id)}
                      onCheckedChange={() => toggleSelect(task.id)}
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
                  <StatusBadge status={task.status} />
                </TableCell>
                <TableCell className="border-r border-b p-2.5">
                  {task.responsible ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6 border">
                        <AvatarImage src={task.responsible.avatar} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {task.responsible.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate max-w-[130px]">
                        {task.responsible.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground/50">
                      <div className="w-6 h-6 rounded-full border border-dashed flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                        <User className="w-3 h-3" />
                      </div>
                      <span className="text-xs italic">Não atribuído</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="border-r border-b p-2.5 text-xs font-medium">
                  {task.due_date ? (
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(task.due_date), 'dd/MM/yyyy')}
                    </div>
                  ) : (
                    <span className="text-muted-foreground/50 italic">-</span>
                  )}
                </TableCell>
                <TableCell className="border-b p-2.5"></TableCell>
              </TableRow>
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
          onClick={() => handleSimulateAction('Adicionar Tarefa')}
        >
          <PlusCircle className="w-4 h-4 text-primary" />
          Adicionar Tarefa
        </Button>
      </div>
    </div>
  )
}
