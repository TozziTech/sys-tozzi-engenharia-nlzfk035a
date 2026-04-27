import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getProjectModules, deleteProjectModule } from '@/services/project_modules'
import { ProjectModule, SUB_DISCIPLINES_COLORS } from '@/types/project_modules'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  Clock,
  User,
  ListTree,
  LayoutGrid,
  List,
  Filter,
  ChevronUp,
  ChevronDown,
  Building2,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { SUB_DISCIPLINES_LIST } from '@/types/project_modules'
import { format, differenceInHours, differenceInDays, startOfDay } from 'date-fns'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { ProjectModuleModal } from './ProjectModuleModal'
import { ModuleTreeGrid } from './ModuleTreeGrid'
import { usePreferencesStore } from '@/stores/usePreferencesStore'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
import { cn } from '@/lib/utils'

export function ProjectModules({ projectId }: { projectId: string }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { viewMode, setViewMode } = usePreferencesStore()
  const [modules, setModules] = useState<ProjectModule[]>([])
  const [tags, setTags] = useState<any[]>([])

  const [priorityMode, setPriorityMode] = useState(() => {
    return localStorage.getItem(`priority_mode_${projectId}`) === 'true'
  })

  const [groupByBuilding, setGroupByBuilding] = useState(() => {
    return localStorage.getItem(`group_by_building_${projectId}`) === 'true'
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSubDisciplines, setSelectedSubDisciplines] = useState<string[]>([])
  const [editingModule, setEditingModule] = useState<ProjectModule | undefined>(undefined)
  const [deleteModuleId, setDeleteModuleId] = useState<ProjectModule | null>(null)
  const [selectedModuleForTasks, setSelectedModuleForTasks] = useState<ProjectModule | null>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isReordering, setIsReordering] = useState(false)

  const canEdit = user?.role === 'Administrador' || user?.role === 'Gerente de Projeto'

  const loadData = async () => {
    try {
      const [modulesData, tasksData, tagsData] = await Promise.all([
        getProjectModules(projectId),
        pb.collection('tasks').getFullList({ filter: `project = "${projectId}"` }),
        pb.collection('tags').getFullList(),
      ])
      setModules(modulesData)
      setTasks(tasksData)
      setTags(tagsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [projectId])

  useRealtime('project_modules', () => {
    loadData()
  })
  useRealtime('tasks', () => {
    loadData()
  })
  useRealtime('tags', () => {
    loadData()
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-emerald-500 hover:bg-emerald-600 text-white'
      case 'Em Andamento':
        return 'bg-blue-500 hover:bg-blue-600 text-white'
      case 'Pausado':
        return 'bg-amber-500 hover:bg-amber-600 text-white'
      case 'Em Análise':
        return 'bg-cyan-500 hover:bg-cyan-600 text-white'
      case 'Em Revisão':
        return 'bg-indigo-500 hover:bg-indigo-600 text-white'
      default:
        return 'bg-slate-500 hover:bg-slate-600 text-white'
    }
  }

  const sortedModules = [...modules].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))

  const handleReorder = async (mod: ProjectModule, direction: 'up' | 'down') => {
    if (isReordering || selectedSubDisciplines.length > 0) return

    const index = sortedModules.findIndex((m) => m.id === mod.id)
    if (index < 0) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= sortedModules.length) return

    setIsReordering(true)

    const target = sortedModules[targetIndex]

    let currentOrdem = mod.ordem ?? index + 1
    let targetOrdem = target.ordem ?? targetIndex + 1

    if (currentOrdem === targetOrdem) {
      if (direction === 'up') {
        currentOrdem = targetOrdem + 1
      } else {
        targetOrdem = currentOrdem + 1
      }
    }

    const newModules = modules.map((m) => {
      if (m.id === mod.id) return { ...m, ordem: targetOrdem }
      if (m.id === target.id) return { ...m, ordem: currentOrdem }
      return m
    })
    setModules(newModules)

    try {
      await pb.collection('project_modules').update(mod.id, { ordem: targetOrdem })
      await pb.collection('project_modules').update(target.id, { ordem: currentOrdem })
    } catch (err) {
      toast({
        title: 'Erro ao reordenar',
        description: 'Não foi possível alterar a ordem da disciplina.',
        variant: 'destructive',
      })
      loadData()
    } finally {
      setIsReordering(false)
    }
  }

  const handlePriorityModeChange = (checked: boolean) => {
    setPriorityMode(checked)
    localStorage.setItem(`priority_mode_${projectId}`, checked.toString())
    window.dispatchEvent(new Event('priorityModeChanged'))
  }

  const handleGroupByBuildingChange = (checked: boolean) => {
    setGroupByBuilding(checked)
    localStorage.setItem(`group_by_building_${projectId}`, checked.toString())
  }

  const handleDelete = async () => {
    if (!deleteModuleId || !user) return
    try {
      await deleteProjectModule(deleteModuleId.id, deleteModuleId.name, projectId, user.id)
      toast({ title: 'Módulo removido', description: 'A disciplina foi removida com sucesso.' })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a disciplina.',
        variant: 'destructive',
      })
    } finally {
      setDeleteModuleId(null)
    }
  }

  const toggleSubDiscipline = (sd: string) => {
    setSelectedSubDisciplines((prev) =>
      prev.includes(sd) ? prev.filter((item) => item !== sd) : [...prev, sd],
    )
  }

  const filteredModules = sortedModules.filter((mod) => {
    if (selectedSubDisciplines.length === 0) return true
    if (!mod.sub_disciplines || mod.sub_disciplines.length === 0) return false
    return mod.sub_disciplines.some((sd) => {
      const name = typeof sd === 'string' ? sd : sd.name
      return selectedSubDisciplines.includes(name)
    })
  })

  const groupedModules = useMemo(() => {
    const groups: Record<string, ProjectModule[]> = {}

    if (groupByBuilding) {
      filteredModules.forEach((mod) => {
        const key = mod.edificacao || 'Sem Edificação'
        if (!groups[key]) groups[key] = []
        groups[key].push(mod)
      })
    } else {
      groups['Todos os Módulos'] = [...filteredModules]
    }

    if (priorityMode) {
      Object.keys(groups).forEach((key) => {
        groups[key] = groups[key].slice(0, 5)
      })
    }

    return groups
  }, [filteredModules, groupByBuilding, priorityMode])

  const hasAnyModule = Object.values(groupedModules).some((arr) => arr.length > 0)

  const getModuleTagColor = (moduleName: string) => {
    const tag = tags.find((t) => t.name === moduleName)
    return tag?.color
  }

  const renderDeadlineAlert = (deadline: string | undefined, status: string) => {
    if (!deadline || status === 'Concluído') return null
    const today = startOfDay(new Date())
    const deadlineDate = startOfDay(new Date(deadline))
    const days = differenceInDays(deadlineDate, today)

    if (days < 0) {
      return (
        <Badge className="bg-red-500 hover:bg-red-600 text-white border-none px-1.5 py-0 h-5 whitespace-nowrap">
          <AlertTriangle className="w-3 h-3 mr-1" /> Atrasado
        </Badge>
      )
    } else if (days === 0) {
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-none px-1.5 py-0 h-5 whitespace-nowrap">
          <Clock className="w-3 h-3 mr-1" /> Vence hoje
        </Badge>
      )
    } else if (days <= 3) {
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950 border-none px-1.5 py-0 h-5 whitespace-nowrap">
          <Clock className="w-3 h-3 mr-1" /> {days} {days === 1 ? 'dia restante' : 'dias restantes'}
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none px-1.5 py-0 h-5 whitespace-nowrap">
          <Clock className="w-3 h-3 mr-1" /> {days} dias restantes
        </Badge>
      )
    }
  }

  const renderSubDisciplines = (subDisciplines: any[] | undefined) => {
    if (!subDisciplines || subDisciplines.length === 0) return null

    return (
      <div className="flex flex-wrap gap-1 mt-1.5 w-full">
        {subDisciplines.map((sd, i) => {
          const name = typeof sd === 'string' ? sd : sd.name
          const color = typeof sd === 'string' ? null : sd.color
          const legacyColorClass = typeof sd === 'string' ? SUB_DISCIPLINES_COLORS[sd] : ''

          if (color) {
            return (
              <Badge
                key={i}
                variant="outline"
                className="text-[10px] px-1.5 py-0"
                style={{ backgroundColor: `${color}20`, color: color, borderColor: color }}
              >
                {name}
              </Badge>
            )
          }

          return (
            <Badge
              key={i}
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${legacyColorClass}`}
            >
              {name}
            </Badge>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Módulos por Disciplina</CardTitle>
          <CardDescription>
            Gerencie as diferentes disciplinas técnicas deste projeto.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-md border border-amber-200 dark:border-amber-900/50">
            <Switch
              id="priority-mode"
              checked={priorityMode}
              onCheckedChange={handlePriorityModeChange}
              className="data-[state=checked]:bg-amber-500"
            />
            <Label
              htmlFor="priority-mode"
              className="text-xs font-medium cursor-pointer text-amber-700 dark:text-amber-400"
            >
              Modo Prioritário
            </Label>
          </div>

          <div className="flex items-center gap-2 mr-2 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-900/50">
            <Switch
              id="group-by-building"
              checked={groupByBuilding}
              onCheckedChange={handleGroupByBuildingChange}
              className="data-[state=checked]:bg-blue-500"
            />
            <Label
              htmlFor="group-by-building"
              className="text-xs font-medium cursor-pointer text-blue-700 dark:text-blue-400"
            >
              Agrupar por Edificação
            </Label>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1.5 border-dashed"
              >
                <Filter className="w-3.5 h-3.5" />
                Especialidades
                {selectedSubDisciplines.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1 py-0 text-[10px] h-4">
                    {selectedSubDisciplines.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm leading-none">Filtrar por Especialidade</h4>
                <div className="space-y-2">
                  {SUB_DISCIPLINES_LIST.map((sd) => (
                    <div key={sd} className="flex items-center space-x-2">
                      <Checkbox
                        id={`filter-${sd}`}
                        checked={selectedSubDisciplines.includes(sd)}
                        onCheckedChange={() => toggleSubDiscipline(sd)}
                      />
                      <Label
                        htmlFor={`filter-${sd}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {sd}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedSubDisciplines.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs mt-2"
                    onClick={() => setSelectedSubDisciplines([])}
                  >
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center border rounded-md p-1 bg-muted/50">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid', user?.id)}
              className="h-7 px-2.5 text-xs"
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
              Cards
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table', user?.id)}
              className="h-7 px-2.5 text-xs"
            >
              <List className="w-3.5 h-3.5 mr-1.5" />
              Lista
            </Button>
          </div>
          {canEdit && (
            <Button
              onClick={() => {
                setEditingModule(undefined)
                setIsModalOpen(true)
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Disciplina
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <span className="text-muted-foreground">Carregando...</span>
          </div>
        ) : modules.length > 0 && !hasAnyModule ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg bg-muted/10 text-center">
            <Filter className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhum módulo encontrado
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Nenhuma disciplina corresponde aos filtros selecionados.
            </p>
            <Button variant="outline" size="sm" onClick={() => setSelectedSubDisciplines([])}>
              Limpar Filtros
            </Button>
          </div>
        ) : hasAnyModule ? (
          <div className="space-y-6">
            {Object.entries(groupedModules).map(([groupName, groupModules]) => {
              if (groupModules.length === 0) return null

              return (
                <div key={groupName} className="flex flex-col gap-3">
                  {groupByBuilding && (
                    <div className="flex items-center gap-2 px-1">
                      <Building2 className="w-5 h-5 text-blue-500" />
                      <h3 className="text-base font-semibold text-foreground tracking-tight">
                        {groupName}
                      </h3>
                      <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5 ml-1">
                        {groupModules.length}
                      </Badge>
                    </div>
                  )}

                  {viewMode === 'table' ? (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Disciplina / Edificação</TableHead>
                            <TableHead>Sub-disciplinas</TableHead>
                            <TableHead>Equipe</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Progresso</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-[0.02rem]">
                          {groupModules.map((mod) => (
                            <TableRow
                              key={mod.id}
                              className={priorityMode ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}
                            >
                              <TableCell
                                className={priorityMode ? 'border-l-4 border-l-amber-500' : ''}
                              >
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2 mb-1">
                                    {priorityMode && (
                                      <Badge className="bg-amber-500 hover:bg-amber-600 text-[10px] px-1.5 py-0 h-4 font-semibold shrink-0">
                                        Prioridade
                                      </Badge>
                                    )}
                                    <Link
                                      to={`/projects/${projectId}/disciplines/${mod.id}`}
                                      className="font-semibold hover:underline text-sm flex items-center gap-1.5"
                                      style={{ color: getModuleTagColor(mod.name) }}
                                    >
                                      {getModuleTagColor(mod.name) && (
                                        <span
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: getModuleTagColor(mod.name) }}
                                        />
                                      )}
                                      <span
                                        className={
                                          !getModuleTagColor(mod.name)
                                            ? 'text-amber-600 dark:text-amber-500'
                                            : ''
                                        }
                                      >
                                        {mod.name}
                                      </span>
                                    </Link>
                                  </div>
                                  {!groupByBuilding && mod.edificacao && (
                                    <span className="text-xs text-muted-foreground mt-0.5">
                                      Edificação: {mod.edificacao}
                                    </span>
                                  )}
                                  <div className="flex flex-col items-start gap-1 mt-1">
                                    {(mod.start_date || mod.deadline) && (
                                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {mod.start_date
                                          ? format(new Date(mod.start_date), 'dd/MM/yyyy')
                                          : '--'}
                                        {' → '}
                                        {mod.deadline
                                          ? format(new Date(mod.deadline), 'dd/MM/yyyy')
                                          : '--'}
                                      </span>
                                    )}
                                    {renderDeadlineAlert(mod.deadline, mod.status)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-[200px]">
                                  {renderSubDisciplines(mod.sub_disciplines)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1.5">
                                  {mod.expand?.responsible ? (
                                    <div className="flex items-center gap-1.5" title="Responsável">
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage
                                          src={
                                            mod.expand.responsible.avatar
                                              ? pb.files.getURL(
                                                  mod.expand.responsible as any,
                                                  mod.expand.responsible.avatar,
                                                )
                                              : undefined
                                          }
                                        />
                                        <AvatarFallback className="text-[9px]">R</AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs">{mod.expand.responsible.name}</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">
                                      Sem gerente
                                    </span>
                                  )}
                                  {mod.expand?.designer && (
                                    <div className="flex items-center gap-1.5" title="Projetista">
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage
                                          src={
                                            mod.expand.designer.avatar
                                              ? pb.files.getURL(
                                                  mod.expand.designer as any,
                                                  mod.expand.designer.avatar,
                                                )
                                              : undefined
                                          }
                                        />
                                        <AvatarFallback className="text-[9px]">P</AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs text-muted-foreground">
                                        {mod.expand.designer.name}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${getStatusColor(mod.status)} text-[10px]`}>
                                  {mod.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={mod.progress} className="h-1.5 w-16" />
                                  <span className="text-xs font-medium">{mod.progress}%</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1 items-center">
                                  {canEdit && selectedSubDisciplines.length === 0 && (
                                    <div className="flex flex-col gap-0 mr-2 border-r pr-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-6 p-0 hover:bg-muted"
                                        disabled={
                                          isReordering ||
                                          sortedModules.findIndex((m) => m.id === mod.id) === 0
                                        }
                                        onClick={() => handleReorder(mod, 'up')}
                                        title="Mover para cima"
                                      >
                                        <ChevronUp className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-6 p-0 hover:bg-muted"
                                        disabled={
                                          isReordering ||
                                          sortedModules.findIndex((m) => m.id === mod.id) ===
                                            sortedModules.length - 1
                                        }
                                        onClick={() => handleReorder(mod, 'down')}
                                        title="Mover para baixo"
                                      >
                                        <ChevronDown className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setSelectedModuleForTasks(mod)}
                                    title="Tarefas"
                                  >
                                    <ListTree className="w-4 h-4" />
                                  </Button>
                                  {canEdit && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => {
                                          setEditingModule(mod)
                                          setIsModalOpen(true)
                                        }}
                                        title="Editar"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => setDeleteModuleId(mod)}
                                        title="Remover"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {groupModules.map((mod) => (
                        <Card
                          key={mod.id}
                          className={`overflow-hidden transition-all ${priorityMode ? 'border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50 bg-amber-50/10 dark:bg-amber-950/10' : ''}`}
                        >
                          <div className="p-4 relative">
                            {priorityMode && (
                              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                            )}
                            <div className="flex justify-between items-start mb-2 pl-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  {priorityMode && (
                                    <Badge className="bg-amber-500 hover:bg-amber-600 text-[10px] px-1.5 py-0 h-4 font-semibold">
                                      Prioridade
                                    </Badge>
                                  )}
                                  <Link
                                    to={`/projects/${projectId}/disciplines/${mod.id}`}
                                    className="hover:underline flex items-center gap-1.5"
                                    style={{ color: getModuleTagColor(mod.name) }}
                                  >
                                    {getModuleTagColor(mod.name) && (
                                      <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: getModuleTagColor(mod.name) }}
                                      />
                                    )}
                                    <h4
                                      className={`font-semibold text-base ${!getModuleTagColor(mod.name) ? 'text-amber-600 dark:text-amber-500' : ''}`}
                                    >
                                      {mod.name}
                                    </h4>
                                  </Link>

                                  {tasks
                                    .filter((t) => t.module === mod.id)
                                    .some(
                                      (t) =>
                                        t.status !== 'Concluído' &&
                                        t.due_date &&
                                        differenceInHours(new Date(t.due_date), new Date()) <= 72,
                                    ) && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge
                                            variant="destructive"
                                            className="px-1.5 py-0 h-5 bg-red-500 hover:bg-red-600 border-none cursor-help"
                                          >
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            Tarefas Críticas
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>
                                            Existem tarefas atrasadas ou vencendo nos próximos 3
                                            dias.
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}

                                  {renderDeadlineAlert(mod.deadline, mod.status)}
                                </div>

                                {!groupByBuilding && mod.edificacao && (
                                  <div className="text-sm text-muted-foreground mt-1 w-full">
                                    Edificação:{' '}
                                    <span className="font-medium text-foreground">
                                      {mod.edificacao}
                                    </span>
                                  </div>
                                )}

                                {renderSubDisciplines(mod.sub_disciplines)}

                                {(mod.start_date || mod.deadline) && (
                                  <div className="flex items-center text-[11px] text-muted-foreground mt-2 gap-1.5">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      Início:{' '}
                                      {mod.start_date
                                        ? format(new Date(mod.start_date), 'dd/MM/yyyy')
                                        : '--'}
                                    </span>
                                    <span>|</span>
                                    <span>
                                      Entrega:{' '}
                                      {mod.deadline
                                        ? format(new Date(mod.deadline), 'dd/MM/yyyy')
                                        : '--'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <Link to={`/projects/${projectId}/disciplines/${mod.id}`}>
                                <Badge className={`${getStatusColor(mod.status)} cursor-pointer`}>
                                  {mod.status}
                                </Badge>
                              </Link>
                            </div>

                            {mod.expand?.responsible && (
                              <div className="flex items-center gap-2 mb-4 mt-2 p-2 bg-muted/30 rounded-md border border-border/50">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={
                                      mod.expand.responsible.avatar
                                        ? pb.files.getURL(
                                            mod.expand.responsible as any,
                                            mod.expand.responsible.avatar,
                                          )
                                        : undefined
                                    }
                                  />
                                  <AvatarFallback className="text-[10px]">
                                    <User className="h-3 w-3" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-foreground leading-none">
                                    {mod.expand.responsible.name || 'Usuário'}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                                    Responsável pela disciplina
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="space-y-1.5 mb-4">
                              <div className="flex justify-between text-xs font-medium">
                                <span>Progresso</span>
                                <span>{mod.progress}%</span>
                              </div>
                              <Progress value={mod.progress} className="h-2" />
                            </div>

                            {mod.notes && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-4 bg-muted/50 p-2 rounded">
                                {mod.notes}
                              </p>
                            )}

                            <div className="mb-4 pt-3 border-t border-border/50 text-sm">
                              {(() => {
                                const moduleTasks = tasks.filter((t) => t.module === mod.id)
                                const completedTasks = moduleTasks.filter(
                                  (t) => t.status === 'Concluído' || t.completed_at,
                                ).length
                                const pendingTasks = moduleTasks.length - completedTasks
                                const hasTasks = moduleTasks.length > 0

                                return hasTasks ? (
                                  <span className="text-muted-foreground">
                                    Tarefas:{' '}
                                    <strong className="text-amber-600 dark:text-amber-400 font-medium">
                                      {pendingTasks} pendentes
                                    </strong>{' '}
                                    /{' '}
                                    <strong className="text-emerald-600 dark:text-emerald-400 font-medium">
                                      {completedTasks} concluídas
                                    </strong>
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground italic">
                                    Sem tarefas cadastradas
                                  </span>
                                )
                              })()}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 pt-2 border-t">
                              {canEdit && selectedSubDisciplines.length === 0 ? (
                                <div className="flex items-center gap-1 pl-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={
                                      isReordering ||
                                      sortedModules.findIndex((m) => m.id === mod.id) === 0
                                    }
                                    onClick={() => handleReorder(mod, 'up')}
                                    title="Mover para cima"
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={
                                      isReordering ||
                                      sortedModules.findIndex((m) => m.id === mod.id) ===
                                        sortedModules.length - 1
                                    }
                                    onClick={() => handleReorder(mod, 'down')}
                                    title="Mover para baixo"
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="hidden sm:block" />
                              )}
                              <div className="flex flex-wrap justify-end gap-2 w-full sm:w-auto">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedModuleForTasks(mod)}
                                >
                                  <ListTree className="w-4 h-4 mr-2" /> Tarefas
                                </Button>
                                {canEdit && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingModule(mod)
                                        setIsModalOpen(true)
                                      }}
                                    >
                                      <Edit2 className="w-4 h-4 mr-2" /> Editar
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => setDeleteModuleId(mod)}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" /> Remover
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhuma disciplina cadastrada
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Divida o projeto em módulos técnicos para melhor acompanhamento.
            </p>
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingModule(undefined)
                  setIsModalOpen(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Adicionar Primeira Disciplina
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {canEdit && (
        <ProjectModuleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          projectId={projectId}
          module={editingModule}
        />
      )}

      <AlertDialog
        open={!!deleteModuleId}
        onOpenChange={(open) => !open && setDeleteModuleId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Disciplina?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o módulo "{deleteModuleId?.name}"? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!selectedModuleForTasks}
        onOpenChange={(open) => !open && setSelectedModuleForTasks(null)}
      >
        <DialogContent className="max-w-5xl w-[95vw] h-[85vh] flex flex-col p-0 overflow-hidden bg-background border-slate-200 dark:border-slate-800 shadow-xl">
          <DialogHeader className="px-6 py-5 border-b border-zinc-800 shrink-0 bg-zinc-950">
            <DialogTitle className="text-xl text-zinc-100">
              Estrutura Analítica (WBS) - {selectedModuleForTasks?.name}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Gerencie a hierarquia de tarefas desta disciplina em formato de planilha.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 md:p-6 bg-zinc-900/50 backdrop-blur-sm">
            {selectedModuleForTasks && <ModuleTreeGrid moduleId={selectedModuleForTasks.id} />}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
