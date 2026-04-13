import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle,
  UploadCloud,
  File,
  Trash2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Activity,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Search,
  GripVertical,
  PlusCircle,
} from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  format,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProjectModule } from '@/types/project_modules'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ModuleVersions } from '@/components/ModuleVersions'
import { TaskSheet } from '@/components/TaskSheet'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useAuth } from '@/hooks/use-auth'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { HelpCircle, Columns, Download, X } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

// Funções de exportação (placeholders preventivos para evitar erros de compilação)
const exportDisciplineTasksCSV = (tasks: any[], moduleName: string) => {
  console.log('Export CSV', tasks, moduleName)
}
const exportDisciplineTasksPDF = (tasks: any[], moduleName: string, userName: string) => {
  console.log('Export PDF', tasks, moduleName, userName)
}

export default function DisciplineDetails() {
  const { id, moduleId } = useParams<{ id: string; moduleId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [module, setModule] = useState<ProjectModule | null>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Filtering State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  // Task Editing State
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false)

  const { user } = useAuth()

  // Inline Editing State
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editTitleValue, setEditTitleValue] = useState('')

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState({
    descricao: true,
    responsavel: true,
    status: true,
    data: true,
    acoes: true,
  })

  // Drag and Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)

  // Notes edit state
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editNotesValue, setEditNotesValue] = useState('')

  // Batch actions state
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [lastSelectedTaskId, setLastSelectedTaskId] = useState<string | null>(null)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeTaskTab, setActiveTaskTab] = useState('list')

  const isShiftPressed = useRef(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') isShiftPressed.current = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') isShiftPressed.current = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const loadData = useCallback(async () => {
    if (!moduleId) return
    try {
      const mod = await pb.collection('project_modules').getOne<ProjectModule>(moduleId, {
        expand: 'project,responsible,designer',
      })
      setModule(mod)

      const [moduleTasks, usersList] = await Promise.all([
        pb.collection('tasks').getFullList({
          filter: `module = "${moduleId}"`,
          sort: 'ordem,due_date',
          expand: 'responsible',
        }),
        pb.collection('users').getFullList({ sort: 'name' }),
      ])

      setTasks(moduleTasks)
      setUsers(usersList)

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

  const handleSaveTitle = async (taskId: string) => {
    if (editingTitleId !== taskId) return
    if (!editTitleValue.trim()) {
      setEditingTitleId(null)
      return
    }
    try {
      await pb.collection('tasks').update(taskId, { title: editTitleValue })
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, title: editTitleValue } : t)))
      toast({ title: 'Título atualizado' })
    } catch (e: any) {
      toast({
        title: 'Erro ao atualizar título',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setEditingTitleId(null)
    }
  }

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

  const handleSaveNotes = async () => {
    if (!module) return
    try {
      await pb.collection('project_modules').update(module.id, { notes: editNotesValue })
      setModule({ ...module, notes: editNotesValue })
      setIsEditingNotes(false)
      toast({ title: 'Observações atualizadas', description: 'O texto foi salvo com sucesso.' })
    } catch (e: any) {
      console.error(e)
      toast({ title: 'Erro', description: 'Falha ao salvar observações.', variant: 'destructive' })
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

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (taskId !== dragOverTaskId) {
      setDragOverTaskId(taskId)
    }
  }

  const onDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedTaskId || draggedTaskId === targetId) {
      setDraggedTaskId(null)
      setDragOverTaskId(null)
      return
    }

    const fullTasks = [...tasks]
    const draggedIdx = fullTasks.findIndex((t) => t.id === draggedTaskId)
    const targetIdx = fullTasks.findIndex((t) => t.id === targetId)

    if (draggedIdx === -1 || targetIdx === -1) return

    const [draggedItem] = fullTasks.splice(draggedIdx, 1)
    fullTasks.splice(targetIdx, 0, draggedItem)

    setTasks(fullTasks)
    setDraggedTaskId(null)
    setDragOverTaskId(null)

    try {
      await Promise.all(
        fullTasks.map((t, index) => {
          if (t.ordem !== index) {
            t.ordem = index
            return pb.collection('tasks').update(t.id, { ordem: index })
          }
        }),
      )

      if (id) {
        try {
          const thList = await pb.collection('tarefas_hierarquicas').getFullList({
            filter: `projeto_id = "${id}"`,
          })
          await Promise.all(
            fullTasks.map(async (t, index) => {
              const th = thList.find((x) => x.titulo === t.title)
              if (th && th.ordem !== index) {
                await pb.collection('tarefas_hierarquicas').update(th.id, { ordem: index })
              }
            }),
          )
        } catch (thErr) {
          console.warn('Silent fail syncing tarefas_hierarquicas', thErr)
        }
      }
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro', description: 'Erro ao reordenar tarefas', variant: 'destructive' })
      loadData()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-emerald-500 hover:bg-emerald-600 text-white'
      case 'Em Andamento':
        return 'bg-blue-500 hover:bg-blue-600 text-white'
      case 'Atrasado':
        return 'bg-red-500 hover:bg-red-600 text-white'
      case 'Revisão':
        return 'bg-purple-500 hover:bg-purple-600 text-white'
      case 'Não Realizado':
        return 'bg-gray-500 hover:bg-gray-600 text-white'
      case 'Espera':
        return 'bg-orange-500 hover:bg-orange-600 text-white'
      case 'Pausado':
        return 'bg-amber-500 hover:bg-amber-600 text-white'
      case 'Pendente':
      default:
        return 'bg-slate-500 hover:bg-slate-600 text-white'
    }
  }

  const getUrgencyInfo = (task: any) => {
    if (task.status === 'Concluído' || !task.due_date) return { level: 'none' }

    const due = new Date(task.due_date)
    const now = new Date()
    const diffMs = due.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours < 0) {
      return {
        level: 'overdue',
        label: 'Atrasado',
        color: 'text-red-700 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-950/40',
        icon: AlertCircle,
      }
    }
    if (diffHours <= 24) {
      return {
        level: 'urgent',
        label: 'Urgente (< 24h)',
        color: 'text-orange-700 dark:text-orange-400',
        bg: 'bg-orange-100 dark:bg-orange-950/40',
        icon: Clock,
      }
    }

    return { level: 'none' }
  }

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const handleBulkStatusChange = async (status: string) => {
    setLoading(true)
    try {
      await Promise.all(selectedTaskIds.map((id) => pb.collection('tasks').update(id, { status })))
      toast({
        title: 'Status atualizado',
        description: `${selectedTaskIds.length} tarefas atualizadas para ${status}.`,
      })
      setSelectedTaskIds([])
      setLastSelectedTaskId(null)
      loadData()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar as tarefas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    setLoading(true)
    try {
      await Promise.all(selectedTaskIds.map((id) => pb.collection('tasks').delete(id)))
      toast({
        title: 'Tarefas excluídas',
        description: `${selectedTaskIds.length} tarefas foram excluídas com sucesso.`,
      })
      setSelectedTaskIds([])
      setLastSelectedTaskId(null)
      setIsBulkDeleteDialogOpen(false)
      loadData()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir as tarefas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
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

  const isFilterActive = searchQuery !== '' || statusFilter !== 'All'
  const isFocusedView = activeTaskTab === 'focused'
  const filteredTasks = tasks.filter((task) => {
    const matchSearch =
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus =
      statusFilter === 'All' ||
      task.status === statusFilter ||
      (statusFilter === 'Pendente' && !task.status)
    return matchSearch && matchStatus
  })

  const totalTasks = tasks.length
  const concludedTasks = tasks.filter((t) => t.status === 'Concluído').length
  const inProgressTasks = tasks.filter((t) => t.status === 'Em Andamento').length
  const pendingTasks = tasks.filter((t) => !t.status || t.status === 'Pendente').length

  const chartData = [
    { name: 'Concluído', value: concludedTasks, fill: 'var(--color-concluido)' },
    { name: 'Em Andamento', value: inProgressTasks, fill: 'var(--color-andamento)' },
    { name: 'Pendente', value: pendingTasks, fill: 'var(--color-pendente)' },
  ].filter((d) => d.value > 0)

  const chartConfig = {
    concluido: { label: 'Concluído', color: 'hsl(var(--chart-2, 142 71% 45%))' },
    andamento: { label: 'Em Andamento', color: 'hsl(var(--chart-1, 221 83% 53%))' },
    pendente: { label: 'Pendente', color: 'hsl(var(--chart-3, 215 16% 47%))' },
  }

  const allSelected = filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTaskIds(filteredTasks.map((t) => t.id))
    } else {
      setSelectedTaskIds([])
      setLastSelectedTaskId(null)
    }
  }

  const handleSelectRow = (taskId: string, checked: boolean) => {
    if (isShiftPressed.current && lastSelectedTaskId) {
      const currentIndex = filteredTasks.findIndex((t) => t.id === taskId)
      const lastIndex = filteredTasks.findIndex((t) => t.id === lastSelectedTaskId)

      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex)
        const end = Math.max(currentIndex, lastIndex)

        const tasksInRange = filteredTasks.slice(start, end + 1).map((t) => t.id)

        if (checked) {
          setSelectedTaskIds((prev) => Array.from(new Set([...prev, ...tasksInRange])))
        } else {
          setSelectedTaskIds((prev) => prev.filter((id) => !tasksInRange.includes(id)))
        }
      }
    } else {
      if (checked) {
        setSelectedTaskIds((prev) => [...prev, taskId])
      } else {
        setSelectedTaskIds((prev) => prev.filter((id) => id !== taskId))
      }
    }

    setLastSelectedTaskId(taskId)
  }

  return (
    <div
      className={cn(
        'container mx-auto p-4 md:p-6 space-y-6 print:p-0 print:m-0 print:max-w-none print:space-y-0 transition-all duration-300',
        isFocusedView ? 'max-w-full' : 'max-w-6xl',
      )}
    >
      <div className={cn('flex items-center gap-2 mb-6 print:hidden', isFocusedView && 'hidden')}>
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link to={`/projects/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Projeto
          </Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{module.name}</span>
      </div>

      {hasCriticalTasks && !isFocusedView && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300 p-4 rounded-lg flex items-start gap-3 print:hidden">
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

      {!isFocusedView && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 print:hidden">
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                {concludedTasks}
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                {inProgressTasks}
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                {pendingTasks}
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-4 lg:col-span-1">
            <CardHeader className="pb-0 pt-3">
              <CardTitle className="text-xs font-medium text-muted-foreground text-center">
                Progresso
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex items-center justify-center h-[80px]">
              {totalTasks > 0 ? (
                <ChartContainer
                  config={chartConfig}
                  className="h-[80px] w-full max-w-[120px] aspect-square"
                >
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={20}
                      outerRadius={35}
                      strokeWidth={2}
                      paddingAngle={2}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="text-xs text-muted-foreground flex h-full items-center">
                  Sem dados
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div
        className={cn(
          'grid grid-cols-1 gap-6 print:block print:gap-0',
          isFocusedView ? '' : 'lg:grid-cols-3',
        )}
      >
        <div className={cn('space-y-6 print:space-y-0', isFocusedView ? '' : 'lg:col-span-2')}>
          {!isFocusedView && (
            <Card className="print:hidden">
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
                  <Badge
                    className={`px-3 py-1 text-sm font-medium ${getStatusColor(module.status)}`}
                  >
                    {module.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
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

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-muted-foreground text-sm font-medium">Observações</p>
                    {!isEditingNotes && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => {
                          setEditNotesValue(module.notes || '')
                          setIsEditingNotes(true)
                        }}
                      >
                        <Edit2 className="h-3 w-3 mr-1" /> Editar
                      </Button>
                    )}
                  </div>
                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editNotesValue}
                        onChange={(e) => setEditNotesValue(e.target.value)}
                        className="min-h-[100px] text-sm"
                        placeholder="Adicione observações aqui..."
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingNotes(false)}
                        >
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={handleSaveNotes}>
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-sm whitespace-pre-wrap cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded-md transition-colors min-h-[40px]"
                      onClick={() => {
                        setEditNotesValue(module.notes || '')
                        setIsEditingNotes(true)
                      }}
                    >
                      {module.notes || (
                        <span className="text-muted-foreground italic">
                          Nenhuma observação registrada. Clique para adicionar.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card
            className={cn(
              'print:hidden',
              isFocusedView && 'border-none shadow-none bg-transparent',
            )}
          >
            {!isFocusedView && (
              <CardHeader className="pb-4">
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Tarefas da Disciplina</CardTitle>
                    <CardDescription>Lista e cronograma das atividades do módulo.</CardDescription>
                  </div>
                </div>
              </CardHeader>
            )}
            <CardContent className={cn(isFocusedView && 'p-0')}>
              <Tabs
                value={activeTaskTab === 'focused' ? 'list' : activeTaskTab}
                onValueChange={setActiveTaskTab}
                className="w-full"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <TabsList>
                    <TabsTrigger
                      value="list"
                      onClick={() => setActiveTaskTab('list')}
                      className={cn(
                        activeTaskTab === 'focused' &&
                          '!bg-transparent !text-muted-foreground !shadow-none',
                      )}
                    >
                      Lista
                    </TabsTrigger>
                    <TabsTrigger value="calendar" onClick={() => setActiveTaskTab('calendar')}>
                      Calendário
                    </TabsTrigger>
                    <TabsTrigger
                      value="focused"
                      onClick={() => setActiveTaskTab('focused')}
                      className={cn(
                        activeTaskTab === 'focused' && 'bg-background text-foreground shadow-sm',
                      )}
                    >
                      Visão Focada
                    </TabsTrigger>
                  </TabsList>
                  {isFocusedView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTaskTab('list')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Sair da Visão Focada
                    </Button>
                  )}
                </div>

                <TabsContent value="list" className="mt-0">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 mt-2 print:hidden">
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar tarefas..."
                          className="pl-9"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="w-full sm:w-48">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filtrar por Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">Todos os Status</SelectItem>
                            <SelectItem value="Atrasado">Atrasado</SelectItem>
                            <SelectItem value="Revisão">Revisão</SelectItem>
                            <SelectItem value="Não Realizado">Não Realizado</SelectItem>
                            <SelectItem value="Espera">Espera</SelectItem>
                            <SelectItem value="Pendente">Pendente</SelectItem>
                            <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                            <SelectItem value="Concluído">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="gap-2 w-full sm:w-auto">
                            <Columns className="h-4 w-4" />
                            <span className="hidden sm:inline">Colunas</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Alternar Colunas</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuCheckboxItem
                            checked={visibleColumns.descricao}
                            onCheckedChange={(c) =>
                              setVisibleColumns((p) => ({ ...p, descricao: !!c }))
                            }
                          >
                            Descrição
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={visibleColumns.responsavel}
                            onCheckedChange={(c) =>
                              setVisibleColumns((p) => ({ ...p, responsavel: !!c }))
                            }
                          >
                            Responsável
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={visibleColumns.status}
                            onCheckedChange={(c) =>
                              setVisibleColumns((p) => ({ ...p, status: !!c }))
                            }
                          >
                            Status
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={visibleColumns.data}
                            onCheckedChange={(c) => setVisibleColumns((p) => ({ ...p, data: !!c }))}
                          >
                            Data
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={visibleColumns.acoes}
                            onCheckedChange={(c) =>
                              setVisibleColumns((p) => ({ ...p, acoes: !!c }))
                            }
                          >
                            Ações
                          </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        className="gap-2 w-full sm:w-auto"
                        onClick={() => {
                          setSelectedTask({ module: moduleId, project: id })
                          setIsTaskSheetOpen(true)
                        }}
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Nova Tarefa</span>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="gap-2 w-full sm:w-auto">
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Exportar</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => exportDisciplineTasksCSV(filteredTasks, module.name)}
                          >
                            Exportar para CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              exportDisciplineTasksPDF(
                                filteredTasks,
                                module.name,
                                user?.name || 'Usuário',
                              )
                            }
                          >
                            Exportar para PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {filteredTasks.length > 0 ? (
                    <div
                      className={cn(
                        'rounded-md border overflow-x-auto',
                        isFocusedView && 'bg-background shadow-sm',
                      )}
                    >
                      <Table
                        className={cn(
                          isFocusedView && '[&_td]:py-2 [&_td]:px-3 [&_th]:py-3 [&_th]:px-3',
                        )}
                      >
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40px]">
                              <Checkbox
                                checked={allSelected}
                                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                aria-label="Selecionar todas"
                              />
                            </TableHead>
                            {visibleColumns.descricao && (
                              <TableHead>
                                <div className="flex items-center gap-1.5">
                                  Descrição
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-[200px] text-xs">
                                        Refere-se ao título ou resumo da atividade técnica a ser
                                        executada.
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableHead>
                            )}
                            {visibleColumns.responsavel && (
                              <TableHead>
                                <div className="flex items-center gap-1.5">
                                  Responsável
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-[200px] text-xs">
                                        Pessoa encarregada de realizar a tarefa.
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableHead>
                            )}
                            {visibleColumns.status && (
                              <TableHead>
                                <div className="flex items-center gap-1.5">
                                  Status
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-[200px] text-xs">
                                        Indica o estágio atual de progresso (Pendente, Em Andamento,
                                        Concluído).
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableHead>
                            )}
                            {visibleColumns.data && (
                              <TableHead className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-[200px] text-xs">
                                        Prazo final estipulado para a entrega ou conclusão desta
                                        tarefa.
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                  Data
                                </div>
                              </TableHead>
                            )}
                            {visibleColumns.acoes && (
                              <TableHead className="text-right w-[80px]">Ações</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTasks.map((task) => {
                            const urgency = getUrgencyInfo(task)

                            return (
                              <TableRow
                                key={task.id}
                                draggable={!isFilterActive}
                                onDragStart={(e) => !isFilterActive && onDragStart(e, task.id)}
                                onDragOver={(e) => !isFilterActive && onDragOver(e, task.id)}
                                onDrop={(e) => !isFilterActive && onDrop(e, task.id)}
                                onDragEnd={() => {
                                  setDraggedTaskId(null)
                                  setDragOverTaskId(null)
                                }}
                                className={cn(
                                  'cursor-pointer hover:bg-muted/50 group transition-colors',
                                  draggedTaskId === task.id && 'opacity-50',
                                  dragOverTaskId === task.id && 'border-t-2 border-t-primary',
                                )}
                                onClick={() => {
                                  setSelectedTask(task)
                                  setIsTaskSheetOpen(true)
                                }}
                              >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={selectedTaskIds.includes(task.id)}
                                    onClick={(e: any) => {
                                      if (e.shiftKey) isShiftPressed.current = true
                                    }}
                                    onCheckedChange={(checked) =>
                                      handleSelectRow(task.id, !!checked)
                                    }
                                    aria-label={`Selecionar tarefa ${task.title}`}
                                  />
                                </TableCell>
                                {visibleColumns.descricao && (
                                  <TableCell className="font-medium flex items-center py-3">
                                    {!isFilterActive ? (
                                      <div className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                                        <GripVertical className="h-4 w-4" />
                                      </div>
                                    ) : (
                                      <div className="w-6" />
                                    )}
                                    <div className="flex flex-col gap-0.5 w-full">
                                      <span className="flex items-center gap-2">
                                        {editingTitleId === task.id ? (
                                          <Input
                                            autoFocus
                                            value={editTitleValue}
                                            onChange={(e) => setEditTitleValue(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveTitle(task.id)
                                              if (e.key === 'Escape') setEditingTitleId(null)
                                            }}
                                            onBlur={() => handleSaveTitle(task.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-7 text-sm py-1 px-2 w-full max-w-[300px]"
                                          />
                                        ) : (
                                          <span
                                            className="cursor-pointer hover:text-primary transition-colors border-b border-transparent hover:border-primary/50"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setEditingTitleId(task.id)
                                              setEditTitleValue(task.title)
                                            }}
                                          >
                                            {task.title}
                                          </span>
                                        )}
                                        {urgency.level !== 'none' && editingTitleId !== task.id && (
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              'border-none flex items-center gap-1 px-1.5 py-0 h-5',
                                              urgency.bg,
                                              urgency.color,
                                            )}
                                          >
                                            <urgency.icon className="h-3 w-3" />
                                            <span className="text-[10px] uppercase font-bold">
                                              {urgency.label}
                                            </span>
                                          </Badge>
                                        )}
                                      </span>
                                      {task.description && editingTitleId !== task.id && (
                                        <span className="text-xs text-muted-foreground line-clamp-1">
                                          {task.description}
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                )}
                                {visibleColumns.responsavel && (
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Select
                                      value={task.responsible || 'unassigned'}
                                      onValueChange={async (val) => {
                                        try {
                                          const newValue = val === 'unassigned' ? null : val
                                          await pb
                                            .collection('tasks')
                                            .update(task.id, { responsible: newValue })
                                          setTasks((prev) =>
                                            prev.map((t) =>
                                              t.id === task.id
                                                ? { ...t, responsible: newValue }
                                                : t,
                                            ),
                                          )
                                          toast({ title: 'Responsável atualizado' })
                                        } catch (e: any) {
                                          toast({
                                            title: 'Erro',
                                            description:
                                              'Não foi possível atualizar o responsável.',
                                            variant: 'destructive',
                                          })
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="h-8 w-[140px] text-xs border-dashed focus:ring-0 focus:ring-offset-0">
                                        <SelectValue placeholder="Atribuir" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem
                                          value="unassigned"
                                          className="text-muted-foreground italic"
                                        >
                                          Sem responsável
                                        </SelectItem>
                                        {users.map((u) => (
                                          <SelectItem key={u.id} value={u.id}>
                                            <div className="flex items-center gap-2">
                                              <Avatar className="h-5 w-5">
                                                <AvatarImage
                                                  src={
                                                    u.avatar
                                                      ? pb.files.getURL(u, u.avatar)
                                                      : undefined
                                                  }
                                                />
                                                <AvatarFallback className="text-[10px]">
                                                  {u.name?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                              </Avatar>
                                              <span>{u.name}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                )}
                                {visibleColumns.status && (
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Select
                                      value={task.status || 'Pendente'}
                                      onValueChange={async (val) => {
                                        try {
                                          await pb
                                            .collection('tasks')
                                            .update(task.id, { status: val })
                                          setTasks((prev) =>
                                            prev.map((t) =>
                                              t.id === task.id ? { ...t, status: val } : t,
                                            ),
                                          )
                                          toast({ title: 'Status atualizado' })
                                        } catch (e: any) {
                                          toast({
                                            title: 'Erro',
                                            description: 'Não foi possível atualizar o status.',
                                            variant: 'destructive',
                                          })
                                        }
                                      }}
                                    >
                                      <SelectTrigger
                                        className={cn(
                                          'h-7 w-[130px] border-none text-xs font-medium focus:ring-0 focus:ring-offset-0',
                                          task.status === 'Concluído'
                                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                            : task.status === 'Atrasado'
                                              ? 'bg-red-500 hover:bg-red-600 text-white'
                                              : task.status === 'Revisão'
                                                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                                                : task.status === 'Não Realizado'
                                                  ? 'bg-gray-500 hover:bg-gray-600 text-white'
                                                  : task.status === 'Espera'
                                                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                                    : task.status === 'Em Andamento'
                                                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                                      : 'bg-slate-500 hover:bg-slate-600 text-white',
                                        )}
                                      >
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent onClick={(e) => e.stopPropagation()}>
                                        <SelectItem value="Atrasado">Atrasado</SelectItem>
                                        <SelectItem value="Revisão">Revisão</SelectItem>
                                        <SelectItem value="Não Realizado">Não Realizado</SelectItem>
                                        <SelectItem value="Espera">Espera</SelectItem>
                                        <SelectItem value="Pendente">Pendente</SelectItem>
                                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                                        <SelectItem value="Concluído">Concluído</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                )}{' '}
                                {visibleColumns.data && (
                                  <TableCell className="text-right">
                                    <Popover>
                                      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button
                                          variant="ghost"
                                          className={cn(
                                            'w-[130px] justify-end text-right font-normal px-2 h-8',
                                            !task.due_date && 'text-muted-foreground',
                                            urgency.level === 'overdue' &&
                                              'text-red-500 font-bold hover:text-red-600',
                                            urgency.level === 'urgent' &&
                                              'text-orange-500 font-bold hover:text-orange-600',
                                          )}
                                        >
                                          {task.due_date ? (
                                            format(new Date(task.due_date), 'dd/MM/yyyy')
                                          ) : (
                                            <span>Selecionar</span>
                                          )}
                                          <CalendarIcon className="ml-2 h-4 w-4" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        className="w-auto p-0"
                                        align="end"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Calendar
                                          mode="single"
                                          selected={
                                            task.due_date ? new Date(task.due_date) : undefined
                                          }
                                          onSelect={async (date: Date | undefined) => {
                                            try {
                                              const formattedDate = date
                                                ? `${format(date, 'yyyy-MM-dd')} 12:00:00.000Z`
                                                : null
                                              await pb
                                                .collection('tasks')
                                                .update(task.id, { due_date: formattedDate })
                                              setTasks((prev) =>
                                                prev.map((t) =>
                                                  t.id === task.id
                                                    ? { ...t, due_date: formattedDate }
                                                    : t,
                                                ),
                                              )
                                              toast({ title: 'Data atualizada' })
                                            } catch (e: any) {
                                              toast({
                                                title: 'Erro',
                                                description: 'Não foi possível atualizar a data.',
                                                variant: 'destructive',
                                              })
                                            }
                                          }}
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </TableCell>
                                )}
                                {visibleColumns.acoes && (
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedTask(task)
                                        setIsTaskSheetOpen(true)
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                    </Button>
                                  </TableCell>
                                )}
                              </TableRow>
                            )
                          })}
                        </TableBody>{' '}
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-md bg-muted/20 text-muted-foreground">
                      {tasks.length > 0
                        ? 'Nenhuma tarefa encontrada com os filtros atuais.'
                        : 'Nenhuma tarefa registrada para esta disciplina.'}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="calendar" className="mt-0">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={prevMonth}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={nextMonth}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                      <div className="grid grid-cols-7 gap-px bg-border">
                        {weekDays.map((d) => (
                          <div
                            key={d}
                            className="bg-muted p-2 text-center text-xs font-semibold uppercase tracking-wider"
                          >
                            {d}
                          </div>
                        ))}
                        {calendarDays.map((day) => {
                          const dayTasks = tasks.filter(
                            (t) => t.due_date && isSameDay(new Date(t.due_date), day),
                          )
                          const isCurrentMonth = isSameMonth(day, currentDate)
                          const isToday = isSameDay(day, new Date())

                          return (
                            <div
                              key={day.toString()}
                              className={`min-h-[100px] bg-background p-1.5 flex flex-col gap-1 transition-colors hover:bg-muted/50 ${!isCurrentMonth ? 'text-muted-foreground bg-muted/20' : ''}`}
                            >
                              <div className="flex justify-end">
                                <span
                                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : ''}`}
                                >
                                  {format(day, 'd')}
                                </span>
                              </div>
                              <div className="flex-1 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar pr-1">
                                {dayTasks.map((task) => (
                                  <Popover key={task.id}>
                                    <PopoverTrigger asChild>
                                      <div
                                        className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer truncate font-medium shadow-sm transition-opacity hover:opacity-80 min-w-0 ${getStatusColor(task.status)}`}
                                        title={task.title}
                                      >
                                        {task.title}
                                      </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3 shadow-md z-50">
                                      <h4 className="font-semibold text-sm mb-2">{task.title}</h4>
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-muted-foreground">
                                            Status
                                          </span>
                                          <Badge
                                            variant="outline"
                                            className={`${getStatusColor(task.status)} border-none`}
                                          >
                                            {task.status || 'Pendente'}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-muted-foreground">
                                            Prazo
                                          </span>
                                          <span className="text-xs font-medium flex items-center gap-1">
                                            <CalendarIcon className="h-3 w-3" />
                                            {format(new Date(task.due_date), 'dd/MM/yyyy')}
                                          </span>
                                        </div>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-3 gap-2"
                                        onClick={() => {
                                          setSelectedTask(task)
                                          setIsTaskSheetOpen(true)
                                        }}
                                      >
                                        <Edit2 className="h-3 w-3" />
                                        Editar Tarefa
                                      </Button>
                                    </PopoverContent>
                                  </Popover>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {!isFocusedView && (
            <Card className="print:hidden">
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
          )}

          {!isFocusedView && <ModuleVersions module={module} />}
        </div>

        {!isFocusedView && (
          <div className="space-y-6 print:hidden">
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
        )}
      </div>

      {selectedTaskIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background border shadow-lg rounded-full px-4 py-2 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-10">
          <Badge variant="secondary" className="px-2 py-1">
            {selectedTaskIds.length} selecionada{selectedTaskIds.length > 1 ? 's' : ''}
          </Badge>
          <div className="w-px h-6 bg-border mx-1" />

          <Select onValueChange={handleBulkStatusChange} value="">
            <SelectTrigger className="w-[160px] h-8 rounded-full border-none bg-muted/50 hover:bg-muted">
              <SelectValue placeholder="Alterar Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Atrasado">Atrasado</SelectItem>
              <SelectItem value="Revisão">Revisão</SelectItem>
              <SelectItem value="Não Realizado">Não Realizado</SelectItem>
              <SelectItem value="Espera">Espera</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Concluído">Concluído</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 rounded-full"
            onClick={() => setIsBulkDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      )}

      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tarefas?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir {selectedTaskIds.length} tarefa
              {selectedTaskIds.length > 1 ? 's' : ''}. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                handleBulkDelete()
              }}
              disabled={loading}
            >
              {loading ? 'Excluindo...' : 'Sim, Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TaskSheet
        task={selectedTask}
        open={isTaskSheetOpen}
        onOpenChange={setIsTaskSheetOpen}
        projectId={id || ''}
        onTaskUpdated={loadData}
        users={users}
      />
    </div>
  )
}
