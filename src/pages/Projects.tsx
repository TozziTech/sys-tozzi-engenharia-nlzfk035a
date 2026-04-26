import { useState, useMemo, useEffect } from 'react'
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
} from 'lucide-react'
import useProjectStore from '@/stores/useProjectStore'
import { usePreferencesStore } from '@/stores/usePreferencesStore'
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
import pb from '@/lib/pocketbase/client'

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

  const [discipline, setDiscipline] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [client, setClient] = useState<string>('all')
  const [engineer, setEngineer] = useState<string>('all')
  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [filterYear, setFilterYear] = useState<string>('all')
  const [showTrash, setShowTrash] = useState(false)

  const [clients, setClients] = useState<any[]>([])
  const [myAccesses, setMyAccesses] = useState<Record<string, string>>({})
  const [pendingReqs, setPendingReqs] = useState<string[]>([])
  const [requestModalProject, setRequestModalProject] = useState<any>(null)
  const [requestLevel, setRequestLevel] = useState('Leitura')

  useEffect(() => {
    if (user) {
      usePreferencesStore.getState().loadPreferences(user)
    }
    if (!user || user.role === 'Administrador') return
    const load = async () => {
      try {
        const [accs, reqs, clientsRes] = await Promise.all([
          pb.collection('user_project_access').getFullList({ filter: `user = '${user.id}'` }),
          pb
            .collection('access_requests')
            .getFullList({ filter: `user = '${user.id}' && status = 'Pendente'` }),
          pb.collection('clients').getFullList(),
        ])
        setClients(clientsRes)
        const map: Record<string, string> = {}
        accs.forEach((a) => (map[a.project] = a.access_level))
        setMyAccesses(map)
        setPendingReqs(reqs.map((r) => r.project))
      } catch {
        /* intentionally ignored */
      }
    }
    load()
  }, [user])

  const hasAccess = (projectId: string) => user?.role === 'Administrador' || !!myAccesses[projectId]
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
      const matchStatus = status === 'all' || p.status === status
      const matchClient = client === 'all' || p.client === client
      const matchEngineer = engineer === 'all' || p.engineer === engineer
      const matchTrash = showTrash ? !!p.deletedAt : !p.deletedAt

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
      const matchMine = filterOnlyMine ? p.engineer === user?.name : true
      return (
        matchSearch &&
        matchDisc &&
        matchStatus &&
        matchClient &&
        matchEngineer &&
        matchTrash &&
        matchPeriod &&
        matchMine
      )
    })
  }, [
    projects,
    globalSearch,
    clients,
    discipline,
    status,
    client,
    engineer,
    showTrash,
    filterMonth,
    filterYear,
    filterOnlyMine,
    user?.name,
  ])

  const prioritizedProjects = useMemo(() => {
    const sorted = [...filteredProjects]
    if (user?.role === 'Projetista') {
      sorted.sort((a, b) => {
        const aIsMine = a.engineer === user.name
        const bIsMine = b.engineer === user.name
        if (aIsMine && !bIsMine) return -1
        if (!aIsMine && bIsMine) return 1
        return 0
      })
    }
    return sorted
  }, [filteredProjects, user?.role, user?.name])

  const { projectsWithAccess, projectsWithoutAccess } = useMemo(() => {
    const withAcc: typeof prioritizedProjects = []
    const withoutAcc: typeof prioritizedProjects = []
    prioritizedProjects.forEach((p) => {
      if (hasAccess(p.id)) withAcc.push(p)
      else withoutAcc.push(p)
    })
    return { projectsWithAccess: withAcc, projectsWithoutAccess: withoutAcc }
  }, [prioritizedProjects, myAccesses, user?.role])

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
    setStatus('all')
    setClient('all')
    setEngineer('all')
    setFilterMonth('all')
    setFilterYear('all')
  }

  const hasActiveFilters =
    discipline !== 'all' ||
    status !== 'all' ||
    client !== 'all' ||
    engineer !== 'all' ||
    filterMonth !== 'all' ||
    filterYear !== 'all'

  return (
    <div className="w-full mx-auto py-8 px-4 md:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Buscar projeto, cliente ou código..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-9 bg-white dark:bg-zinc-900"
            />
            {globalSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-500"
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
            className="border rounded-md hidden md:flex shrink-0 bg-white dark:bg-zinc-900"
          >
            <ToggleGroupItem value="table" aria-label="Ver em Tabela">
              <ListIcon className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Ver em Cards">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            variant={showTrash ? 'default' : 'outline'}
            onClick={() => setShowTrash(!showTrash)}
            className={showTrash ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {showTrash ? (
              <>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Projetos
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" /> Lixeira
              </>
            )}
          </Button>
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
          <Button onClick={() => setNewProjectModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Projeto
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Projetos em Andamento
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Projetos ativos no momento</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Concluídos {filterMonth !== 'all' ? 'no Período' : 'neste Mês'}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{finishedThisMonthCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Projetos entregues</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">
              Valor de Contrato em Aberto
            </CardTitle>
            <Briefcase className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                totalOpenContracts,
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Soma dos projetos filtrados</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col xl:flex-row gap-4 items-start xl:items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 shrink-0">
          <Filter className="h-4 w-4" /> Filtros:
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-full bg-slate-50 border-transparent">
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
            <SelectTrigger className="w-full bg-slate-50 border-transparent">
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
            <SelectTrigger className="w-full bg-slate-50 border-transparent">
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
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full bg-slate-50 border-transparent">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status (Todos)</SelectItem>
              <SelectItem value="Planejamento">Planejamento</SelectItem>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Concluído">Concluído</SelectItem>
              <SelectItem value="Atrasado">Atrasado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={client} onValueChange={setClient}>
            <SelectTrigger className="w-full bg-slate-50 border-transparent">
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
            <SelectTrigger className="w-full bg-slate-50 border-transparent">
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
            className="text-slate-500 hover:text-slate-900 shrink-0 w-full xl:w-auto mt-2 xl:mt-0"
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
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {showTrash ? 'Lixeira vazia' : 'Nenhum projeto encontrado'}
          </h3>
          <p className="text-muted-foreground max-w-md">
            {showTrash
              ? 'Não há projetos excluídos recentemente.'
              : 'Não encontramos nenhum projeto com os filtros aplicados.'}
          </p>
        </div>
      ) : user?.role === 'Administrador' || filterOnlyMine ? (
        <>
          <div className={viewMode === 'grid' ? 'hidden md:hidden' : 'hidden md:block'}>
            <ProjectTable projects={projectsWithAccess} isTrashView={showTrash} />
          </div>
          <div className={viewMode === 'table' ? 'block md:hidden' : 'block'}>
            <ProjectCardList projects={projectsWithAccess} isTrashView={showTrash} />
          </div>
        </>
      ) : (
        <Tabs defaultValue="with-access" className="w-full">
          <TabsList className="mb-4 bg-slate-100 dark:bg-zinc-900 p-1">
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
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'hidden md:hidden' : 'hidden md:block'}>
                  <ProjectTable projects={projectsWithAccess} isTrashView={showTrash} />
                </div>
                <div className={viewMode === 'table' ? 'block md:hidden' : 'block'}>
                  <ProjectCardList projects={projectsWithAccess} isTrashView={showTrash} />
                </div>
              </>
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
                  <Card
                    key={p.id}
                    className="border-amber-500/20 bg-white dark:bg-zinc-900/40 backdrop-blur-md shadow-sm"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-amber-600 dark:text-amber-500">
                        {p.name}
                      </CardTitle>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                        {p.client} • {p.discipline}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {isPending(p.id) ? (
                        <Badge className="w-full justify-center py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-300 dark:border-amber-500/30 font-medium text-sm hover:bg-amber-100 dark:hover:bg-amber-500/20">
                          Solicitação Pendente
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full border-amber-500/50 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10"
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
        <DialogContent className="bg-white dark:bg-zinc-950 border-amber-500/20 shadow-2xl dark:shadow-black/80">
          <DialogHeader>
            <DialogTitle className="text-amber-600 dark:text-amber-500">
              Solicitar Acesso
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-zinc-400">
              Selecione o nível de acesso desejado para o projeto{' '}
              <strong>{requestModalProject?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-zinc-300">Nível de Acesso</Label>
              <Select value={requestLevel} onValueChange={setRequestLevel}>
                <SelectTrigger className="bg-slate-50 dark:bg-zinc-900/80 border-amber-500/30 text-amber-600 dark:text-amber-500 focus:ring-amber-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-amber-500/20">
                  <SelectItem
                    value="Leitura"
                    className="focus:bg-amber-50 dark:focus:bg-amber-500/20 focus:text-amber-600 dark:focus:text-amber-500"
                  >
                    Leitura
                  </SelectItem>
                  <SelectItem
                    value="Edição"
                    className="focus:bg-amber-50 dark:focus:bg-amber-500/20 focus:text-amber-600 dark:focus:text-amber-500"
                  >
                    Edição
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="border-t border-slate-200 dark:border-amber-500/20 pt-4">
            <Button
              variant="ghost"
              onClick={() => setRequestModalProject(null)}
              className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRequestAccess}
              className="bg-amber-500 text-white dark:text-zinc-950 hover:bg-amber-600 shadow-md dark:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
