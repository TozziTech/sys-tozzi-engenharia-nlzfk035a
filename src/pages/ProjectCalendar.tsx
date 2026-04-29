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
  addDays,
  addYears,
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
  Plus,
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { exportCalendarCSV } from '@/lib/export'
import { exportCalendarPDF } from '@/lib/exportPdf'
import { StatusBadge } from '@/components/StatusBadge'

type CalendarEvent = {
  id: string
  realId: string
  title: string
  rawTitle: string
  date: string
  startDate?: string
  type: 'project' | 'module' | 'task'
  status: string
  projectName?: string
  link: string
  discipline?: string
  priority?: string
  tags?: string[]
}

const FilterPopover = ({
  title,
  options,
  selected,
  onChange,
}: {
  title: string
  options: string[]
  selected: string[]
  onChange: (val: string[]) => void
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2 border-dashed h-8">
          <Filter className="h-4 w-4" />
          {title}
          {selected.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-1 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selected.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selected.length > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selected.length} selec.
                  </Badge>
                ) : (
                  options
                    .filter((opt) => selected.includes(opt))
                    .map((opt) => (
                      <Badge
                        variant="secondary"
                        key={opt}
                        className="rounded-sm px-1 font-normal truncate max-w-[80px]"
                      >
                        {opt}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <ScrollArea className="h-64 p-3">
          <div className="space-y-3">
            {options.map((opt) => (
              <div key={opt} className="flex items-center space-x-2">
                <Checkbox
                  id={`${title}-${opt}`}
                  checked={selected.includes(opt)}
                  onCheckedChange={(checked) => {
                    if (checked) onChange([...selected, opt])
                    else onChange(selected.filter((x) => x !== opt))
                  }}
                />
                <label
                  htmlFor={`${title}-${opt}`}
                  className="text-sm font-medium leading-none cursor-pointer truncate flex-1"
                  title={opt}
                >
                  {opt}
                </label>
              </div>
            ))}
            {options.length === 0 && (
              <div className="text-sm text-muted-foreground">Nenhuma opção.</div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

export default function ProjectCalendar({
  projectId,
  embedded,
}: {
  projectId?: string
  embedded?: boolean
}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'timeline'>('month')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([])

  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [projectFilter, setProjectFilter] = useState<string[]>([])
  const [tagFilter, setTagFilter] = useState<string[]>([])

  const { user } = useAuth()
  const { toast } = useToast()
  const [settings, setSettings] = useState<any>(null)
  const navigate = useNavigate()

  const [isNewActivityOpen, setIsNewActivityOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDate, setNewTaskDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('Média')
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState('Semanal')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const canEdit = user?.role === 'Administrador' || user?.role === 'Gerente de Projeto'

  useEffect(() => {
    pb.collection('company_settings')
      .getFirstListItem('')
      .then((res) => setSettings(res))
      .catch(() => {})
  }, [])

  const loadData = async () => {
    if (!pb.authStore.isValid) return
    try {
      const [tasksRes, modulesRes, projectsRes] = await Promise.all([
        pb.collection('tasks').getFullList({
          expand: 'project,module,tags',
          filter: `due_date != ""` + (projectId ? ` && project = "${projectId}"` : ''),
        }),
        pb.collection('project_modules').getFullList({
          expand: 'project',
          filter: `deadline != ""` + (projectId ? ` && project = "${projectId}"` : ''),
        }),
        pb.collection('projects').getFullList({
          filter: `end_date != ""` + (projectId ? ` && id = "${projectId}"` : ''),
        }),
      ])

      const allEvents: CalendarEvent[] = []

      projectsRes.forEach((p) => {
        if (p.end_date) {
          allEvents.push({
            id: `proj_${p.id}`,
            realId: p.id,
            title: `Projeto: ${p.name}`,
            rawTitle: p.name,
            date: p.end_date.split(' ')[0],
            startDate: (p.start_date || p.created).split(' ')[0],
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
            rawTitle: m.name,
            projectName: m.expand?.project?.name,
            date: m.deadline.split(' ')[0],
            startDate: m.created.split(' ')[0],
            type: 'module',
            status: m.status,
            link: `/projects/${m.project}`,
            discipline: m.name,
          })
        }
      })

      tasksRes.forEach((t) => {
        if (t.due_date) {
          const tags = t.expand?.tags?.map((tag: any) => tag.name) || []
          allEvents.push({
            id: `task_${t.id}`,
            realId: t.id,
            title: `Tarefa: ${t.title}`,
            rawTitle: t.title,
            projectName: t.expand?.project?.name,
            date: t.due_date.split(' ')[0],
            startDate: t.created.split(' ')[0],
            type: 'task',
            status: t.status,
            link: `/projects/${t.project}`,
            discipline: t.expand?.module?.name,
            priority: t.priority,
            tags,
          })
        }
      })

      setEvents(allEvents)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (user?.id && pb.authStore.isValid) {
      loadData()
    }
  }, [user?.id])

  const enableSubscriptions = !!user?.id && pb.authStore.isValid

  useRealtime('tasks', () => loadData(), enableSubscriptions)
  useRealtime('project_modules', () => loadData(), enableSubscriptions)
  useRealtime('projects', () => loadData(), enableSubscriptions)

  const uniqueStatuses = useMemo(
    () => Array.from(new Set(events.map((e) => e.status).filter(Boolean))),
    [events],
  )
  const uniqueProjects = useMemo(
    () => Array.from(new Set(events.map((e) => e.projectName).filter(Boolean))),
    [events],
  )
  const uniquePriorities = ['Baixa', 'Média', 'Alta', 'Urgente']

  const uniqueTags = useMemo(
    () => Array.from(new Set(events.flatMap((e) => e.tags || []).filter(Boolean))),
    [events],
  )

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle || !newTaskDate) return

    try {
      let currentDateObj = new Date(`${newTaskDate}T12:00:00.000Z`)
      let limitDate = recurrenceEndDate
        ? new Date(`${recurrenceEndDate}T12:00:00.000Z`)
        : addMonths(currentDateObj, 12)
      const groupId = Math.random().toString(36).substring(2, 15)

      const promises = []

      while (currentDateObj <= limitDate) {
        promises.push(
          pb.collection('tasks').create({
            title: newTaskTitle,
            due_date: currentDateObj.toISOString(),
            description: newTaskDescription,
            status: 'Pendente',
            priority: newTaskPriority,
            is_recurring: isRecurring,
            frequency: isRecurring ? frequency : '',
            recurrence_group_id: isRecurring ? groupId : '',
          }),
        )

        if (!isRecurring) break

        if (frequency === 'Diário') currentDateObj = addDays(currentDateObj, 1)
        else if (frequency === 'Semanal') currentDateObj = addWeeks(currentDateObj, 1)
        else if (frequency === 'Mensal') currentDateObj = addMonths(currentDateObj, 1)
        else if (frequency === 'Anual') currentDateObj = addYears(currentDateObj, 1)
      }

      await Promise.all(promises)

      toast({ title: 'Atividade(s) criada(s) com sucesso!' })
      setIsNewActivityOpen(false)
      setNewTaskTitle('')
      setNewTaskDate(format(new Date(), 'yyyy-MM-dd'))
      setNewTaskDescription('')
      setNewTaskPriority('Média')
      setIsRecurring(false)
      setFrequency('Semanal')
      setRecurrenceEndDate('')
    } catch (error) {
      toast({ title: 'Erro ao criar atividade', variant: 'destructive' })
    }
  }

  const startEditing = (e: CalendarEvent) => {
    if (e.type === 'task' && canEdit) {
      setEditingTaskId(e.realId)
      setEditTitle(e.rawTitle)
    }
  }

  const saveEditing = async (realId: string) => {
    try {
      if (editTitle.trim()) {
        await pb.collection('tasks').update(realId, { title: editTitle.trim() })
        toast({ title: 'Atividade atualizada com sucesso!' })
      }
    } catch (err) {
      toast({ title: 'Erro ao atualizar atividade', variant: 'destructive' })
    }
    setEditingTaskId(null)
  }

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

  const monthEvents = useMemo(() => {
    return filteredEvents
      .filter((e) => {
        const d = new Date(`${e.date}T12:00:00`)
        return isSameMonth(d, currentDate)
      })
      .sort(
        (a, b) =>
          new Date(`${a.date}T12:00:00`).getTime() - new Date(`${b.date}T12:00:00`).getTime(),
      )
  }, [filteredEvents, currentDate])

  const filteredMonthEvents = useMemo(() => {
    return monthEvents.filter((e) => {
      if (statusFilter.length > 0 && !statusFilter.includes(e.status)) return false
      if (priorityFilter.length > 0 && (!e.priority || !priorityFilter.includes(e.priority)))
        return false
      if (projectFilter.length > 0 && (!e.projectName || !projectFilter.includes(e.projectName)))
        return false
      if (tagFilter.length > 0 && (!e.tags || !e.tags.some((t) => tagFilter.includes(t))))
        return false
      return true
    })
  }, [monthEvents, statusFilter, priorityFilter, projectFilter, tagFilter])

  // Timeline events handling
  const timelineDays = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    })
  }, [currentDate])

  const timelineEvents = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return filteredEvents
      .filter((e) => {
        const eEnd = new Date(`${e.date}T12:00:00`)
        const eStart = e.startDate ? new Date(`${e.startDate}T12:00:00`) : eEnd
        return eStart <= end && eEnd >= start
      })
      .filter((e) => {
        if (statusFilter.length > 0 && !statusFilter.includes(e.status)) return false
        if (priorityFilter.length > 0 && (!e.priority || !priorityFilter.includes(e.priority)))
          return false
        if (projectFilter.length > 0 && (!e.projectName || !projectFilter.includes(e.projectName)))
          return false
        if (tagFilter.length > 0 && (!e.tags || !e.tags.some((t) => tagFilter.includes(t))))
          return false
        return true
      })
      .sort(
        (a, b) =>
          new Date(`${a.date}T12:00:00`).getTime() - new Date(`${b.date}T12:00:00`).getTime(),
      )
  }, [filteredEvents, currentDate, statusFilter, priorityFilter, projectFilter, tagFilter])

  const groupedTimelineEvents = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {}
    timelineEvents.forEach((e) => {
      const key = e.projectName || 'Sem Projeto'
      if (!groups[key]) groups[key] = []
      groups[key].push(e)
    })
    return groups
  }, [timelineEvents])

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
    setCurrentDate((prev) => (viewMode === 'week' ? subWeeks(prev, 1) : subMonths(prev, 1)))
  const handleNext = () =>
    setCurrentDate((prev) => (viewMode === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1)))
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
      viewMode === 'month' || viewMode === 'timeline'
        ? format(currentDate, 'MMMM yyyy', { locale: ptBR })
        : `Semana de ${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'dd/MM')} a ${format(
            endOfWeek(currentDate, { weekStartsOn: 0 }),
            'dd/MM',
          )}`
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
    <div className={cn('flex-1 space-y-6 animate-fade-in', embedded ? 'p-0' : 'p-4 md:p-8 pt-6')}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        {!embedded ? (
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <CalendarIcon className="h-8 w-8 text-primary" />
              Calendário de Entregas
            </h2>
            <p className="text-muted-foreground mt-1">
              Visão unificada de prazos de projetos, disciplinas e tarefas.
            </p>
          </div>
        ) : (
          <div />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Dialog open={isNewActivityOpen} onOpenChange={setIsNewActivityOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova Atividade</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Nova Atividade</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateActivity} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    required
                    placeholder="Ex: Reunião de Alinhamento"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data (Início)</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newTaskDate}
                      onChange={(e) => setNewTaskDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3 p-3 border rounded-md bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="recurring" className="flex-1 cursor-pointer">
                      É recorrente?
                    </Label>
                    <Switch id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
                  </div>

                  {isRecurring && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed">
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Frequência</Label>
                        <Select value={frequency} onValueChange={setFrequency}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Diário">Diário</SelectItem>
                            <SelectItem value="Semanal">Semanal</SelectItem>
                            <SelectItem value="Mensal">Mensal</SelectItem>
                            <SelectItem value="Anual">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">Data Fim (Opcional)</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={recurrenceEndDate}
                          onChange={(e) => setRecurrenceEndDate(e.target.value)}
                          min={newTaskDate}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">Limite: 12 meses</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc">Descrição (Opcional)</Label>
                  <Textarea
                    id="desc"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Detalhes da atividade..."
                    className="resize-none"
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsNewActivityOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

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

          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as 'month' | 'week' | 'timeline')}
          >
            <TabsList>
              <TabsTrigger value="month">Mês</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="timeline">Cronograma</TabsTrigger>
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
            {viewMode === 'month' || viewMode === 'timeline'
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
          {viewMode === 'timeline' ? (
            <ScrollArea className="w-full border rounded-lg bg-card">
              <div className="min-w-[800px]">
                {/* Header */}
                <div className="flex border-b bg-muted/30 sticky top-0 z-30">
                  <div className="w-56 md:w-72 shrink-0 border-r p-3 text-sm font-semibold bg-muted/30 sticky left-0 z-30 shadow-[1px_0_0_0_hsl(var(--border))]">
                    Projeto / Atividade
                  </div>
                  <div className="flex-1 flex">
                    {timelineDays.map((d) => (
                      <div
                        key={d.toISOString()}
                        className="flex-1 border-r last:border-0 p-2 text-center text-xs font-medium text-muted-foreground min-w-[40px]"
                      >
                        <div
                          className={cn(
                            'w-6 h-6 mx-auto flex items-center justify-center rounded-full',
                            isToday(d) && 'bg-primary text-primary-foreground',
                          )}
                        >
                          {format(d, 'dd')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Body */}
                {Object.keys(groupedTimelineEvents).length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhuma atividade neste período.
                  </div>
                ) : (
                  Object.entries(groupedTimelineEvents).map(([project, evs]) => (
                    <div key={project} className="flex flex-col group/project">
                      <div className="flex bg-muted/10 border-b">
                        <div className="w-56 md:w-72 shrink-0 border-r p-2 text-sm font-semibold sticky left-0 z-20 shadow-[1px_0_0_0_hsl(var(--border))] flex items-center gap-2 bg-muted/10">
                          <Briefcase className="w-4 h-4 text-indigo-500" />
                          <span className="truncate">{project}</span>
                        </div>
                        <div className="flex-1 flex bg-muted/5">
                          {timelineDays.map((_, i) => (
                            <div key={i} className="flex-1 border-r last:border-0 min-w-[40px]" />
                          ))}
                        </div>
                      </div>
                      {evs.map((e) => {
                        const eStart = e.startDate
                          ? new Date(`${e.startDate}T12:00:00`)
                          : new Date(`${e.date}T12:00:00`)
                        const eEnd = new Date(`${e.date}T12:00:00`)
                        const monthStart = startOfMonth(currentDate)
                        const monthEnd = endOfMonth(currentDate)

                        let startCol = 1
                        if (eStart > monthStart) startCol = eStart.getDate()

                        let endCol = timelineDays.length + 1
                        if (eEnd <= monthEnd) endCol = eEnd.getDate() + 1

                        if (startCol >= endCol) startCol = endCol - 1

                        const leftPct = ((startCol - 1) / timelineDays.length) * 100
                        const widthPct = Math.max(
                          ((endCol - startCol) / timelineDays.length) * 100,
                          (1 / timelineDays.length) * 100,
                        )

                        return (
                          <div key={e.id} className="flex border-b last:border-0 hover:bg-muted/5">
                            <div className="w-56 md:w-72 shrink-0 border-r p-2 pl-6 text-xs truncate flex items-center gap-2 bg-background sticky left-0 z-20 shadow-[1px_0_0_0_hsl(var(--border))]">
                              {getTypeIcon(e.type)}
                              <span
                                className={cn(
                                  'truncate',
                                  canEdit &&
                                    e.type === 'task' &&
                                    'cursor-pointer hover:underline text-primary',
                                )}
                                onClick={() => startEditing(e)}
                                title={e.rawTitle}
                              >
                                {e.rawTitle}
                              </span>
                            </div>
                            <div className="flex-1 flex relative">
                              {/* Grid lines */}
                              {timelineDays.map((_, i) => (
                                <div
                                  key={i}
                                  className="flex-1 border-r last:border-0 min-h-10 min-w-[40px]"
                                />
                              ))}
                              {/* Timeline Bar */}
                              <div
                                className="absolute top-1.5 bottom-1.5 flex items-center px-1 z-10"
                                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        'h-full w-full rounded shadow-sm border text-[10px] flex items-center px-1.5 truncate cursor-pointer transition-all hover:brightness-95',
                                        getStatusColor(e.status, e.type),
                                      )}
                                      onClick={() => navigate(e.link)}
                                    >
                                      <span className="truncate font-medium">{e.rawTitle}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-semibold">{e.rawTitle}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Início: {format(eStart, 'dd/MM/yyyy')}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Entrega: {format(eEnd, 'dd/MM/yyyy')}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Status: {e.status}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
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
                              title={`${e.rawTitle} ${e.projectName ? `- ${e.projectName}` : ''}`}
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
          )}
        </CardContent>
      </Card>

      <div className="mt-8 space-y-4 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-bold">Atividades do Mês</h3>
          <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-1.5 rounded-md border">
            <FilterPopover
              title="Status"
              options={uniqueStatuses}
              selected={statusFilter}
              onChange={setStatusFilter}
            />
            <FilterPopover
              title="Prioridade"
              options={uniquePriorities}
              selected={priorityFilter}
              onChange={setPriorityFilter}
            />
            {!projectId && (
              <FilterPopover
                title="Projeto"
                options={uniqueProjects}
                selected={projectFilter}
                onChange={setProjectFilter}
              />
            )}
            <FilterPopover
              title="Categoria/Tags"
              options={uniqueTags}
              selected={tagFilter}
              onChange={setTagFilter}
            />
          </div>
        </div>

        {filteredMonthEvents.length === 0 ? (
          <div className="p-8 text-center border rounded-lg border-dashed bg-muted/20">
            <p className="text-muted-foreground">Nenhuma atividade encontrada para este período.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMonthEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-start justify-between p-4 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow gap-4"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted text-muted-foreground font-bold shrink-0 mt-0.5">
                    {format(new Date(`${e.date}T12:00:00`), 'dd')}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {editingTaskId === e.realId && e.type === 'task' ? (
                        <Input
                          autoFocus
                          value={editTitle}
                          onChange={(ev) => setEditTitle(ev.target.value)}
                          onBlur={() => saveEditing(e.realId)}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter') saveEditing(e.realId)
                            if (ev.key === 'Escape') setEditingTaskId(null)
                          }}
                          className="h-7 py-1 px-2 text-sm font-semibold max-w-[200px]"
                        />
                      ) : (
                        <span
                          className={cn(
                            'font-semibold text-sm truncate',
                            e.type === 'task' &&
                              canEdit &&
                              'cursor-pointer hover:underline text-primary',
                          )}
                          onClick={() => startEditing(e)}
                          title={e.rawTitle}
                        >
                          {e.rawTitle}
                        </span>
                      )}
                      {e.priority && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] px-1 py-0 h-4 tracking-wider uppercase shrink-0',
                            e.priority === 'Urgente'
                              ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400'
                              : e.priority === 'Alta'
                                ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400'
                                : e.priority === 'Média'
                                  ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
                                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
                          )}
                        >
                          {e.priority}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs flex flex-wrap items-center gap-1.5 text-muted-foreground mt-0.5">
                      <span className="font-medium whitespace-nowrap">
                        {format(new Date(`${e.date}T12:00:00`), 'dd/MM/yyyy')}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        {getTypeIcon(e.type)}
                        {e.type === 'project'
                          ? 'Projeto'
                          : e.type === 'module'
                            ? 'Disciplina'
                            : 'Tarefa'}
                      </span>
                      {e.projectName && <span className="truncate"> • {e.projectName}</span>}
                    </span>
                    {e.tags && e.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {e.tags.map((t) => (
                          <Badge
                            key={t}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-4 font-normal"
                          >
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={e.status as any} endDate={e.date} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
