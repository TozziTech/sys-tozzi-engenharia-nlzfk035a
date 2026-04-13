import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addWeeks,
  subWeeks,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Download,
  Briefcase,
  Layers,
  CheckSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { exportCalendarCSV } from '@/lib/export'
import { exportCalendarPDF } from '@/lib/exportPdf'

type CalendarEvent = {
  id: string
  realId: string
  title: string
  date: string
  type: 'project' | 'module' | 'task'
  status: string
  projectName?: string
  link: string
  discipline?: string
}

export default function ProjectCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([])
  const { user } = useAuth()
  const { toast } = useToast()
  const [settings, setSettings] = useState<any>(null)
  const navigate = useNavigate()

  const canEdit = user?.role === 'Administrador' || user?.role === 'Gerente de Projeto'

  useEffect(() => {
    pb.collection('company_settings')
      .getFirstListItem('')
      .then((res) => setSettings(res))
      .catch(() => {})
  }, [])

  const loadData = async () => {
    try {
      const [tasksRes, modulesRes, projectsRes] = await Promise.all([
        pb.collection('tasks').getFullList({
          expand: 'project,module',
          filter: 'due_date != ""',
        }),
        pb.collection('project_modules').getFullList({
          expand: 'project',
          filter: 'deadline != ""',
        }),
        pb.collection('projects').getFullList({
          filter: 'end_date != ""',
        }),
      ])

      const allEvents: CalendarEvent[] = []

      projectsRes.forEach((p) => {
        if (p.end_date) {
          allEvents.push({
            id: `proj_${p.id}`,
            realId: p.id,
            title: `Projeto: ${p.name}`,
            date: p.end_date.split(' ')[0],
            type: 'project',
            status: p.status,
            link: `/projects/${p.id}`,
            discipline: p.discipline,
          })
        }
      })

      modulesRes.forEach((m) => {
        if (m.deadline) {
          allEvents.push({
            id: `mod_${m.id}`,
            realId: m.id,
            title: `Disciplina: ${m.name}`,
            projectName: m.expand?.project?.name,
            date: m.deadline.split(' ')[0],
            type: 'module',
            status: m.status,
            link: `/projects/${m.project}`,
            discipline: m.name,
          })
        }
      })

      tasksRes.forEach((t) => {
        if (t.due_date) {
          allEvents.push({
            id: `task_${t.id}`,
            realId: t.id,
            title: `Tarefa: ${t.title}`,
            projectName: t.expand?.project?.name,
            date: t.due_date.split(' ')[0],
            type: 'task',
            status: t.status,
            link: `/projects/${t.project}`,
            discipline: t.expand?.module?.name,
          })
        }
      })

      setEvents(allEvents)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('tasks', () => loadData())
  useRealtime('project_modules', () => loadData())
  useRealtime('projects', () => loadData())

  const uniqueDisciplines = useMemo(() => {
    const names = new Set(events.map((e) => e.discipline).filter(Boolean) as string[])
    return Array.from(names).sort()
  }, [events])

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedDisciplines.length > 0) {
        if (!e.discipline || !selectedDisciplines.includes(e.discipline)) return false
      }
      return true
    })
  }, [events, selectedDisciplines])

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    filteredEvents.forEach((e) => {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    })
    return map
  }, [filteredEvents])

  const days = useMemo(() => {
    if (viewMode === 'month') {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
      return eachDayOfInterval({ start, end })
    } else {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 })
      const end = endOfWeek(currentDate, { weekStartsOn: 0 })
      return eachDayOfInterval({ start, end })
    }
  }, [currentDate, viewMode])

  const handlePrev = () =>
    setCurrentDate((prev) => (viewMode === 'month' ? subMonths(prev, 1) : subWeeks(prev, 1)))
  const handleNext = () =>
    setCurrentDate((prev) => (viewMode === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1)))
  const handleToday = () => setCurrentDate(new Date())

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault()
    const payload = e.dataTransfer.getData('text/plain')
    if (!payload || !canEdit) return

    const [type, realId] = payload.split('|')
    const dateStr = format(targetDate, 'yyyy-MM-dd 12:00:00.000Z')

    try {
      if (type === 'task') {
        await pb.collection('tasks').update(realId, { due_date: dateStr })
        toast({ title: 'Data da tarefa atualizada!' })
      } else if (type === 'module') {
        await pb.collection('project_modules').update(realId, { deadline: dateStr })
        toast({ title: 'Prazo da disciplina atualizado!' })
      } else if (type === 'project') {
        await pb.collection('projects').update(realId, { end_date: dateStr })
        toast({ title: 'Entrega do projeto atualizada!' })
      }
    } catch (error) {
      toast({ title: 'Erro ao atualizar data', variant: 'destructive' })
      loadData()
    }
  }

  const handleExportCSV = () => {
    exportCalendarCSV(filteredEvents as any)
  }

  const handleExportPDF = () => {
    const periodLabel =
      viewMode === 'month'
        ? format(currentDate, 'MMMM yyyy', { locale: ptBR })
        : `Semana de ${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'dd/MM')} a ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), 'dd/MM')}`
    exportCalendarPDF(filteredEvents as any, periodLabel, user?.name || 'Usuário', settings)
  }

  const handleSyncICS = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/calendar/tasks.ics`,
        { headers: { Authorization: `Bearer ${pb.authStore.token}` } },
      )
      if (!response.ok) throw new Error('Falha ao exportar')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'calendar.ics'
      a.click()
      window.URL.revokeObjectURL(url)

      toast({ title: 'Calendário exportado com sucesso!' })
    } catch (e) {
      toast({ title: 'Erro ao exportar calendário', variant: 'destructive' })
    }
  }

  const getStatusColor = (status: string, type: string) => {
    const s = status?.toLowerCase() || ''
    const isDone = s === 'concluído' || s === 'concluido'
    const isProg = s === 'em andamento'

    if (type === 'project') {
      return isDone
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300'
        : 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300'
    }

    if (isDone)
      return 'bg-green-50 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-300'
    if (isProg)
      return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300'

    return 'bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
  }

  const getTypeIcon = (type: string) => {
    if (type === 'project') return <Briefcase className="w-3 h-3 mr-1 shrink-0" />
    if (type === 'module') return <Layers className="w-3 h-3 mr-1 shrink-0" />
    return <CheckSquare className="w-3 h-3 mr-1 shrink-0" />
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            Calendário de Entregas
          </h2>
          <p className="text-muted-foreground mt-1">
            Visão unificada de prazos de projetos, disciplinas e tarefas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar / Sync</span>
                <span className="sm:hidden">Exportar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>Exportar CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>Exportar PDF</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSyncICS}>Sincronizar (ICS)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Disciplinas
                {selectedDisciplines.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                    {selectedDisciplines.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="end">
              <div className="p-3 border-b">
                <h4 className="font-medium text-sm">Filtrar por Disciplina</h4>
              </div>
              <ScrollArea className="h-64 p-3">
                <div className="space-y-3">
                  {uniqueDisciplines.map((d) => (
                    <div key={d} className="flex items-center space-x-2">
                      <Checkbox
                        id={`filter-${d}`}
                        checked={selectedDisciplines.includes(d)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedDisciplines((prev) => [...prev, d])
                          else setSelectedDisciplines((prev) => prev.filter((x) => x !== d))
                        }}
                      />
                      <label
                        htmlFor={`filter-${d}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {d}
                      </label>
                    </div>
                  ))}
                  {uniqueDisciplines.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      Nenhuma disciplina encontrada.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'month' | 'week')}>
            <TabsList>
              <TabsTrigger value="month">Mês</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex gap-4 text-xs font-medium text-muted-foreground bg-muted/40 p-3 rounded-lg border">
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-4 h-4 text-indigo-500" /> Projetos (Entrega Final)
        </div>
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-blue-500" /> Disciplinas / Módulos
        </div>
        <div className="flex items-center gap-1.5">
          <CheckSquare className="w-4 h-4 text-slate-500" /> Tarefas Individuais
        </div>
      </div>

      <Card className="shadow-sm border-muted/60">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl font-semibold capitalize">
            {viewMode === 'month'
              ? format(currentDate, 'MMMM yyyy', { locale: ptBR })
              : `Semana de ${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'dd/MM')} a ${format(
                  endOfWeek(currentDate, { weekStartsOn: 0 }),
                  'dd/MM',
                )}`}
          </CardTitle>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Button variant="outline" size="icon" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
            <div className="min-w-[800px] border rounded-lg overflow-hidden bg-muted/10">
              <div className="grid grid-cols-7 bg-muted/30 border-b">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                  <div
                    key={d}
                    className="p-3 text-center text-sm font-semibold text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div
                className={cn(
                  'grid grid-cols-7 gap-px bg-border',
                  viewMode === 'month' ? 'auto-rows-fr' : '',
                )}
              >
                {days.map((day, i) => {
                  const dateKey = format(day, 'yyyy-MM-dd')
                  const dayEvents = eventsByDate[dateKey] || []

                  // Sort: Projects > Modules > Tasks
                  dayEvents.sort((a, b) => {
                    const order = { project: 0, module: 1, task: 2 }
                    return order[a.type] - order[b.type]
                  })

                  return (
                    <div
                      key={i}
                      className={cn(
                        'min-h-[140px] p-2 bg-background transition-colors flex flex-col gap-1',
                        !isSameMonth(day, currentDate) && viewMode === 'month'
                          ? 'bg-muted/30 text-muted-foreground/50'
                          : '',
                      )}
                      onDragOver={(e) => {
                        if (canEdit) {
                          e.preventDefault()
                          e.currentTarget.classList.add('bg-muted/50')
                        }
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-muted/50')
                      }}
                      onDrop={(e) => {
                        e.currentTarget.classList.remove('bg-muted/50')
                        handleDrop(e, day)
                      }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={cn(
                            'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                            isToday(day) ? 'bg-primary text-primary-foreground shadow-sm' : '',
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                      </div>
                      <div className="space-y-1.5 flex-1 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                        {dayEvents.map((e) => (
                          <div
                            key={e.id}
                            draggable={canEdit}
                            onDragStart={(ev) => {
                              if (canEdit) {
                                ev.dataTransfer.setData('text/plain', `${e.type}|${e.realId}`)
                                ev.currentTarget.style.opacity = '0.5'
                              }
                            }}
                            onDragEnd={(ev) => {
                              ev.currentTarget.style.opacity = '1'
                            }}
                            onClick={() => navigate(e.link)}
                            className={cn(
                              'text-[11px] leading-tight p-1.5 rounded-md border shadow-sm transition-all hover:brightness-95 cursor-pointer',
                              getStatusColor(e.status, e.type),
                              e.type === 'project'
                                ? 'border-l-4 border-l-indigo-500 font-bold'
                                : '',
                              e.type === 'module' ? 'border-l-4 border-l-blue-500' : '',
                            )}
                            title={`${e.title} ${e.projectName ? `- ${e.projectName}` : ''}`}
                          >
                            <div className="flex items-start">
                              {getTypeIcon(e.type)}
                              <div className="truncate flex-1 font-semibold">{e.title}</div>
                            </div>
                            {e.projectName && (
                              <div className="text-[10px] opacity-80 truncate pl-4 mt-0.5">
                                {e.projectName}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
