import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Briefcase,
  Clock,
  CheckSquare,
  Calendar,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  FolderKanban,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ProjectModule } from '@/types/project_modules'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Concluído':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-200 dark:border-emerald-900/50'
    case 'Em Andamento':
      return 'bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-900/50'
    case 'Atrasado':
      return 'bg-rose-500/10 text-rose-500 border-rose-200 dark:border-rose-900/50'
    default:
      return 'bg-slate-500/10 text-slate-500 border-slate-200 dark:border-slate-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Concluído':
      return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
    case 'Em Andamento':
      return <PlayCircle className="w-3.5 h-3.5 mr-1" />
    case 'Atrasado':
      return <AlertCircle className="w-3.5 h-3.5 mr-1" />
    default:
      return <PauseCircle className="w-3.5 h-3.5 mr-1" />
  }
}

export default function MeuPainel() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [modules, setModules] = useState<ProjectModule[]>([])
  const [timeLogs, setTimeLogs] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])

  const [isHoursDialogOpen, setIsHoursDialogOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [hoursLog, setHoursLog] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: '',
    description: '',
  })

  const loadData = async () => {
    if (!user) return
    try {
      const firstDay = format(startOfMonth(new Date()), 'yyyy-MM-dd')
      const lastDay = format(endOfMonth(new Date()), 'yyyy-MM-dd')

      const [mods, logs, th] = await Promise.all([
        pb.collection('project_modules').getFullList<ProjectModule>({
          filter: `responsible = "${user.id}" || designer = "${user.id}"`,
          expand: 'project',
        }),
        pb.collection('time_logs').getFullList({
          filter: `user_id = "${user.id}" && date >= "${firstDay}" && date <= "${lastDay}"`,
        }),
        pb.collection('tarefas_hierarquicas').getFullList({
          filter: `concluida = false`,
        }),
      ])

      setModules(mods)
      setTimeLogs(logs)

      const projectIds = mods.map((m) => m.project)
      setTasks(th.filter((t) => projectIds.includes(t.projeto_id)))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('project_modules', loadData)
  useRealtime('time_logs', loadData)
  useRealtime('tarefas_hierarquicas', loadData)

  const activeProjectsCount = new Set(
    modules.filter((m) => m.status !== 'Concluído').map((m) => m.project),
  ).size
  const pendingTasksCount = tasks.length
  const hoursThisMonth = timeLogs.reduce((acc, log) => acc + (log.hours || 0), 0)

  const handleLogHours = async () => {
    if (!selectedProjectId || !hoursLog.date || !hoursLog.hours) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' })
      return
    }

    try {
      await pb.collection('time_logs').create({
        user_id: user?.id,
        project_id: selectedProjectId,
        date: hoursLog.date,
        hours: Number(hoursLog.hours),
        description: hoursLog.description,
      })
      toast({ title: 'Horas registradas com sucesso!' })
      setIsHoursDialogOpen(false)
      setHoursLog({ date: format(new Date(), 'yyyy-MM-dd'), hours: '', description: '' })
    } catch (e) {
      toast({ title: 'Erro ao registrar horas', variant: 'destructive' })
    }
  }

  if (!user) return null

  return (
    <div className="flex-1 space-y-6 p-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          Meu Painel
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Bem-vindo(a), {user.name || 'Projetista'}. Aqui está o resumo das suas atribuições ativas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20 dark:bg-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Projetos Ativos</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeProjectsCount}</div>
            <p className="text-xs text-primary/70 mt-1">Projetos onde você está alocado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasksCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Em todos os seus projetos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas no Mês</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hoursThisMonth.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              Mês atual ({format(new Date(), 'MMMM', { locale: ptBR })})
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FolderKanban className="h-5 w-5" />
          Meus Projetos e Disciplinas
        </h3>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {modules.length > 0 ? (
            modules.map((mod) => (
              <Card
                key={mod.id}
                className="flex flex-col overflow-hidden hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-4 border-b">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <CardTitle className="text-lg leading-tight">
                        {mod.expand?.project?.name || 'Projeto Desconhecido'}
                      </CardTitle>
                      <CardDescription className="font-medium text-primary">
                        Disciplina: {mod.name}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(mod.status)} variant="outline">
                      {getStatusIcon(mod.status)}
                      {mod.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-5 flex-1 space-y-5">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" /> Prazo Final
                      </span>
                      <span className="font-medium">
                        {mod.deadline
                          ? format(new Date(mod.deadline), 'dd/MM/yyyy')
                          : mod.expand?.project?.end_date
                            ? format(new Date(mod.expand.project.end_date), 'dd/MM/yyyy')
                            : 'Não definido'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" /> Cliente
                      </span>
                      <span
                        className="font-medium truncate max-w-[150px]"
                        title={mod.expand?.project?.client}
                      >
                        {mod.expand?.project?.client || '-'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-slate-600 dark:text-slate-300">Progresso</span>
                      <span>{mod.progress || 0}%</span>
                    </div>
                    <Progress value={mod.progress || 0} className="h-2" />
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap gap-2">
                  <Button asChild variant="outline" className="flex-1 text-xs sm:text-sm">
                    <Link to={`/projects/${mod.project}`}>Acessar Tarefas</Link>
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1 text-xs sm:text-sm"
                    onClick={() => {
                      setSelectedProjectId(mod.project)
                      setIsHoursDialogOpen(true)
                    }}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Registrar Horas
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <FolderKanban className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Nenhum projeto encontrado
              </h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                Você não está alocado como responsável ou projetista em nenhuma disciplina no
                momento.
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isHoursDialogOpen} onOpenChange={setIsHoursDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Horas</DialogTitle>
            <DialogDescription>
              Aponte suas horas de trabalho para o projeto selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Projeto</Label>
              <Input
                value={
                  modules.find((m) => m.project === selectedProjectId)?.expand?.project?.name || ''
                }
                disabled
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={hoursLog.date}
                  onChange={(e) => setHoursLog({ ...hoursLog, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Horas (h)</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={hoursLog.hours}
                  onChange={(e) => setHoursLog({ ...hoursLog, hours: e.target.value })}
                  placeholder="Ex: 4.5"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição do Trabalho</Label>
              <Textarea
                id="description"
                value={hoursLog.description}
                onChange={(e) => setHoursLog({ ...hoursLog, description: e.target.value })}
                placeholder="Descreva brevemente o que foi realizado..."
                className="resize-none h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsHoursDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLogHours}>Salvar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
