import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarIcon,
  Download,
  Clock,
  CheckCircle2,
  ListTodo,
  Presentation,
  Calendar as CalIcon,
  ExternalLink,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { exportMeetingsDashboardPDF } from '@/lib/exportPdf'
import { useAuth } from '@/hooks/use-auth'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { DateRange } from 'react-day-picker'

export default function MeetingsDashboard() {
  const { user } = useAuth()
  const { settings } = useSettingsStore()

  const [meetings, setMeetings] = useState<any[]>([])
  const [actions, setActions] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])

  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  useEffect(() => {
    pb.collection('projects').getFullList({ sort: 'name' }).then(setProjects)
    pb.collection('meetings')
      .getFullList({ expand: 'project', sort: '-date_time' })
      .then(setMeetings)
    pb.collection('meeting_actions')
      .getFullList({
        expand: 'responsible,meeting,meeting.project,task',
        sort: '-created',
      })
      .then(setActions)
  }, [])

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (selectedProject !== 'all' && m.project !== selectedProject) return false
      if (dateRange?.from) {
        if (!m.date_time) return false
        const d = parseISO(m.date_time)
        if (d < dateRange.from) return false
        if (dateRange.to && d > dateRange.to) return false
      }
      return true
    })
  }, [meetings, selectedProject, dateRange])

  const filteredActions = useMemo(() => {
    return actions.filter((a) => {
      const meeting = a.expand?.meeting
      if (selectedProject !== 'all' && meeting?.project !== selectedProject) return false
      if (dateRange?.from) {
        if (!meeting?.date_time) return false
        const d = parseISO(meeting.date_time)
        if (d < dateRange.from) return false
        if (dateRange.to && d > dateRange.to) return false
      }
      return true
    })
  }, [actions, selectedProject, dateRange])

  const upcomingMeetings = filteredMeetings.filter(
    (m) => m.status === 'Pendente' || m.status === 'Em Andamento',
  )
  const recentMeetings = filteredMeetings.filter((m) => m.status === 'Realizada').slice(0, 10)
  const pendingActions = filteredActions.filter(
    (a) => a.status === 'Pendente' || a.status === 'Em Progresso',
  )

  const avgTime =
    filteredMeetings.length > 0
      ? filteredMeetings.reduce((sum, m) => sum + (m.duration || 0), 0) / filteredMeetings.length
      : 0

  const meetingsPerMonth = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredMeetings.forEach((m) => {
      if (!m.date_time) return
      const month = format(parseISO(m.date_time), 'MMM yy', { locale: ptBR })
      counts[month] = (counts[month] || 0) + 1
    })
    return Object.entries(counts)
      .map(([month, count]) => ({ month, count }))
      .reverse()
  }, [filteredMeetings])

  const actionStats = useMemo(() => {
    const pendentes = pendingActions.length
    const concluidos = filteredActions.filter((a) => a.status === 'Concluído').length
    return [
      { name: 'Concluído', value: concluidos, fill: 'hsl(var(--primary))' },
      { name: 'Pendente', value: pendentes, fill: 'hsl(var(--destructive))' },
    ]
  }, [filteredActions, pendingActions.length])

  const handleExport = () => {
    const periodLabel = dateRange?.from
      ? `De ${format(dateRange.from, 'dd/MM/yyyy')} até ${dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : '...'}`
      : 'Todo o período'

    exportMeetingsDashboardPDF(
      {
        upcoming: upcomingMeetings,
        recent: recentMeetings.slice(0, 5),
        actions: pendingActions,
        metrics: { avgTime, totalMeetings: filteredMeetings.length },
        periodLabel,
      },
      user?.name || 'Usuário',
      settings,
    )
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Reuniões</h1>
          <p className="text-muted-foreground">
            Acompanhe estatísticas, compromissos e pendências.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por Projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Projetos</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[260px] justify-start text-left font-normal',
                  !dateRange && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
                    </>
                  ) : (
                    format(dateRange.from, 'dd/MM/yyyy')
                  )
                ) : (
                  <span>Período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <Button onClick={handleExport} variant="default" className="gap-2">
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total de Reuniões</CardTitle>
            <Presentation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredMeetings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgTime)} min</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Ações Pendentes</CardTitle>
            <ListTodo className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{pendingActions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Ações Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{actionStats[0].value}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-8">
        <div className="md:col-span-4 lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Próximas Reuniões</CardTitle>
              <CardDescription>Reuniões agendadas que ainda não ocorreram.</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingMeetings.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Nenhuma reunião futura agendada.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {upcomingMeetings.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl border bg-card p-4 shadow-sm flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold leading-tight line-clamp-2">{m.title}</h4>
                          <Badge variant={m.status === 'Em Andamento' ? 'default' : 'secondary'}>
                            {m.status}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground gap-2">
                          <CalIcon className="h-3 w-3" />
                          {m.date_time ? format(parseISO(m.date_time), "dd/MM 'às' HH:mm") : '-'}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground gap-2">
                          <Presentation className="h-3 w-3" />
                          {m.expand?.project?.name || 'Sem projeto'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="flex -space-x-2">
                          {(m.participants || []).slice(0, 3).map((pId: string, i: number) => (
                            <Avatar key={i} className="h-6 w-6 border-2 border-background">
                              <AvatarFallback className="text-[10px]">P{i}</AvatarFallback>
                            </Avatar>
                          ))}
                          {(m.participants || []).length > 3 && (
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium border-2 border-background">
                              +{(m.participants || []).length - 3}
                            </div>
                          )}
                        </div>
                        {m.meet_link ? (
                          <Button size="sm" asChild variant="outline">
                            <a href={m.meet_link} target="_blank" rel="noreferrer">
                              Participar
                            </a>
                          </Button>
                        ) : (
                          <Button size="sm" asChild variant="outline">
                            <Link to={`/admin/reunioes/${m.id}`}>Detalhes</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações Pendentes</CardTitle>
              <CardDescription>Tarefas e responsabilidades geradas nas reuniões.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingActions.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Nenhuma ação pendente no momento.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Descrição</th>
                        <th className="px-4 py-3">Prazo</th>
                        <th className="px-4 py-3">Responsável</th>
                        <th className="px-4 py-3 rounded-tr-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pendingActions.map((a) => (
                        <tr key={a.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium">{a.description}</div>
                            {a.task && a.expand?.task && (
                              <Link
                                to={`/meu-painel`}
                                className="text-[10px] flex items-center gap-1 text-primary mt-1 hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" /> Ver Tarefa:{' '}
                                {a.expand.task.title}
                              </Link>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {a.due_date ? format(parseISO(a.due_date), 'dd/MM/yyyy') : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px]">
                                  {a.expand?.responsible?.name?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-[120px]">
                                {a.expand?.responsible?.name || 'Desconhecido'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={a.status === 'Pendente' ? 'destructive' : 'secondary'}>
                              {a.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico Recente</CardTitle>
              <CardDescription>Últimas reuniões finalizadas.</CardDescription>
            </CardHeader>
            <CardContent>
              {recentMeetings.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Sem histórico de reuniões.
                </p>
              ) : (
                <div className="space-y-4">
                  {recentMeetings.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-4 border-b last:border-0 pb-4 last:pb-0"
                    >
                      <div className="space-y-1 overflow-hidden">
                        <p className="text-sm font-medium leading-none truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalIcon className="h-3 w-3" />
                          {m.date_time ? format(parseISO(m.date_time), 'dd/MM/yy') : '-'} •{' '}
                          {m.expand?.project?.name || 'Sem proj'}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="shrink-0">
                        <Link to={`/admin/reunioes/${m.id}`}>Atas</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reuniões por Mês</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ChartContainer config={{}} className="h-full w-full">
                <BarChart
                  data={meetingsPerMonth}
                  margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
                >
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name="Reuniões"
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resolução de Ações</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] flex items-center justify-center">
              <ChartContainer config={{}} className="h-full w-full max-w-[200px]">
                <PieChart>
                  <Tooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={actionStats}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    stroke="none"
                  >
                    {actionStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
