import { useState, useMemo, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MemberCard } from '@/components/team/MemberCard'
import { MemberCardSkeleton } from '@/components/team/MemberCardSkeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { exportTeamCSV } from '@/lib/export'
import { exportTeamPDF } from '@/lib/exportPdf'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Users,
  Download,
  Plus,
  FileText,
  FileSpreadsheet,
  Loader2,
  UserCheck,
} from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { TeamAuditModal } from '@/components/team/TeamAuditModal'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { PieChart, Pie } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'

const roleConfig = {
  value: { label: 'Colaboradores' },
  Administrador: { label: 'Administrador', color: '#f59e0b' },
  'Gerente de Projeto': { label: 'Gerente de Projeto', color: '#d97706' },
  Projetista: { label: 'Projetista', color: '#fbbf24' },
  Estagiário: { label: 'Estagiário', color: '#fcd34d' },
  Visitante: { label: 'Visitante', color: '#fef3c7' },
  Cliente: { label: 'Cliente', color: '#b45309' },
  'Sem Função': { label: 'Sem Função', color: '#52525b' },
} satisfies ChartConfig

const statusConfig = {
  value: { label: 'Colaboradores' },
  Ativo: { label: 'Ativo', color: '#f59e0b' },
  Inativo: { label: 'Inativo', color: '#52525b' },
  'Em Férias': { label: 'Em Férias', color: '#fbbf24' },
  Pendente: { label: 'Pendente', color: '#fcd34d' },
  'Sem Status': { label: 'Sem Status', color: '#71717a' },
} satisfies ChartConfig

