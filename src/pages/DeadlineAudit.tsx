import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { AlertTriangle, ArrowRight, Calendar as CalendarIcon, FolderKanban } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { getDeadlineTasks } from '@/services/tasks'
import { useRealtime } from '@/hooks/use-realtime'

export default function DeadlineAudit() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadTasks = async () => {
    try {
      const data = await getDeadlineTasks()
      setTasks(data)
    } catch (error) {
      console.error('Failed to load deadline tasks', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  useRealtime('tasks', () => {
    loadTasks()
  })

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      Concluído: 'bg-emerald-500 hover:bg-emerald-600',
      'Em Andamento': 'bg-blue-500 hover:bg-blue-600',
      Pendente: 'bg-slate-500 hover:bg-slate-600',
      Atrasado: 'bg-red-500 hover:bg-red-600',
    }
    return (
      <Badge className={`${colors[status] || 'bg-slate-500'} text-white border-none`}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Auditoria de Prazos</h1>
          <p className="text-slate-500 mt-1">
            Acompanhamento de tarefas e módulos que estão próximos do vencimento (próximos 7 dias)
            ou atrasados.
          </p>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">Tarefas Críticas</CardTitle>
          </div>
          <CardDescription>
            Exibindo tarefas não concluídas com prazo estourado ou vencendo na próxima semana.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">
              Carregando auditoria...
            </div>
          ) : tasks.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold w-[300px]">Tarefa</TableHead>
                    <TableHead className="font-semibold">Projeto</TableHead>
                    <TableHead className="font-semibold">Disciplina</TableHead>
                    <TableHead className="font-semibold">Responsável</TableHead>
                    <TableHead className="font-semibold">Prazo</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => {
                    const isOverdue = new Date(task.due_date) < new Date()
                    return (
                      <TableRow
                        key={task.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                            <span>{task.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {task.expand?.project?.name || '-'}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {task.expand?.module?.name || '-'}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {task.expand?.responsible?.name || 'Não atribuído'}
                        </TableCell>
                        <TableCell>
                          <div
                            className={`flex items-center gap-1.5 text-sm font-medium whitespace-nowrap ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-500'}`}
                          >
                            <CalendarIcon className="w-3.5 h-3.5" />
                            {format(new Date(task.due_date), 'dd/MM/yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={isOverdue ? 'Atrasado' : task.status || 'Pendente'}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {task.project && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
                            >
                              <Link to={`/projects/${task.project}`}>
                                Ver Projeto
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">
                Nenhuma pendência crítica
              </h3>
              <p className="text-slate-500 text-sm max-w-sm">
                Todas as tarefas estão com os prazos em dia. Excelente trabalho!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
