import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useProjectStore from '@/stores/useProjectStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/StatusBadge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  User,
  Briefcase,
  Clock,
  Edit2,
  Trash2,
  TrendingUp,
  UploadCloud,
  File,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  PieChart,
  Star,
  Layers,
} from 'lucide-react'
import { exportProjectHoursCSV, exportAuditLogsCSV } from '@/lib/export'
import { exportProjectHoursPDF, exportAuditLogsPDF, exportSpecialtiesPDF } from '@/lib/exportPdf'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EditProjectModal } from '@/components/EditProjectModal'
import { ProjectComments } from '@/components/ProjectComments'
import { ProjectModules } from '@/components/ProjectModules'
import { ProjectFinanceTab } from '@/components/ProjectFinanceTab'
import { NoteCard } from '@/components/NoteCard'
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
import { useToast } from '@/hooks/use-toast'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { usePermissions } from '@/hooks/use-permissions'
import { usePreferencesStore } from '@/stores/usePreferencesStore'
import { cn } from '@/lib/utils'

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [modules, setModules] = useState<any[]>([])

  const loadModules = useCallback(async () => {
    if (!id) return
    try {
      const res = await pb
        .collection('project_modules')
        .getFullList({ filter: `project = "${id}"` })
      setModules(res)
    } catch (e) {
      console.error(e)
    }
  }, [id])

  useEffect(() => {
    loadModules()
  }, [loadModules])

  // Resolve console runtime warnings caused by vite-plugin-react-uid injecting data-uid into React.Fragment
  useEffect(() => {
    const originalConsoleError = console.error
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('Invalid prop') &&
        args[0].includes('data-uid') &&
        args[0].includes('React.Fragment')
      ) {
        return
      }
      originalConsoleError.apply(console, args)
    }
    return () => {
      console.error = originalConsoleError
    }
  }, [])

  useRealtime('project_modules', loadModules)
  useRealtime('projects', () => {
    // Keep projects in sync
  })

  const { user } = useAuth()
  const { projects, deleteProject, timeLogs, users, tasks } = useProjectStore()
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    pb.collection('company_settings')
      .getFirstListItem('')
      .then(setSettings)
      .catch(() => {})
  }, [])

  const store = useProjectStore() as any
  const updateProject = store.updateProject
  const { toast } = useToast()

  const [tags, setTags] = useState<any[]>([])
  const [specialtySort, setSpecialtySort] = useState<
    'emphasis' | 'progressDesc' | 'progressAsc' | 'nameAsc'
  >('emphasis')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditingObservations, setIsEditingObservations] = useState(false)
  const [observationText, setObservationText] = useState('')
  const [pbDocuments, setPbDocuments] = useState<any[]>([])
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  const loadAuditLogs = useCallback(async () => {
    if (!id) return
    try {
      const records = await pb.collection('audit_logs').getFullList({
        filter: `resource = "user_project_access" && details ~ "${id}"`,
        sort: '-created',
        expand: 'user_id',
      })
      setAuditLogs(records)
    } catch (e) {
      console.error(e)
    }
  }, [id])

  useEffect(() => {
    loadAuditLogs()
  }, [loadAuditLogs])

  useRealtime('audit_logs', loadAuditLogs)

  const [reportsHistory, setReportsHistory] = useState<any[]>([])

  const loadReportsHistory = useCallback(async () => {
    if (!id) return
    try {
      const records = await pb.collection('project_reports_history').getFullList({
        filter: `project = "${id}"`,
        sort: '-created',
      })
      setReportsHistory(records)
    } catch (e) {
      console.error(e)
    }
  }, [id])

  useEffect(() => {
    loadReportsHistory()
  }, [loadReportsHistory])

  useRealtime('project_reports_history', loadReportsHistory)

  const loadDocuments = useCallback(async () => {
    if (!id) return
    try {
      const records = await pb
        .collection('project_documents')
        .getFullList({ filter: `project = "${id}"`, sort: '-created' })
      setPbDocuments(records)
    } catch (e) {
      console.error(e)
    }
  }, [id])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  useRealtime('project_documents', loadDocuments)

  const loadTags = useCallback(async () => {
    try {
      const records = await pb.collection('tags').getFullList()
      setTags(records)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    loadTags()
  }, [loadTags])

  useRealtime('tags', loadTags)

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploadingDoc(true)
      try {
        for (const file of Array.from(e.target.files)) {
          const formData = new FormData()
          formData.append('project', id!)
          formData.append('name', file.name)
          formData.append('file', file)
          formData.append('type', 'Other')
          await pb.collection('project_documents').create(formData)
        }
        toast({
          title: 'Documentos anexados',
          description: `${e.target.files.length} arquivo(s) adicionado(s) com sucesso.`,
        })
      } catch (err) {
        console.error(err)
        toast({
          title: 'Erro ao anexar',
          description: 'Ocorreu um erro ao fazer upload dos arquivos.',
          variant: 'destructive',
        })
      } finally {
        setIsUploadingDoc(false)
        if (e.target) e.target.value = ''
      }
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    try {
      await pb.collection('project_documents').delete(docId)
      toast({ title: 'Documento removido', description: 'O arquivo foi excluído com sucesso.' })
    } catch (err) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const handleDocTypeChange = async (docId: string, newType: string) => {
    try {
      await pb.collection('project_documents').update(docId, { type: newType })
      toast({ title: 'Categoria atualizada' })
    } catch (err) {
      toast({ title: 'Erro ao atualizar categoria', variant: 'destructive' })
    }
  }

  const handleDelete = useCallback(() => {
    if (!project) return
    deleteProject(project.id)
    toast({
      title: 'Projeto deletado',
      description: 'O projeto foi removido com sucesso.',
      variant: 'destructive',
    })
    navigate('/projects')
  }, [project, deleteProject, navigate, toast])

  const projectTimeLogs = useMemo(() => {
    if (!project) return []
    return timeLogs
      .filter((log) => log.projectId === project.id)
      .map((log) => ({
        ...log,
        user: users.find((u) => u.id === log.userId) || { name: 'Desconhecido' },
        task: tasks.find((t) => t.id === log.taskId),
      }))
  }, [timeLogs, project?.id, users, tasks])

  const totalActualHours = projectTimeLogs.reduce((acc, log) => acc + log.hours, 0)
  const estimatedHours = project?.estimatedHours || 100

  const handleExportCSV = useCallback(() => {
    if (!project) return
    exportProjectHoursCSV(projectTimeLogs, project.name)
  }, [project, projectTimeLogs])

  const handleExportPDF = useCallback(() => {
    if (!project) return
    exportProjectHoursPDF(projectTimeLogs, project, 'Usuário Logado')
  }, [project, projectTimeLogs])

  const { density } = usePreferencesStore()
  const pClass = density === 'compact' ? 'p-3 md:p-4' : 'p-4 md:p-6'
  const gapClass = density === 'compact' ? 'space-y-4' : 'space-y-6'
  const gridGapClass = density === 'compact' ? 'gap-4' : 'gap-6'

  const { can, canAccess } = usePermissions()
  const canAccessFinance =
    canAccess('planilha_financeira') ||
    canAccess('lancamentos_financeiros') ||
    user?.role === 'Administrador'

  const subDisciplineStats = useMemo(() => {
    const stats: Record<
      string,
      { totalProgress: number; count: number; statuses: Record<string, number>; color: string }
    > = {}
    modules.forEach((mod) => {
      if (mod.sub_disciplines && mod.sub_disciplines.length > 0) {
        mod.sub_disciplines.forEach((sd: any) => {
          const name = typeof sd === 'string' ? sd : sd.name
          const color = typeof sd === 'string' ? null : sd.color
          if (!stats[name]) {
            stats[name] = { totalProgress: 0, count: 0, statuses: {}, color: color || '#94a3b8' }
          }
          if (color && stats[name].color === '#94a3b8') {
            stats[name].color = color
          }
          stats[name].totalProgress += mod.progress || 0
          stats[name].count += 1
          stats[name].statuses[mod.status] = (stats[name].statuses[mod.status] || 0) + 1
        })
      }
    })

    const result = Object.entries(stats).map(([name, data]) => {
      const tag = tags.find((t) => t.name === name)
      return {
        name,
        count: data.count,
        averageProgress: Math.round(data.totalProgress / data.count),
        statuses: data.statuses,
        color: data.color !== '#94a3b8' ? data.color : tag?.color || '#94a3b8',
        is_emphasized: tag?.is_emphasized || false,
      }
    })

    if (specialtySort === 'emphasis') {
      result.sort((a, b) => {
        if (a.is_emphasized === b.is_emphasized) return b.averageProgress - a.averageProgress
        return a.is_emphasized ? -1 : 1
      })
    } else if (specialtySort === 'progressDesc') {
      result.sort((a, b) => b.averageProgress - a.averageProgress)
    } else if (specialtySort === 'progressAsc') {
      result.sort((a, b) => a.averageProgress - b.averageProgress)
    } else if (specialtySort === 'nameAsc') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [modules, tags, specialtySort])

  const handleExportSpecialtiesPDF = useCallback(async () => {
    if (!project) return
    exportSpecialtiesPDF(
      project,
      subDisciplineStats,
      user?.name || user?.email || 'Usuário',
      settings,
    )

    const totalM = modules.length
    const byStatus = modules.reduce(
      (acc, mod) => {
        acc[mod.status] = (acc[mod.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    const progress =
      totalM > 0 ? Math.round(modules.reduce((sum, m) => sum + (m.progress || 0), 0) / totalM) : 0

    try {
      await pb.collection('project_reports_history').create({
        project: project.id,
        snapshot_data: {
          subDisciplineStats,
          modulesByStatus: byStatus,
          totalModules: totalM,
        },
        total_progress: progress,
      })
      toast({
        title: 'Relatório salvo no histórico',
        description: 'O instantâneo de progresso foi registrado.',
      })
    } catch (e) {
      console.error('Failed to create report history', e)
    }
  }, [project, subDisciplineStats, user, settings, modules, toast])

  const [priorityMode, setPriorityMode] = useState(() => {
    return localStorage.getItem(`priority_mode_${id}`) === 'true'
  })

  useEffect(() => {
    const handleStorageChange = () => {
      setPriorityMode(localStorage.getItem(`priority_mode_${id}`) === 'true')
    }
    window.addEventListener('priorityModeChanged', handleStorageChange)
    return () => window.removeEventListener('priorityModeChanged', handleStorageChange)
  }, [id])

  const crisisModules = useMemo(() => {
    const now = new Date()
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)
    let filtered = modules
      .filter((m) => {
        if (m.status === 'Concluído' || !m.deadline) return false
        const deadline = new Date(m.deadline)
        return deadline <= in48h
      })
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())

    if (priorityMode) {
      filtered = filtered.slice(0, 5)
    }

    return filtered
  }, [modules, priorityMode])

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-2xl font-bold mb-4">Projeto não encontrado</h2>
        <Button onClick={() => navigate('/projects')}>Voltar para Projetos</Button>
      </div>
    )
  }

  const canEdit = can('edit', 'projects')
  const canDelete = can('delete', 'projects')

  const totalModules = modules.length
  const modulesByStatus = modules.reduce(
    (acc, mod) => {
      acc[mod.status] = (acc[mod.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
  const overallProgress =
    totalModules > 0
      ? Math.round(modules.reduce((sum, m) => sum + (m.progress || 0), 0) / totalModules)
      : 0

  const getCountdown = (deadline: string) => {
    const now = new Date()
    const d = new Date(deadline)
    const diffHours = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60))
    if (diffHours < 0) return `Atrasado há ${Math.abs(diffHours)}h`
    return `Expira em ${diffHours}h`
  }

  const handlePrintPriorityReport = () => {
    window.print()
  }

  return (
    <div
      className={`container mx-auto ${pClass} max-w-[95%] xl:max-w-screen-2xl ${gapClass} print:m-0 print:p-0 print:max-w-none`}
    >
      {/* Print-only Priority Report */}
      <div className="hidden print:block text-black bg-white p-8">
        <h1 className="text-3xl font-bold mb-2">Resumo de Prioridades</h1>
        <h2 className="text-xl mb-1">Projeto: {project.name}</h2>
        <h3 className="text-lg text-gray-600 mb-6">Cliente: {project.client}</h3>

        {(() => {
          const sortedModules = [...modules].sort((a, b) => {
            if (a.ordem !== b.ordem) return (a.ordem ?? 0) - (b.ordem ?? 0)
            if (a.deadline && b.deadline)
              return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
            if (a.deadline) return -1
            if (b.deadline) return 1
            return 0
          })
          const grouped = sortedModules.reduce(
            (acc, mod) => {
              const key = mod.edificacao || 'Sem Edificação'
              if (!acc[key]) acc[key] = []
              acc[key].push(mod)
              return acc
            },
            {} as Record<string, typeof modules>,
          )

          return Object.entries(grouped).map(([edificacao, mods]) => (
            <div key={edificacao} className="mb-8">
              <h4 className="text-lg font-bold border-b border-gray-300 pb-1 mb-4">{edificacao}</h4>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="py-2 px-2">Ordem</th>
                    <th className="py-2 px-2">Disciplina</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">Prazo</th>
                    <th className="py-2 px-2">Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {mods.map((m) => (
                    <tr key={m.id} className="border-b border-gray-200">
                      <td className="py-2 px-2">{m.ordem ?? '-'}</td>
                      <td className="py-2 px-2 font-medium">{m.name}</td>
                      <td className="py-2 px-2">{m.status}</td>
                      <td className="py-2 px-2">
                        {m.deadline ? new Date(m.deadline).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="py-2 px-2">{m.expand?.responsible?.name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        })()}
      </div>

      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link to="/projects">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handlePrintPriorityReport} className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Resumo de Prioridades</span>
          </Button>
          {(canEdit || canDelete) && (
            <>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  className="gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Editar</span>
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Deletar</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Header Info Section */}
      <Card className="w-full print:hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (!canEdit) return
                    try {
                      await pb
                        .collection('projects')
                        .update(project.id, { is_priority: !project.is_priority })
                      updateProject(project.id, { is_priority: !project.is_priority })
                    } catch (e) {
                      console.error(e)
                    }
                  }}
                  disabled={!canEdit}
                  className={`focus:outline-none transition-colors ${!canEdit ? 'cursor-default' : ''} ${project.is_priority ? (canEdit ? 'text-yellow-500 hover:text-yellow-600' : 'text-yellow-500') : canEdit ? 'text-slate-300 hover:text-yellow-400' : 'text-slate-300'}`}
                  title={
                    !canEdit
                      ? 'Sem permissão'
                      : project.is_priority
                        ? 'Remover prioridade'
                        : 'Marcar como prioridade'
                  }
                >
                  <Star className={`h-6 w-6 ${project.is_priority ? 'fill-current' : ''}`} />
                </button>
                <CardTitle className="text-2xl font-bold">{project.name}</CardTitle>
              </div>
              <CardDescription className="text-base mt-1">{project.client}</CardDescription>
            </div>
            <StatusBadge status={project.status} className="px-3 py-1 text-sm font-medium" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-8 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Disciplina
                </p>
                <p className="font-medium">{project.discipline}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Engenheiro Resp.
                </p>
                <p className="font-medium">{project.engineer}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Início
                </p>
                <p className="font-medium">{project.startDate.split('-').reverse().join('/')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Entrega
                </p>
                <p className="font-medium">{project.endDate.split('-').reverse().join('/')}</p>
              </div>
            </div>
            {project.cno && (
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                    CNO da Obra
                  </p>
                  <p className="font-medium">{project.cno}</p>
                </div>
              </div>
            )}
            {project.cnpj && (
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                    CNPJ da Obra
                  </p>
                  <p className="font-medium">{project.cnpj}</p>
                </div>
              </div>
            )}
          </div>

          {project.description && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-muted-foreground text-sm">{project.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Metrics Dashboard / Visão Geral do Projeto */}
      <Card className="w-full print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Visão Geral do Projeto
          </CardTitle>
          <CardDescription>
            Progresso consolidado baseado nas disciplinas e seus status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalModules > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted/30 rounded-lg border flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-foreground">{totalModules}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                    Disciplinas
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-lg flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {modulesByStatus['Concluído'] || 0}
                  </span>
                  <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider mt-1">
                    Concluídas
                  </span>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-lg flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {modulesByStatus['Em Andamento'] || 0}
                  </span>
                  <span className="text-xs text-blue-600/80 dark:text-blue-400/80 uppercase tracking-wider mt-1">
                    Em Andamento
                  </span>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-lg flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {(modulesByStatus['Pendente'] || 0) + (modulesByStatus['Pausado'] || 0)}
                  </span>
                  <span className="text-xs text-amber-600/80 dark:text-amber-400/80 uppercase tracking-wider mt-1">
                    Pend./Paus.
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Progresso Geral (Média das Disciplinas)</span>
                  <span>{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-6 bg-muted/20 rounded-lg border border-dashed">
              Nenhuma disciplina registrada para este projeto. Adicione disciplinas para acompanhar
              o progresso.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progresso Tracking */}
      <Card className="w-full print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Progresso/Conclusão</CardTitle>
          <CardDescription>Percentual de conclusão atual do projeto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Conclusão</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Specialty Progress Dashboard */}
      {subDisciplineStats.length > 0 && (
        <Card className="w-full print:hidden">
          <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Progresso por Especialidade (Sub-disciplinas)
              </CardTitle>
              <CardDescription>
                Média de conclusão e quantidade de módulos por área técnica
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={specialtySort} onValueChange={(v: any) => setSpecialtySort(v)}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emphasis">Destaque (Emphasis)</SelectItem>
                  <SelectItem value="progressDesc">Maior Progresso</SelectItem>
                  <SelectItem value="progressAsc">Menor Progresso</SelectItem>
                  <SelectItem value="nameAsc">Ordem Alfabética</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSpecialtiesPDF}
                className="h-9"
              >
                <FileText className="h-4 w-4 mr-2" />
                Exportar Relatório
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subDisciplineStats.map((stat) => (
                <div
                  key={stat.name}
                  className={cn(
                    'flex flex-col p-3 border rounded-lg space-y-2 transition-all',
                    stat.is_emphasized ? 'bg-primary/5 border-primary/40 shadow-sm' : 'bg-muted/10',
                  )}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: stat.color }}
                      />
                      <span className="font-medium text-sm flex items-center gap-1">
                        {stat.name}
                        {stat.is_emphasized && (
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        )}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{stat.count} mód.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={stat.averageProgress} className="h-2 flex-1" />
                    <span className="text-xs font-semibold w-8 text-right">
                      {stat.averageProgress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Layout */}
      <div className="w-full mb-6 print:hidden">
        <ProjectModules projectId={project.id} />
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-3 ${gridGapClass} print:hidden`}>
        <div className={`md:col-span-2 ${gapClass}`}>
          <Card>
            <CardHeader className="pb-3 flex flex-row items-start sm:items-center justify-between">
              <CardTitle className="text-lg">Observações</CardTitle>
              {!isEditingObservations && canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setObservationText(project.description || project.observations || '')
                    setIsEditingObservations(true)
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Editar</span>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditingObservations ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <Textarea
                      value={observationText}
                      onChange={(e) => setObservationText(e.target.value)}
                      placeholder="Adicione observações e descrições do projeto... (Suporta Markdown: **negrito**, *itálico*, - listas, [link](url))"
                      className="min-h-[160px] resize-y font-mono text-sm"
                      autoFocus
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <span>
                          <strong className="font-bold">**</strong>negrito
                          <strong className="font-bold">**</strong>
                        </span>
                        <span>
                          <em className="italic">*</em>itálico<em className="italic">*</em>
                        </span>
                        <span>[link](url)</span>
                        <span>- lista</span>
                      </div>
                      <span className="shrink-0">Suporta Markdown</span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingObservations(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await pb
                            .collection('projects')
                            .update(project.id, { description: observationText })
                          if (typeof updateProject === 'function') {
                            updateProject(project.id, {
                              description: observationText,
                              observations: observationText,
                            })
                          } else {
                            window.location.reload()
                          }
                          setIsEditingObservations(false)
                          toast({
                            title: 'Observações atualizadas',
                            description: 'As observações foram salvas com sucesso.',
                          })
                        } catch (err) {
                          console.error(err)
                          toast({
                            title: 'Erro',
                            description: 'Ocorreu um erro ao salvar as observações.',
                            variant: 'destructive',
                          })
                        }
                      }}
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : project.description || project.observations ? (
                <div className="bg-muted/50 p-4 rounded-lg border border-border group relative">
                  <MarkdownRenderer content={project.description || project.observations || ''} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma observação detalhada foi registrada para este projeto.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="w-full">
            <NoteCard projectId={project.id} />
          </div>

          <div className={gapClass}>
            <div className={`grid grid-cols-1 md:grid-cols-2 ${gridGapClass}`}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Controle de Horas (Performance)</CardTitle>
                  <CardDescription>
                    Comparativo de horas estimadas e horas reais apontadas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center">
                  <div className="w-full h-[250px]">
                    <ChartContainer
                      config={{
                        estimated: { label: 'Horas Estimadas', color: 'hsl(var(--chart-1))' },
                        actual: { label: 'Horas Reais', color: 'hsl(var(--chart-2))' },
                      }}
                      className="w-full h-full"
                    >
                      <BarChart
                        data={[
                          {
                            name: 'Horas do Projeto',
                            estimated: estimatedHours,
                            actual: totalActualHours,
                          },
                        ]}
                        margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" hide />
                        <YAxis tickLine={false} axisLine={false} fontSize={12} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar
                          dataKey="estimated"
                          name="Horas Estimadas"
                          fill="var(--color-estimated)"
                          radius={[4, 4, 0, 0]}
                          barSize={60}
                        />
                        <Bar
                          dataKey="actual"
                          name="Horas Reais"
                          fill="var(--color-actual)"
                          radius={[4, 4, 0, 0]}
                          barSize={60}
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Indicadores de Esforço</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                          Horas Estimadas
                        </p>
                        <p className="text-3xl font-bold">{estimatedHours}h</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                          Horas Reais
                        </p>
                        <p className="text-3xl font-bold">{totalActualHours}h</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Esforço Consumido</span>
                        <span>
                          {estimatedHours > 0
                            ? Math.round((totalActualHours / estimatedHours) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <Progress
                        value={estimatedHours > 0 ? (totalActualHours / estimatedHours) * 100 : 0}
                        className={`h-2 ${totalActualHours > estimatedHours ? 'bg-red-100 [&>div]:bg-red-500' : totalActualHours > estimatedHours * 0.8 ? 'bg-amber-100 [&>div]:bg-amber-500' : ''}`}
                      />
                    </div>

                    {totalActualHours > estimatedHours && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm font-medium rounded-md border border-red-200 dark:border-red-900 flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <p>
                          Atenção: O projeto ultrapassou a estimativa de horas planejada em{' '}
                          {totalActualHours - estimatedHours}h. Considere revisar o escopo ou
                          negociar aditivos com o cliente.
                        </p>
                      </div>
                    )}
                    {totalActualHours <= estimatedHours && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-md border border-emerald-200 dark:border-emerald-900 flex items-start gap-2">
                        <TrendingUp className="h-5 w-5 shrink-0" />
                        <p>O projeto está sendo executado dentro do tempo estimado.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Histórico de Horas</CardTitle>
                  <CardDescription>
                    Registro detalhado de horas apontadas neste projeto.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {projectTimeLogs.length > 0 ? (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Membro</TableHead>
                          <TableHead>Atividade</TableHead>
                          <TableHead className="text-right">Horas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectTimeLogs
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="whitespace-nowrap">
                                {format(new Date(log.date), 'dd/MM/yyyy')}
                              </TableCell>
                              <TableCell>{log.user.name}</TableCell>
                              <TableCell>{log.task?.name || 'N/A'}</TableCell>
                              <TableCell className="text-right font-medium">{log.hours}h</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border rounded-md bg-muted/20">
                    Nenhuma hora registrada para este projeto ainda.
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Nota: Os dados exportados refletem o estado local da sessão atual.
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="documents" className="w-full">
            <TabsList
              className={cn(
                'flex flex-wrap w-full h-auto gap-1 p-1',
                canAccessFinance ? 'sm:grid sm:grid-cols-3' : 'sm:grid sm:grid-cols-2',
              )}
            >
              <TabsTrigger value="documents" className="flex-1">
                Documentos
              </TabsTrigger>
              {canAccessFinance && (
                <TabsTrigger value="finance" className="flex-1">
                  Financeiro
                </TabsTrigger>
              )}
              <TabsTrigger value="history" className="flex-1">
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Documentos do Projeto</CardTitle>
                  <CardDescription>
                    Repositório centralizado para contratos, especificações técnicas e plantas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div
                    className={`border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isUploadingDoc ? 'opacity-50 bg-slate-50 dark:bg-slate-900/50' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                    onClick={() =>
                      !isUploadingDoc && document.getElementById('file-upload')?.click()
                    }
                  >
                    <div className="p-3 bg-primary/10 rounded-full mb-4">
                      <UploadCloud className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1">
                      {isUploadingDoc
                        ? 'Enviando arquivos...'
                        : 'Clique ou arraste arquivos para cá'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOCX, DWG, Imagens (Max 10MB)
                    </p>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      multiple
                      disabled={isUploadingDoc}
                      onChange={handleFileUpload}
                    />
                  </div>

                  {pbDocuments.length > 0 ? (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome do Arquivo</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Data de Adição</TableHead>
                            <TableHead className="w-[100px] text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pbDocuments.map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell className="font-medium">
                                <a
                                  href={pb.files.getUrl(doc, doc.file)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 whitespace-nowrap hover:text-primary hover:underline"
                                >
                                  <File className="h-4 w-4 text-muted-foreground" />
                                  {doc.name}
                                </a>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <Select
                                  value={doc.type}
                                  onValueChange={(val) => handleDocTypeChange(doc.id, val)}
                                >
                                  <SelectTrigger className="h-8 w-[130px] text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Contract">Contrato</SelectItem>
                                    <SelectItem value="Technical">Técnico/Planta</SelectItem>
                                    <SelectItem value="Other">Outros</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {new Date(doc.created).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteDoc(doc.id)}
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
                    <div className="text-center py-8 text-muted-foreground border rounded-md bg-muted/20">
                      Nenhum documento anexado ainda.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4 space-y-6">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-lg">Histórico de Alterações</CardTitle>
                    <CardDescription>
                      Registro de alterações de acesso e atribuições de membros na equipe do
                      projeto.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportAuditLogsCSV(auditLogs)}
                      className="flex-1 sm:flex-none"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        exportAuditLogsPDF(auditLogs, user?.name || user?.email || 'Usuário', null)
                      }
                      className="flex-1 sm:flex-none"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {auditLogs.length > 0 ? (
                    <div className="relative border-l border-muted-foreground/30 ml-3 space-y-6">
                      {auditLogs.map((log) => {
                        const targetUser = users.find((u) => u.id === log.details?.target_user)
                        const actionLabelMap: Record<string, string> = {
                          access_granted: 'Acesso Concedido',
                          access_updated: 'Acesso Atualizado',
                          access_revoked: 'Acesso Revogado',
                          assignment_added: 'Membro Atribuído',
                          assignment_removed: 'Membro Removido',
                        }
                        const actionLabel = actionLabelMap[log.action] || 'Ação Desconhecida'

                        let message = ''
                        if (log.action === 'access_granted') {
                          message = `Acesso de ${log.details?.access_level || 'Leitura'} concedido a ${targetUser?.name || 'Usuário'}`
                        } else if (log.action === 'access_updated') {
                          message = `Acesso de ${targetUser?.name || 'Usuário'} alterado para ${log.details?.access_level || 'Leitura'}`
                        } else if (log.action === 'access_revoked') {
                          message = `Acesso de ${targetUser?.name || 'Usuário'} revogado`
                        } else if (log.action === 'assignment_added') {
                          message = `${targetUser?.name || 'Usuário'} atribuído como ${log.details?.role} na disciplina "${log.details?.module_name}"`
                        } else if (log.action === 'assignment_removed') {
                          message = `${targetUser?.name || 'Usuário'} removido da função de ${log.details?.role} na disciplina "${log.details?.module_name}"`
                        } else {
                          message = `Ação: ${log.action}`
                        }

                        return (
                          <div key={log.id} className="pl-6 relative">
                            <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1.5 ring-4 ring-background" />
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-1">
                              <span className="font-medium text-sm">{actionLabel}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(log.created).toLocaleString('pt-BR')} por{' '}
                                {log.expand?.user_id?.name || 'Sistema'}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{message}</p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border rounded-md bg-muted/20">
                      Nenhum histórico registrado para a equipe deste projeto.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Histórico de Relatórios</CardTitle>
                  <CardDescription>
                    Instantâneos do progresso do projeto salvos ao exportar relatórios gerenciais.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reportsHistory.length > 0 ? (
                    <div className="space-y-3">
                      {reportsHistory.map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center justify-between p-4 border rounded-lg bg-muted/10"
                        >
                          <div>
                            <p className="font-medium text-sm flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              Relatório de Especialidades
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(report.created).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="hidden sm:block text-right">
                              <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                                Módulos
                              </p>
                              <p className="font-medium text-sm">
                                {report.snapshot_data?.totalModules || 0}
                              </p>
                            </div>
                            <div className="hidden md:block text-right">
                              <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                                Concluídos
                              </p>
                              <p className="font-medium text-sm text-emerald-600 dark:text-emerald-400">
                                {report.snapshot_data?.modulesByStatus?.['Concluído'] || 0}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                                Progresso
                              </p>
                              <p className="font-bold text-base text-primary">
                                {report.total_progress}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border rounded-md bg-muted/20 text-sm">
                      Nenhum relatório exportado para este projeto ainda.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {canAccessFinance && (
              <TabsContent value="finance" className="mt-4 space-y-6">
                <div className="w-full">
                  <ProjectFinanceTab project={project} />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6 print:hidden">
          <Card className="border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Painel de Crise (48h)
              </CardTitle>
              <CardDescription>Vencimentos críticos e tarefas atrasadas.</CardDescription>
            </CardHeader>
            <CardContent>
              {crisisModules.length > 0 ? (
                <div className="space-y-3">
                  {crisisModules.map((mod) => (
                    <div
                      key={mod.id}
                      className="flex flex-col gap-1 p-3 bg-white dark:bg-slate-950 border border-red-100 dark:border-red-900/50 rounded-md shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-sm">{mod.name}</span>
                        <Badge
                          variant="destructive"
                          className="text-[10px] px-1.5 py-0 h-4 bg-red-500"
                        >
                          {getCountdown(mod.deadline!)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>{mod.edificacao || 'Sem Edificação'}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(mod.deadline!).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground bg-white/50 dark:bg-slate-950/50 p-4 rounded-md border border-dashed text-center">
                  Nenhum vencimento crítico nas próximas 48h.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="w-full">
            <ProjectComments projectId={project.id} />
          </div>
        </div>
      </div>

      <EditProjectModal
        project={project}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja deletar?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso removerá permanentemente o projeto "
              {project.name}" do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