export default function Team() {
  const [dbUsers, setDbUsers] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('Ativo')
  const [formacaoFilter, setFormacaoFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isFiltering, setIsFiltering] = useState(false)
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const loadUsers = async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    try {
      const records = await pb.collection('users').getFullList({ sort: '+codigo' })
      setDbUsers(records)
    } catch (error) {
      console.error('Failed to load users', error)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers(true)
  }, [])

  useEffect(() => {
    setIsFiltering(true)
    const timer = setTimeout(() => setIsFiltering(false), 400)
    return () => clearTimeout(timer)
  }, [statusFilter, formacaoFilter, searchQuery])

  useRealtime('users', () => {
    loadUsers(false)
  })

  const formacoes = useMemo(() => {
    const forms = new Set(dbUsers.map((m) => m.formacao || m.specialty).filter(Boolean))
    return Array.from(forms) as string[]
  }, [dbUsers])

  const roleCount = useMemo(() => {
    return dbUsers.reduce(
      (acc, u) => {
        const role = u.role || 'Sem Função'
        acc[role] = (acc[role] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
  }, [dbUsers])

  const statusCount = useMemo(() => {
    return dbUsers.reduce(
      (acc, u) => {
        const status = u.status || 'Sem Status'
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
  }, [dbUsers])

  const roleDataWithFill = useMemo(() => {
    return Object.entries(roleCount).map(([name, value]) => ({
      name,
      value,
      fill: (roleConfig as any)[name]?.color || '#52525b',
    }))
  }, [roleCount])

  const statusDataWithFill = useMemo(() => {
    return Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
      fill: (statusConfig as any)[name]?.color || '#71717a',
    }))
  }, [statusCount])

  const filteredMembers = useMemo(() => {
    const filtered = dbUsers.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false

      const mFormacao = m.formacao || m.specialty
      const matchesFormacao = formacaoFilter === 'all' || mFormacao === formacaoFilter
      const searchString = `${m.codigo || ''} ${m.name}`.toLowerCase()
      const matchesSearch = !searchQuery || searchString.includes(searchQuery.toLowerCase())
      return matchesFormacao && matchesSearch
    })

    return filtered.sort((a, b) => {
      const codeA = a.codigo || ''
      const codeB = b.codigo || ''
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' })
    })
  }, [dbUsers, formacaoFilter, searchQuery, statusFilter])

  const handleDeleteMember = async (id: string) => {
    try {
      await pb.collection('users').delete(id)
      toast({ title: 'Sucesso', description: 'Membro removido com sucesso.' })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleExportCSV = () => {
    setIsExporting(true)
    try {
      exportTeamCSV(filteredMembers)
      toast({ title: 'Sucesso', description: 'Exportação CSV concluída.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao exportar CSV.', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      let settings = null
      try {
        settings = await pb.collection('company_settings').getFirstListItem('')
      } catch (e) {
        // ignore missing settings
      }
      exportTeamPDF(filteredMembers, user?.name || 'Usuário', settings)
      toast({ title: 'Sucesso', description: 'Relatório PDF gerado com sucesso.' })
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao exportar PDF.', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="w-full mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" /> Equipe
          </h1>
          <p className="text-muted-foreground">
            Gerencie os membros da equipe, especialidades, acessos e dados financeiros.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {user?.role === 'Administrador' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting}>
                  {isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                  Exportar como CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4 text-rose-600" />
                  Exportar como PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {user?.role === 'Administrador' && <TeamAuditModal />}
          <Button onClick={() => navigate('/team/new')}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Membro
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {/* Role Chart Card */}
        <Card className="bg-zinc-900/80 backdrop-blur-xl border-amber-500/20 shadow-[0_0_30px_-10px_rgba(245,158,11,0.1)] transition-all hover:border-amber-500/40 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-amber-400 flex items-center gap-2 font-semibold">
              <UserCheck className="h-5 w-5" />
              Distribuição por Perfil
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Total de colaboradores por função
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="h-[280px] flex items-center justify-center text-zinc-500 animate-pulse">
                Carregando dados...
              </div>
            ) : dbUsers.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/30">
                Nenhum dado disponível
              </div>
            ) : (
              <ChartContainer config={roleConfig} className="h-[280px] w-full">
                <PieChart>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        const percent = (data.percent * 100).toFixed(1)
                        return (
                          <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg shadow-lg">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full shadow-sm"
                                style={{ backgroundColor: data.fill }}
                              />
                              <span className="text-zinc-200 font-medium">{data.name}</span>
                            </div>
                            <div className="text-zinc-400 text-sm mt-1 ml-5">
                              Total: {data.value} ({percent}%)
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Pie
                    data={roleDataWithFill}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    stroke="rgba(24, 24, 27, 0.8)"
                    strokeWidth={2}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Chart Card */}
        <Card className="bg-zinc-900/80 backdrop-blur-xl border-amber-500/20 shadow-[0_0_30px_-10px_rgba(245,158,11,0.1)] transition-all hover:border-amber-500/40 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-amber-400 flex items-center gap-2 font-semibold">
              <Users className="h-5 w-5" />
              Status dos Colaboradores
            </CardTitle>
            <CardDescription className="text-zinc-400">Situação atual da equipe</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="h-[280px] flex items-center justify-center text-zinc-500 animate-pulse">
                Carregando dados...
              </div>
            ) : dbUsers.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/30">
                Nenhum dado disponível
              </div>
            ) : (
              <ChartContainer config={statusConfig} className="h-[280px] w-full">
                <PieChart>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        const percent = (data.percent * 100).toFixed(1)
                        return (
                          <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg shadow-lg">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full shadow-sm"
                                style={{ backgroundColor: data.fill }}
                              />
                              <span className="text-zinc-200 font-medium">{data.name}</span>
                            </div>
                            <div className="text-zinc-400 text-sm mt-1 ml-5">
                              Total: {data.value} ({percent}%)
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Pie
                    data={statusDataWithFill}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    stroke="rgba(24, 24, 27, 0.8)"
                    strokeWidth={2}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-start mb-4 overflow-x-auto pb-2 scrollbar-none">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
          <TabsList className="bg-muted p-1 h-auto rounded-lg inline-flex w-max min-w-full sm:min-w-0">
            <TabsTrigger
              value="all"
              className="rounded-md px-4 py-1.5 text-sm font-medium flex items-center gap-1.5"
            >
              Todos
              <span className="bg-background/50 text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-sm leading-none">
                {dbUsers.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="Ativo"
              className="rounded-md px-4 py-1.5 text-sm font-medium flex items-center gap-1.5"
            >
              Ativos
              <span className="bg-background/50 text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-sm leading-none">
                {dbUsers.filter((u) => u.status === 'Ativo').length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="Inativo"
              className="rounded-md px-4 py-1.5 text-sm font-medium flex items-center gap-1.5"
            >
              Inativos
              <span className="bg-background/50 text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-sm leading-none">
                {dbUsers.filter((u) => u.status === 'Inativo').length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="Em Férias"
              className="rounded-md px-4 py-1.5 text-sm font-medium flex items-center gap-1.5"
            >
              Em Férias
              <span className="bg-background/50 text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-sm leading-none">
                {dbUsers.filter((u) => u.status === 'Em Férias').length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="Pendente"
              className="rounded-md px-4 py-1.5 text-sm font-medium flex items-center gap-1.5"
            >
              Pendentes
              <span className="bg-background/50 text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-sm leading-none">
                {dbUsers.filter((u) => u.status === 'Pendente').length}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="bg-card p-2 rounded-2xl border border-border/40 shadow-sm flex flex-col sm:flex-row gap-2 items-center">
        <div className="relative w-full flex-1">
          <Search className="absolute left-4 top-3 h-5 w-5 text-muted-foreground/60" />
          <Input
            placeholder="Buscar profissional por nome ou código..."
            className="pl-12 h-11 bg-transparent border-none shadow-none focus-visible:ring-0 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-px h-8 bg-border/50 hidden sm:block mx-1"></div>
        <div className="w-full sm:w-[280px] shrink-0">
          <Select value={formacaoFilter} onValueChange={setFormacaoFilter}>
            <SelectTrigger className="h-11 bg-transparent border-none shadow-none focus:ring-0 focus:ring-offset-0 px-4 font-medium">
              <SelectValue placeholder="Filtrar por Formação" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Todas as Formações</SelectItem>
              {formacoes.map((form) => (
                <SelectItem key={form} value={form}>
                  {form}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading || isFiltering ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <MemberCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              user={member}
              onUpdate={(updatedUser) => {
                setDbUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
              }}
              onDelete={handleDeleteMember}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center border-dashed bg-muted/10 rounded-2xl">
          <div className="bg-background p-5 rounded-full mb-4 shadow-sm border border-border/50">
            <Users className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            {statusFilter === 'all'
              ? 'Nenhum membro encontrado'
              : `Nenhum membro ${statusFilter.toLowerCase()} encontrado`}
          </p>
          <p className="text-sm mt-1">
            Ajuste os filtros de busca ou adicione um novo membro à equipe.
          </p>
        </Card>
      )}
    </div>
  )
}
