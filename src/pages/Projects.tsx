import { useState, useMemo } from 'react'
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
} from 'lucide-react'
import useProjectStore from '@/stores/useProjectStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const { user } = useAuth()

  const [discipline, setDiscipline] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [client, setClient] = useState<string>('all')
  const [engineer, setEngineer] = useState<string>('all')
  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [filterYear, setFilterYear] = useState<string>('all')
  const [showTrash, setShowTrash] = useState(false)

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
    return projects.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        p.client.toLowerCase().includes(globalSearch.toLowerCase())
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

  const totalOpenContracts = useMemo(() => {
    return prioritizedProjects
      .filter((p) => p.status !== 'Concluído' && p.status !== 'Cancelado')
      .reduce((sum, p) => sum + (Number(p.budget) || 0), 0)
  }, [prioritizedProjects])

  const inProgressCount = useMemo(() => {
    return prioritizedProjects.filter(
      (p) => p.status === 'Em Andamento' || (p.status as any) === 'Em Execução',
    ).length
  }, [prioritizedProjects])

  const finishedThisMonthCount = useMemo(() => {
    const targetMonth = filterMonth !== 'all' ? parseInt(filterMonth) : new Date().getMonth() + 1
    const targetYear = filterYear !== 'all' ? parseInt(filterYear) : new Date().getFullYear()

    return prioritizedProjects.filter((p) => {
      if (p.status !== 'Concluído') return false
      const d = new Date(p.endDate)
      if (isNaN(d.getTime())) return false
      return d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear
    }).length
  }, [prioritizedProjects, filterMonth, filterYear])

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
        <div className="flex flex-col sm:flex-row gap-3">
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
                const { default: pb } = await import('@/lib/pocketbase/client')
                const res = await fetch(
                  `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/calendar/projects.ics`,
                  {
                    headers: { Authorization: `Bearer ${pb.authStore.token}` },
                  },
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

      {/* Summary Cards */}
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
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalOpenContracts)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Soma dos projetos filtrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
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
              <SelectItem value="Gás">Gás</SelectItem>
              <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
              <SelectItem value="Arquitetura">Arquitetura</SelectItem>
              <SelectItem value="Geotecnia">Geotecnia</SelectItem>
              <SelectItem value="Ambiental">Ambiental</SelectItem>
              <SelectItem value="Telecomunicações">Telecomunicações</SelectItem>
              <SelectItem value="Design de Interiores">Design de Interiores</SelectItem>
              <SelectItem value="Luminotécnica">Luminotécnica</SelectItem>
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

      {/* Content Area */}
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
              : 'Não encontramos nenhum projeto com os filtros aplicados. Tente ajustar sua busca ou crie um novo projeto.'}
          </p>
        </div>
      ) : (
        <>
          <ProjectTable projects={prioritizedProjects} isTrashView={showTrash} />
          <ProjectCardList projects={prioritizedProjects} isTrashView={showTrash} />
        </>
      )}
    </div>
  )
}
