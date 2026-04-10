import React, { useState, useMemo } from 'react'
import { format, isBefore, addDays, startOfDay } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, AlertCircle } from 'lucide-react'

// Mock Data for Pending Tasks Report
const MOCK_TASKS = [
  {
    id: '1',
    title: 'Revisar Planta Baixa',
    project: 'Edifício Aurora',
    assignee: 'João Carlos',
    deadline: format(addDays(new Date(), -2), 'yyyy-MM-dd'),
    priority: 'Alta',
    status: 'Em Andamento',
  },
  {
    id: '2',
    title: 'Aprovação Prefeitura',
    project: 'Edifício Aurora',
    assignee: 'Ana Silva',
    deadline: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    priority: 'Alta',
    status: 'A Fazer',
  },
  {
    id: '3',
    title: 'Orçamento Materiais',
    project: 'Residência Silva',
    assignee: 'Marcos Paulo',
    deadline: format(addDays(new Date(), -5), 'yyyy-MM-dd'),
    priority: 'Média',
    status: 'A Fazer',
  },
  {
    id: '4',
    title: 'Cálculo Estrutural',
    project: 'Residência Silva',
    assignee: 'João Carlos',
    deadline: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
    priority: 'Alta',
    status: 'Em Andamento',
  },
  {
    id: '5',
    title: 'Projeto Elétrico',
    project: 'Shopping Central',
    assignee: 'Ana Silva',
    deadline: format(addDays(new Date(), 0), 'yyyy-MM-dd'),
    priority: 'Baixa',
    status: 'A Fazer',
  },
  {
    id: '6',
    title: 'Levantamento Topográfico',
    project: 'Ponte Sul',
    assignee: 'Marcos Paulo',
    deadline: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
    priority: 'Média',
    status: 'A Fazer',
  },
  {
    id: '7',
    title: 'Licenciamento Ambiental',
    project: 'Ponte Sul',
    assignee: 'Ana Silva',
    deadline: format(addDays(new Date(), -10), 'yyyy-MM-dd'),
    priority: 'Alta',
    status: 'Em Andamento',
  },
  {
    id: '8',
    title: 'Instalações Hidráulicas',
    project: 'Shopping Central',
    assignee: 'João Carlos',
    deadline: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    priority: 'Média',
    status: 'A Fazer',
  },
]

export default function PendingReport() {
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  const today = startOfDay(new Date())
  const threeDaysFromNow = addDays(today, 3)

  const pendingTasks = useMemo(() => {
    return MOCK_TASKS.filter((task) => {
      if (task.status === 'Concluído') return false
      const deadlineDate = startOfDay(new Date(task.deadline))
      return (
        isBefore(deadlineDate, today) || (deadlineDate >= today && deadlineDate <= threeDaysFromNow)
      )
    })
  }, [today, threeDaysFromNow])

  const filteredTasks = useMemo(() => {
    return pendingTasks.filter((task) => {
      if (filterProject !== 'all' && task.project !== filterProject) return false
      if (filterAssignee !== 'all' && task.assignee !== filterAssignee) return false
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false
      return true
    })
  }, [pendingTasks, filterProject, filterAssignee, filterPriority])

  const groupedTasks = useMemo(() => {
    const grouped: Record<string, Record<string, typeof filteredTasks>> = {}
    filteredTasks.forEach((task) => {
      if (!grouped[task.project]) grouped[task.project] = {}
      if (!grouped[task.project][task.assignee]) grouped[task.project][task.assignee] = []
      grouped[task.project][task.assignee].push(task)
    })
    return grouped
  }, [filteredTasks])

  const criticalCount = filteredTasks.filter((t) => t.priority === 'Alta').length
  const uniqueProjects = Array.from(new Set(pendingTasks.map((t) => t.project)))
  const uniqueAssignees = Array.from(new Set(pendingTasks.map((t) => t.assignee)))

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          Relatório de Pendências
        </h1>
        <p className="text-slate-400">
          Visão centralizada de tarefas atrasadas e com prazo próximo (até 3 dias).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total de Tarefas Pendentes
            </CardTitle>
            <Clock className="w-4 h-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-100">{filteredTasks.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-300">
              Tarefas Críticas (Alta Prioridade)
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-500">{criticalCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-slate-400">Projeto</label>
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os Projetos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Projetos</SelectItem>
              {uniqueProjects.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-slate-400">Responsável</label>
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os Membros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Membros</SelectItem>
              {uniqueAssignees.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-slate-400">Prioridade</label>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as Prioridades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Prioridades</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Média">Média</SelectItem>
              <SelectItem value="Baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-800/50">
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="w-[40%] text-slate-300">Título da Tarefa</TableHead>
                <TableHead className="text-slate-300">Responsável</TableHead>
                <TableHead className="text-slate-300">Prazo</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-right text-slate-300">Prioridade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.keys(groupedTasks).length === 0 ? (
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableCell colSpan={5} className="text-center h-32 text-slate-400">
                    Nenhuma tarefa pendente encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(groupedTasks).map(([project, assignees]) => (
                  <React.Fragment key={project}>
                    <TableRow className="bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/40 transition-colors">
                      <TableCell colSpan={5} className="font-semibold text-indigo-400 py-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Projeto: {project}
                        </div>
                      </TableCell>
                    </TableRow>
                    {Object.entries(assignees).map(([assignee, tasks]) => (
                      <React.Fragment key={assignee}>
                        <TableRow className="bg-slate-800/10 border-slate-800 hover:bg-slate-800/20">
                          <TableCell
                            colSpan={5}
                            className="pl-10 text-sm font-medium text-slate-300 py-2"
                          >
                            Responsável: {assignee}
                          </TableCell>
                        </TableRow>
                        {tasks.map((task) => {
                          const isOverdue = isBefore(startOfDay(new Date(task.deadline)), today)
                          return (
                            <TableRow
                              key={task.id}
                              className="border-slate-800/50 hover:bg-slate-800/30"
                            >
                              <TableCell className="pl-14 font-medium text-slate-200">
                                {task.title}
                              </TableCell>
                              <TableCell className="text-slate-400">{task.assignee}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={
                                      isOverdue
                                        ? 'text-rose-400 font-medium'
                                        : 'text-amber-400 font-medium'
                                    }
                                  >
                                    {format(new Date(task.deadline), 'dd/MM/yyyy')}
                                  </span>
                                  {isOverdue && (
                                    <Badge variant="destructive" className="text-[10px] h-5">
                                      Atrasado
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-400">{task.status}</TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant={task.priority === 'Alta' ? 'destructive' : 'secondary'}
                                  className={
                                    task.priority === 'Média'
                                      ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border-transparent'
                                      : ''
                                  }
                                >
                                  {task.priority}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
