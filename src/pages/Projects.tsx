import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Filter,
  XCircle,
  Plus,
  CalendarDays,
  Trash2,
  ArrowLeft,
  Briefcase,
  Activity,
  CheckCircle,
  Search,
  LayoutGrid,
  List as ListIcon,
  Archive,
  ArchiveRestore,
  ChevronDown,
} from 'lucide-react'
import useProjectStore from '@/stores/useProjectStore'
import { usePreferencesStore } from '@/stores/usePreferencesStore'
import { usePermissions } from '@/hooks/use-permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ProjectTable } from '@/components/ProjectTable'
import { ProjectCardList } from '@/components/ProjectCardList'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import pb from '@/lib/pocketbase/client'

const PROJECT_STATUSES = [
  'Pendente',
  'Planejamento',
  'Em Andamento',
  'Em Análise',
  'Em Correção',
  'Aguardando Pagamento',
  'Concluído',
  'Atrasado',
]

const months = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
]

export default function Projects({ filterOnlyMine = false }: { filterOnlyMine?: boolean }) {
  const { projects, globalSearch, setNewProjectModalOpen } = useProjectStore()
  const { viewMode, setViewMode } = usePreferencesStore()
  const { user } = useAuth()
  const { toast } = useToast()
  const { can } = usePermissions()

  const [discipline, setDiscipline] = useState<string>('all')
  const [statuses, setStatuses] = useState<string[]>([])
  const [client, setClient] = useState<string>('all')
  const [engineer, setEngineer] = useState<string>('all')
  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [filterYear, setFilterYear] = useState<string>('all')
  const [viewState, setViewState] = useState<'active' | 'archived' | 'trash'>('active')

  const [clients, setClients] = useState<any[]>([])
  const [myAccesses, setMyAccesses] = useState<Record<string, string>>({})
  const [pendingReqs, setPendingReqs] = useState<string[]>([])
  const [requestModalProject, setRequestModalProject] = useState<any>(null)
  const [requestLevel, setRequestLevel] = useState('Leitura')

  const loadClients = useCallback(async () => {
    try {
      const clientsRes = await pb.collection('clients').getFullList()
      setClients(clientsRes)
    } catch {
      /* intentionally ignored */
    }
  }, [])

  const loadAccesses = useCallback(async () => {
    if (!user) return
    if (user.role === 'Administrador' || user.role === 'Gerente de Projeto') {
      try {
        const reqs = await pb
          .collection('access_requests')
          .getFullList({ filter: `user = '${user.id}' && status = 'Pendente'` })
        setPendingReqs(reqs.map((r) => r.project))
      } catch {
        /* intentionally ignored */
      }
      return
    }

    try {
      const [accs, reqs, myModules, myTasks] = await Promise.all([
        pb.collection('user_project_access').getFullList({ filter: `user = '${user.id}'` }),
        pb
          .collection('access_requests')
          .getFullList({ filter: `user = '${user.id}' && status = 'Pendente'` }),
        pb
          .collection('project_modules')
          .getFullList({ filter: `responsible = '${user.id}' || designer = '${user.id}'` }),
        pb.collection('tasks').getFullList({ filter: `responsible = '${user.id}'` }),
      ])
      const map: Record<string, string> = {}
      accs.forEach((a) => {
        if (a.project) map[a.project] = a.access_level
      })
      myModules.forEach((m) => {
        if (m.project && !map[m.project]) map[m.project] = 'Indirect'
      })
      myTasks.forEach((t) => {
        if (t.project && !map[t.project]) map[t.project] = 'Indirect'
      })
      setMyAccesses(map)
      setPendingReqs(reqs.map((r) => r.project))
    } catch {
      /* intentionally ignored */
    }
  }, [user])

  useEffect(() => {
    if (user) {
      usePreferencesStore.getState().loadPreferences(user)
      loadClients()
      loadAccesses()
    }
  }, [user, loadClients, loadAccesses])

  useRealtime('clients', loadClients)
  useRealtime('user_project_access', loadAccesses)
  useRealtime('access_requests', loadAccesses)
  useRealtime('project_modules', loadAccesses)
  useRealtime('tasks', loadAccesses)

  const isLinkedToUser = useCallback(
    (project: any) => user?.assigned_projects?.includes(project.id) || !!myAccesses[project.id],
    [user?.assigned_projects, myAccesses],
  )

  const hasAccess = useCallback(
    (project: any) =>
      user?.role === 'Administrador' ||
      user?.role === 'Gerente de Projeto' ||
      isLinkedToUser(project),
    [user?.role, isLinkedToUser],
  )

  const isPending = (projectId: string) => pendingReqs.includes(projectId)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString())

  const uniqueClients = useMemo(
    () => Array.from(new Set(projects.map((p) => p.client))),
    [projects],
  )
  const uniqueEngineers = useMemo(
    () => Array.from(new Set(projects.map((p) => p.engineer))),
    [projects],
  )

  const filteredProjects = useMemo(() => {
    const s = globalSearch.toLowerCase()
    const matchedClients = clients
      .filter(
        (c) => (c.name || '').toLowerCase().includes(s) || (c.code || '').toLowerCase().includes(s),
      )
      .map((c) => c.name)

    return projects.filter((p) => {
      const matchSearch =
        !s ||
        (p.name || '').toLowerCase().includes(s) ||
        (p.client || '').toLowerCase().includes(s) ||
        matchedClients.includes(p.client)

      const matchDisc = discipline === 'all' || p.discipline === discipline
      const matchStatus = statuses.length === 0 || statuses.includes(p.status)
      const matchClient = client === 'all' || p.client === client
      const matchEngineer = engineer === 'all' || p.engineer === engineer
      const matchTrash = viewState === 'trash' ? !!p.deletedAt : !p.deletedAt
      const matchArchived = viewState === 'archived' ? p.is_archived : !p.is_archived

      let matchPeriod = true
      if (filterMonth !== 'all' || filterYear !== 'all') {
        const d = new Date(p.startDate)
        if (!isNaN(d.getTime())) {
          const pMonth = d.getMonth() + 1
          const pYear = d.getFullYear()
          if (filterMonth !== 'all' && pMonth.toString() !== filterMonth) matchPeriod = false
          if (filterYear !== 'all' && pYear.toString() !== filterYear) matchPeriod = false
        }
      }
      const matchMine = filterOnlyMine ? isLinkedToUser(p) : true
      return (
        matchSearch &&
        matchDisc &&
        matchStatus &&
        matchClient &&
        matchEngineer &&
        matchTrash &&
        matchArchived &&
        matchPeriod &&
        matchMine
      )
    })
  }, [
    projects,
    globalSearch,
    clients,
    discipline,
    statuses,
    client,
    engineer,
    viewState,
    filterMonth,
    filterYear,
    filterOnlyMine,
    isLinkedToUser,
  ])

  const prioritizedProjects = useMemo(() => {
    const sorted = [...filteredProjects]
    sorted.sort(
      (a, b) =>
        (a.ordem ?? 0) - (b.ordem ?? 0) ||
        new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime(),
    )
    return sorted
  }, [filteredProjects])

  const { projectsWithAccess, projectsWithoutAccess } = useMemo(() => {
    const withAcc: typeof prioritizedProjects = []
    const withoutAcc: typeof prioritizedProjects = []
    prioritizedProjects.forEach((p) => {
      if (hasAccess(p)) withAcc.push(p)
      else withoutAcc.push(p)
    })
    return { projectsWithAccess: withAcc, projectsWithoutAccess: withoutAcc }
  }, [prioritizedProjects, hasAccess])

  const totalOpenContracts = useMemo(() => {
    return projectsWithAccess
      .filter((p) => p.status !== 'Concluído' && p.status !== 'Cancelado')
      .reduce((sum, p) => sum + (Number(p.budget) || 0), 0)
  }, [projectsWithAccess])

  const inProgressCount = useMemo(
    () =>
      projectsWithAccess.filter(
        (p) => p.status === 'Em Andamento' || (p.status as any) === 'Em Execução',
      ).length,
    [projectsWithAccess],
  )

  const finishedThisMonthCount = useMemo(() => {
    const targetMonth = filterMonth !== 'all' ? parseInt(filterMonth) : new Date().getMonth() + 1
    const targetYear = filterYear !== 'all' ? parseInt(filterYear) : new Date().getFullYear()
    return projectsWithAccess.filter((p) => {
      if (p.status !== 'Concluído') return false
      const d = new Date(p.endDate)
      if (isNaN(d.getTime())) return false
      return d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear
    }).length
  }, [projectsWithAccess, filterMonth, filterYear])

  const handleRequestAccess = async () => {
    if (!requestModalProject) return
    try {
      await pb.collection('access_requests').create({
        user: user?.id,
        project: requestModalProject.id,
        requested_level: requestLevel,
        status: 'Pendente',
      })
      toast({ title: 'Sucesso', description: 'Solicitação enviada aos administradores.' })
      setPendingReqs((prev) => [...prev, requestModalProject.id])
      setRequestModalProject(null)
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao solicitar acesso.', variant: 'destructive' })
    }
  }

  const clearFilters = () => {
    setDiscipline('all')
    setStatuses([])
    setClient('all')
    setEngineer('all')
    setFilterMonth('all')
    setFilterYear('all')
  }

  const hasActiveFilters =
    discipline !== 'all' ||
    statuses.length > 0 ||
    client !== 'all' ||
    engineer !== 'all' ||
    filterMonth !== 'all' ||
    filterYear !== 'all'

  return (
    <div className="w-full mx-auto py-8 px-4 md:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            {filterOnlyMine ? 'Meus Projetos' : 'Lista de Projetos'}
          </h1>
          <p className="text-muted-foreground">
            {filterOnlyMine
              ? 'Visualize e gerencie os projetos sob sua responsabilidade.'
              : 'Pesquise, filtre e gerencie os detalhes dos projetos.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projeto, cliente ou código..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-9 bg-background"
            />
            {globalSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                onClick={() => setGlobalSearch('')}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as 'grid' | 'table', user?.id)}
            className="border rounded-md flex shrink-0 bg-background"
          >
            <ToggleGroupItem value="table" aria-label="Ver em Tabela">
              <ListIcon className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Ver em Cards">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          {viewState !== 'active' ? (
            <Button variant="default" onClick={() => setViewState('active')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setViewState('archived')}>
                <Archive className="mr-2 h-4 w-4" /> Arquivados
              </Button>
              <Button variant="outline" onClick={() => setViewState('trash')}>
                <Trash2 className="mr-2 h-4 w-4" /> Lixeira
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const res = await fetch(
                  `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/calendar/projects.ics`,
                  { headers: { Authorization: `Bearer ${pb.authStore.token}` } },
                )
                if (!res.ok) throw new Error('Failed to export')
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'projects.ics'
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
              } catch (e) {
                console.error(e)
              }
            }}
          >
            <CalendarDays className="mr-2 h-4 w-4" /> Exportar Calendário (ICS)
          </Button>
          {(user?.role === 'Administrador' || can('create', 'projects')) && (
            <Button onClick={() => setNewProjectModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Novo Projeto
            </Button>
          )}
        </div>
      </div>

      <div
        className={`grid gap-4 mb-6 ${user?.role === 'Administrador' || user?.role === 'Gerente de Projeto' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}
      >
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projetos em Andamento
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Projetos ativos no momento</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concluídos {filterMonth !== 'all' ? 'no Período' : 'neste Mês'}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{finishedThisMonthCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Projetos entregues</p>
          </CardContent>
        </Card>
        {(user?.role === 'Administrador' || user?.role === 'Gerente de Projeto') && (
          <Card className="shadow-sm border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor de Contrato em Aberto
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  totalOpenContracts,
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Soma dos projetos filtrados</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="bg-card p-4 rounded-xl border border-border shadow-sm mb-6 flex flex-col xl:flex-row gap-4 items-start xl:items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground shrink-0">
          <Filter className="h-4 w-4" /> Filtros:
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-full bg-background border-input">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mês (Todos)</SelectItem>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-full bg-background border-input">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Ano (Todos)</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={discipline} onValueChange={setDiscipline}>
            <SelectTrigger className="w-full bg-background border-input">
              <SelectValue placeholder="Disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Disciplinas (Todas)</SelectItem>
              <SelectItem value="Estrutural">Estrutural</SelectItem>
              <SelectItem value="Hidrossanitário">Hidrossanitário</SelectItem>
              <SelectItem value="Elétrico">Elétrico</SelectItem>
              <SelectItem value="Prevenção a Incêndio">Prevenção a Incêndio</SelectItem>
              <SelectItem value="AVAC">AVAC</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between font-normal bg-background border-input px-3"
              >
                <span className="truncate">
                  {statuses.length === 0 ? 'Status (Todos)' : `${statuses.length} selecionado(s)`}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2" align="start">
              <div className="flex flex-col gap-1">
                {PROJECT_STATUSES.map((s) => (
                  <label
                    key={s}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1.5 rounded-md"
                  >
                    <Checkbox
                      checked={statuses.includes(s)}
                      onCheckedChange={(checked) => {
                        if (checked) setStatuses([...statuses, s])
                        else setStatuses(statuses.filter((st) => st !== s))
                      }}
                    />
                    <span className="truncate">{s}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Select value={client} onValueChange={setClient}>
            <SelectTrigger className="w-full bg-background border-input">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Clientes (Todos)</SelectItem>
              {uniqueClients.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={engineer} onValueChange={setEngineer}>
            <SelectTrigger className="w-full bg-background border-input">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Responsáveis (Todos)</SelectItem>
              {uniqueEngineers.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground shrink-0 w-full xl:w-auto mt-2 xl:mt-0"
          >
            <XCircle className="h-4 w-4 mr-2" /> Limpar
          </Button>
        )}
      </div>

      {prioritizedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <img
            src="https://img.usecurling.com/p/300/300?q=empty%20desk&color=gray"
            alt="No projects"
            className="w-64 h-64 object-cover rounded-full mb-6 opacity-80"
          />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {viewState === 'trash'
              ? 'Lixeira vazia'
              : viewState === 'archived'
                ? 'Nenhum projeto arquivado'
                : 'Nenhum projeto encontrado'}
          </h3>
          <p className="text-muted-foreground max-w-md">
            {viewState === 'trash'
              ? 'Não há projetos excluídos recentemente.'
              : viewState === 'archived'
                ? 'Você ainda não arquivou nenhum projeto.'
                : 'Não encontramos nenhum projeto com os filtros aplicados.'}
          </p>
        </div>
      ) : user?.role === 'Administrador' ||
        user?.role === 'Gerente de Projeto' ||
        filterOnlyMine ? (
        <>
          {viewMode === 'table' ? (
            <ProjectTable
              projects={projectsWithAccess}
              isTrashView={viewState === 'trash'}
              isArchivedView={viewState === 'archived'}
            />
          ) : (
            <ProjectCardList
              projects={projectsWithAccess}
              isTrashView={viewState === 'trash'}
              isArchivedView={viewState === 'archived'}
            />
          )}
        </>
      ) : (
        <Tabs defaultValue="with-access" className="w-full">
          <TabsList className="mb-4 bg-muted p-1">
            <TabsTrigger value="with-access">
              Meus Acessos ({projectsWithAccess.length})
            </TabsTrigger>
            <TabsTrigger value="without-access">
              Outros Projetos ({projectsWithoutAccess.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="with-access">
            {projectsWithAccess.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">
                Nenhum projeto com acesso no momento.
              </p>
            ) : viewMode === 'table' ? (
              <ProjectTable
                projects={projectsWithAccess}
                isTrashView={viewState === 'trash'}
                isArchivedView={viewState === 'archived'}
              />
            ) : (
              <ProjectCardList
                projects={projectsWithAccess}
                isTrashView={viewState === 'trash'}
                isArchivedView={viewState === 'archived'}
              />
            )}
          </TabsContent>
          <TabsContent value="without-access">
            {projectsWithoutAccess.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">
                Nenhum outro projeto disponível.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectsWithoutAccess.map((p) => (
                  <Card key={p.id} className="border-border bg-card shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-foreground">{p.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {p.client} • {p.discipline}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {isPending(p.id) ? (
                        <Badge className="w-full justify-center py-1.5 bg-primary/10 text-primary border-primary/20 font-medium text-sm hover:bg-primary/20">
                          Solicitação Pendente
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full border-primary/50 text-primary hover:bg-primary/10"
                          onClick={() => setRequestModalProject(p)}
                        >
                          Solicitar Acesso
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog
        open={!!requestModalProject}
        onOpenChange={(open) => !open && setRequestModalProject(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Acesso</DialogTitle>
            <DialogDescription>
              Selecione o nível de acesso desejado para o projeto{' '}
              <strong>{requestModalProject?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nível de Acesso</Label>
              <Select value={requestLevel} onValueChange={setRequestLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Leitura">Leitura</SelectItem>
                  <SelectItem value="Edição">Edição</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRequestModalProject(null)}>
              Cancelar
            </Button>
            <Button onClick={handleRequestAccess}>Enviar Solicitação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
