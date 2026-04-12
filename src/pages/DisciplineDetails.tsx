import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ProjectModule } from '@/types/project_modules'

export default function DisciplineDetails() {
  const { id, moduleId } = useParams<{ id: string; moduleId: string }>()
  const navigate = useNavigate()

  const [module, setModule] = useState<ProjectModule | null>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = useCallback(async () => {
    if (!moduleId) return
    try {
      const mod = await pb.collection('project_modules').getOne<ProjectModule>(moduleId, {
        expand: 'project,responsible,designer',
      })
      setModule(mod)

      const moduleTasks = await pb.collection('tasks').getFullList({
        filter: `module = "${moduleId}"`,
        sort: 'due_date',
      })
      setTasks(moduleTasks)
    } catch (e) {
      console.error(e)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [moduleId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('project_modules', loadData)
  useRealtime('tasks', loadData)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-emerald-500 hover:bg-emerald-600 text-white'
      case 'Em Andamento':
        return 'bg-blue-500 hover:bg-blue-600 text-white'
      case 'Pausado':
        return 'bg-amber-500 hover:bg-amber-600 text-white'
      default:
        return 'bg-slate-500 hover:bg-slate-600 text-white'
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>
  }

  if (error || !module) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 space-y-4">
        <h2 className="text-2xl font-bold">Disciplina não encontrada</h2>
        <p className="text-muted-foreground">
          A disciplina que você está procurando não existe ou foi removida.
        </p>
        <Button onClick={() => navigate(`/projects/${id}`)}>Voltar para o Projeto</Button>
      </div>
    )
  }

  const responsible = module.expand?.responsible as any
  const designer = module.expand?.designer as any

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link to={`/projects/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Projeto
          </Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{module.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold">{module.name}</CardTitle>
                  {module.expand?.project && (
                    <CardDescription className="text-base mt-1">
                      Projeto: {(module.expand.project as any).name}
                    </CardDescription>
                  )}
                </div>
                <Badge className={`px-3 py-1 text-sm font-medium ${getStatusColor(module.status)}`}>
                  {module.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                      Prazo (Deadline)
                    </p>
                    <p className="font-medium">
                      {module.deadline
                        ? format(new Date(module.deadline), 'dd/MM/yyyy')
                        : 'Não definido'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <div className="w-full">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">
                      Progresso ({module.progress || 0}%)
                    </p>
                    <Progress value={module.progress || 0} className="h-2 w-full max-w-[150px]" />
                  </div>
                </div>
              </div>

              {module.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-muted-foreground text-sm font-medium mb-1">Observações</p>
                  <p className="text-sm whitespace-pre-wrap">{module.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tarefas da Disciplina</CardTitle>
              <CardDescription>Lista de tarefas associadas a este módulo.</CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Data de Vencimento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>
                            <Badge
                              variant={task.status === 'Concluído' ? 'default' : 'secondary'}
                              className={
                                task.status === 'Concluído'
                                  ? 'bg-emerald-500 hover:bg-emerald-600'
                                  : ''
                              }
                            >
                              {task.status || 'Pendente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-md bg-muted/20 text-muted-foreground">
                  Nenhuma tarefa registrada para esta disciplina.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Equipe Responsável</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Responsável (Gerente)
                </p>
                {responsible ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={
                          responsible.avatar
                            ? pb.files.getURL(responsible, responsible.avatar)
                            : `https://img.usecurling.com/ppl/thumbnail?seed=${responsible.id}`
                        }
                      />
                      <AvatarFallback>{responsible.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{responsible.name}</p>
                      <p className="text-xs text-muted-foreground">{responsible.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Não atribuído</p>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Projetista (Designer)
                </p>
                {designer ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={
                          designer.avatar
                            ? pb.files.getURL(designer, designer.avatar)
                            : `https://img.usecurling.com/ppl/thumbnail?seed=${designer.id}`
                        }
                      />
                      <AvatarFallback>{designer.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{designer.name}</p>
                      <p className="text-xs text-muted-foreground">{designer.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Não atribuído</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
