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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { format, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns'
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
  Info,
  FileText,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlanilhaFinanceira } from '@/components/meu-painel/PlanilhaFinanceira'
import { NoteCard } from '@/components/NoteCard'
import { MyTasksList } from '@/components/meu-painel/MyTasksList'
import { cn } from '@/lib/utils'

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

type DashboardProject = {
  id: string
  name: string
  discipline: string
  status: string
  end_date: string
  progress: number
  client: string
}

// Mock Data Generators
const MOCK_PROJECTS: DashboardProject[] = [
  {
    id: 'mock-1',
    name: 'Residencial Aurora',
    discipline: 'Estrutural',
    status: 'Em Andamento',
    end_date: addDays(new Date(), 15).toISOString(),
    progress: 65,
    client: 'Construtora Alpha',
  },
  {
    id: 'mock-2',
    name: 'Edifício Comercial Beta',
    discipline: 'Elétrica',
    status: 'Atrasado',
    end_date: subDays(new Date(), 5).toISOString(),
    progress: 80,
    client: 'Beta Empreendimentos',
  },
  {
    id: 'mock-3',
    name: 'Galpão Logístico Gama',
    discipline: 'Hidrossanitário',
    status: 'Concluído',
    end_date: subDays(new Date(), 20).toISOString(),
    progress: 100,
    client: 'Logística Gama',
  },
]

const MOCK_TASKS = [
  { id: 't1', projeto_id: 'mock-1', titulo: 'Revisão de Cargas', concluida: false },
  { id: 't2', projeto_id: 'mock-1', titulo: 'Detalhamento de Vigas', concluida: false },
  { id: 't3', projeto_id: 'mock-2', titulo: 'Quadro de Força', concluida: false },
  { id: 't4', projeto_id: 'mock-2', titulo: 'Projeto Luminotécnico', concluida: false },
]

const MOCK_TIME_LOGS = [
  { id: 'l1', project_id: 'mock-1', hours: 4.5, date: new Date().toISOString() },
  { id: 'l2', project_id: 'mock-2', hours: 3.0, date: new Date().toISOString() },
  { id: 'l3', project_id: 'mock-1', hours: 6.0, date: new Date().toISOString() },
]

