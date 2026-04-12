import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  UploadCloud,
  File,
  Trash2,
  Clock,
  AlertTriangle,
  Activity,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
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
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function DisciplineDetails() {
  const { id, moduleId } = useParams<{ id: string; moduleId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [module, setModule] = useState<ProjectModule | null>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [uploading, setUploading] = useState(false)

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

      const moduleLogs = await pb.collection('audit_logs').getFullList({
        filter: `resource = 'project_modules' || resource = 'tasks'`,
        expand: 'user_id',
        sort: '-created',
      })

      const filteredLogs = moduleLogs.filter(
        (l) =>
          (l.resource === 'project_modules' &&
            (l.details?.module_id === moduleId || l.details?.module_name === mod.name)) ||
          (l.resource === 'tasks' &&
            moduleTasks.some(
              (t) => t.id === l.details?.task_id || t.title === l.details?.task_name,
            )),
      )
      setLogs(filteredLogs)
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
  useRealtime('audit_logs', loadData)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !module) return
    setUploading(true)
    try {
      const formData = new FormData()

      if (module.documents && module.documents.length > 0) {
        module.documents.forEach((doc) => {
          formData.append('documents', doc)
        })
      }

      Array.from(e.target.files).forEach((file) => {
        formData.append('documents', file)
      })

      await pb.collection('project_modules').update(module.id, formData)

      toast({
        title: 'Arquivos anexados',
        description: 'Os documentos foram enviados com sucesso.',
      })
      loadData()
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro no upload',
        description: err.message || 'Não foi possível enviar os arquivos.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleDeleteDoc = async (docName: string) => {
    if (!module) return
    try {
      const formData = new FormData()
      const remainingDocs = (module.documents || []).filter((d) => d !== docName)

      if (remainingDocs.length === 0) {
        formData.append('documents', '')
      } else {
        remainingDocs.forEach((doc) => {
          formData.append('documents', doc)
        })
      }

      await pb.collection('project_modules').update(module.id, formData)
      toast({ title: 'Documento removido', description: 'O arquivo foi excluído.' })
      loadData()
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o arquivo.',
        variant: 'destructive',
      })
    }
  }

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

  const hasCriticalTasks = tasks.some((t) => {
    if (t.status === 'Concluído' || !t.due_date) return false
    const daysUntilDue = differenceInDays(new Date(t.due_date), new Date())
    return daysUntilDue <= 3
  })

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl space-y-6">
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

      {hasCriticalTasks && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Atenção Necessária</h4>
            <p className="text-sm">
              Esta disciplina possui tarefas atrasadas ou com prazo de entrega para os próximos 3
              dias.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
                    <p className="font-medium flex items-center gap-2">
                      {module.deadline
                        ? format(new Date(module.deadline), 'dd/MM/yyyy')
                        : 'Não definido'}
                      {module.deadline &&
                        differenceInDays(new Date(module.deadline), new Date()) <= 3 &&
                        module.status !== 'Concluído' && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
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
                      {tasks.map((task) => {
                        const daysUntilDue = task.due_date
                          ? differenceInDays(new Date(task.due_date), new Date())
                          : null
                        const isCritical =
                          task.status !== 'Concluído' && daysUntilDue !== null && daysUntilDue <= 3

                        return (
                          <TableRow key={task.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                              {task.title}
                              {isCritical && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            </TableCell>
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
                            <TableCell
                              className={`text-right ${isCritical ? 'text-red-500 font-bold' : ''}`}
                            >
                              {task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : '-'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Arquivos da Disciplina</CardTitle>
              <CardDescription>
                Documentos, plantas e relatórios associados a este módulo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className={`border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => document.getElementById('module-file-upload')?.click()}
              >
                <div className="p-3 bg-primary/10 rounded-full mb-3">
                  <UploadCloud className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-1">
                  {uploading ? 'Enviando...' : 'Clique ou arraste arquivos para cá'}
                </h3>
                <p className="text-xs text-muted-foreground">Max 50MB por arquivo</p>
                <input
                  type="file"
                  id="module-file-upload"
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </div>

              {module.documents && module.documents.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Arquivo</TableHead>
                        <TableHead className="w-[100px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {module.documents.map((docName, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium flex items-center gap-2">
                            <File className="h-4 w-4 text-muted-foreground shrink-0" />
                            <a
                              href={pb.files.getURL(module, docName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline text-primary break-all"
                            >
                              {docName}
                            </a>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteDoc(docName)}
                              className="hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground border rounded-md bg-muted/20">
                  Nenhum documento anexado ainda.
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

          <Card className="flex flex-col h-[500px]">
            <CardHeader className="pb-3 shrink-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Histórico de Atividades
              </CardTitle>
              <CardDescription>Registro de alterações na disciplina</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-6 pb-6">
                {logs.length > 0 ? (
                  <div className="relative border-l border-muted-foreground/30 ml-3 space-y-6 pt-2">
                    {logs.map((log) => {
                      const user = log.expand?.user_id
                      return (
                        <div key={log.id} className="pl-6 relative">
                          <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1.5 ring-4 ring-background" />
                          <div className="flex flex-col gap-1 mb-1">
                            <div className="flex items-center gap-2">
                              {user && (
                                <Avatar className="h-5 w-5">
                                  <AvatarImage
                                    src={
                                      user.avatar ? pb.files.getURL(user, user.avatar) : undefined
                                    }
                                  />
                                  <AvatarFallback className="text-[10px]">
                                    {user.name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <span className="font-medium text-sm">
                                {user ? user.name : 'Sistema'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(log.created), 'dd/MM/yyyy HH:mm')}
                              </span>
                            </div>
                            <span className="text-sm text-foreground/80 mt-1">
                              {log.action === 'Create' && 'Criou este registro'}
                              {log.action === 'Update' && 'Atualizou informações'}
                              {log.action === 'Delete' && 'Removeu um registro'}
                              {log.resource === 'tasks' &&
                                ` na tarefa "${log.details?.task_name || 'Desconhecida'}"`}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhuma atividade registrada ainda.
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