export default function MeuPainel() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [projects, setProjects] = useState<DashboardProject[]>([])
  const [timeLogs, setTimeLogs] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [isUsingMock, setIsUsingMock] = useState(false)

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

      const [engineerProjects, mods, logs, th] = await Promise.all([
        pb.collection('projects').getFullList({
          filter: `engineer ~ "${user.name}"`,
        }),
        pb.collection('project_modules').getFullList({
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

      const projectMap = new Map<string, DashboardProject>()

      engineerProjects.forEach((p: any) => {
        projectMap.set(p.id, {
          id: p.id,
          name: p.name,
          discipline: p.discipline || 'Geral',
          status: p.status,
          end_date: p.end_date,
          progress: p.progress || 0,
          client: p.client || '-',
        })
      })

      mods.forEach((m: any) => {
        if (m.expand?.project && !projectMap.has(m.expand.project.id)) {
          projectMap.set(m.expand.project.id, {
            id: m.expand.project.id,
            name: m.expand.project.name,
            discipline: m.expand.project.discipline || m.name,
            status: m.expand.project.status,
            end_date: m.expand.project.end_date,
            progress: m.expand.project.progress || 0,
            client: m.expand.project.client || '-',
          })
        }
      })

      const uniqueProjects = Array.from(projectMap.values())

      if (uniqueProjects.length === 0) {
        setProjects(MOCK_PROJECTS)
        setTasks(MOCK_TASKS)
        setTimeLogs(MOCK_TIME_LOGS)
        setIsUsingMock(true)
      } else {
        setProjects(uniqueProjects)
        const projectIds = uniqueProjects.map((p) => p.id)
        setTasks(
          th.filter(
            (t: any) => projectIds.includes(t.projeto_id) || projectIds.includes(t.project),
          ),
        )
        setTimeLogs(logs)
        setIsUsingMock(false)
      }
    } catch (e) {
      console.error(e)
      setProjects(MOCK_PROJECTS)
      setTasks(MOCK_TASKS)
      setTimeLogs(MOCK_TIME_LOGS)
      setIsUsingMock(true)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('projects', loadData)
  useRealtime('project_modules', loadData)
  useRealtime('time_logs', loadData)
  useRealtime('tarefas_hierarquicas', loadData)

  const activeProjectsCount = projects.filter((p) => p.status !== 'Concluído').length
  const pendingTasksCount = tasks.length
  const hoursThisMonth = timeLogs.reduce((acc, log) => acc + (Number(log.hours) || 0), 0)

  const handleLogHours = async () => {
    if (!selectedProjectId || !hoursLog.date || !hoursLog.hours) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' })
      return
    }

    if (isUsingMock) {
      setTimeLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          project_id: selectedProjectId,
          hours: Number(hoursLog.hours),
          date: hoursLog.date,
        },
      ])
      toast({ title: 'Horas registradas com sucesso (Modo Demo)!' })
      setIsHoursDialogOpen(false)
      setHoursLog({ date: format(new Date(), 'yyyy-MM-dd'), hours: '', description: '' })
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
    <div className="flex-1 space-y-6 p-6 pb-20 animate-in fade-in duration-500 w-full mx-auto">
      <Tabs defaultValue="dashboard" className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              Meu Painel
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Bem-vindo(a), {user.name || 'Projetista'}. Aqui está o resumo das suas atribuições
              ativas.
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="financeiro">Planilha Financeira</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="space-y-6">
          {isUsingMock && (
            <Alert className="bg-blue-50/50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
              <Info className="h-4 w-4" />
              <AlertTitle>Modo de Demonstração</AlertTitle>
              <AlertDescription>
                Você ainda não possui projetos atribuídos na base de dados. Exibindo dados de
                exemplo para demonstração.
              </AlertDescription>
            </Alert>
          )}

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
              Meus Projetos
            </h3>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((proj) => (
                <Card
                  key={proj.id}
                  className="flex flex-col overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-4 border-b">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5 pr-2">
                        <CardTitle className="text-lg leading-tight line-clamp-2">
                          {proj.name}
                        </CardTitle>
                        <CardDescription className="font-medium text-primary">
                          Disciplina: {proj.discipline}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(proj.status || '')} variant="outline">
                        {getStatusIcon(proj.status || '')}
                        {proj.status || 'Pendente'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="py-5 flex-1 space-y-5">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" /> Prazo
                        </span>
                        <span className="font-medium">
                          {proj.end_date
                            ? format(new Date(proj.end_date), 'dd/MM/yyyy')
                            : 'Não definido'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4" /> Cliente
                        </span>
                        <span className="font-medium truncate max-w-[150px]" title={proj.client}>
                          {proj.client}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-slate-600 dark:text-slate-300">Progresso</span>
                        <span>{proj.progress || 0}%</span>
                      </div>
                      <Progress value={proj.progress || 0} className="h-2" />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4 border-t bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap gap-2">
                    <Button asChild variant="outline" className="flex-1 text-xs sm:text-sm">
                      <Link to={`/projects/${proj.id}`}>Acessar Tarefas</Link>
                    </Button>
                    <Button
                      variant="default"
                      className="flex-1 text-xs sm:text-sm"
                      onClick={() => {
                        setSelectedProjectId(proj.id)
                        setIsHoursDialogOpen(true)
                      }}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Registrar Horas
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>

          <MyTasksList />

          <div className="flex justify-center w-full relative mt-8">
            <NoteCard />
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
                    value={projects.find((p) => p.id === selectedProjectId)?.name || ''}
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
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-6">
          <PlanilhaFinanceira />
        </TabsContent>
      </Tabs>
    </div>
  )
}
