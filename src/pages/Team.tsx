import { useState, useMemo, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { MemberCard } from '@/components/team/MemberCard'
import { MemberForm } from '@/components/team/MemberForm'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { exportTeamCSV } from '@/lib/export'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Users, Download } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { RoleManagementModal } from '@/components/team/RoleManagementModal'
import { TeamAuditModal } from '@/components/team/TeamAuditModal'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { PieChart, Pie, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

export default function Team() {
  const [dbUsers, setDbUsers] = useState<any[]>([])
  const [formacaoFilter, setFormacaoFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()
  const { user } = useAuth()

  const loadUsers = async () => {
    try {
      const records = await pb.collection('users').getFullList({ sort: '+codigo' })
      setDbUsers(records)
    } catch (error) {
      console.error('Failed to load users', error)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useRealtime('users', () => {
    loadUsers()
  })

  const formacoes = useMemo(() => {
    const forms = new Set(dbUsers.map((m) => m.formacao || m.specialty).filter(Boolean))
    return Array.from(forms) as string[]
  }, [dbUsers])

  const formacaoData = useMemo(() => {
    const counts: Record<string, number> = {}
    dbUsers.forEach((u) => {
      const f = u.formacao || u.specialty || 'Não Informada'
      counts[f] = (counts[f] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value], index) => ({
        name,
        value,
        key: `chart${index + 1}`,
      }))
      .sort((a, b) => b.value - a.value)
  }, [dbUsers])

  const chartConfig = useMemo(() => {
    const config: Record<string, any> = {
      value: { label: 'Profissionais' },
    }
    formacaoData.forEach((item, i) => {
      config[item.key] = { label: item.name, color: `hsl(var(--chart-${(i % 5) + 1}))` }
    })
    return config
  }, [formacaoData])

  const filteredMembers = useMemo(() => {
    const filtered = dbUsers.filter((m) => {
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
  }, [dbUsers, formacaoFilter, searchQuery])

  const handleDeleteMember = async (id: string) => {
    try {
      await pb.collection('users').delete(id)
      toast({ title: 'Sucesso', description: 'Membro removido com sucesso.' })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          <Button variant="outline" onClick={() => exportTeamCSV(filteredMembers)}>
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          {user?.role === 'Administrador' && (
            <>
              <TeamAuditModal />
              <RoleManagementModal users={dbUsers} onUpdate={loadUsers} />
            </>
          )}
          <MemberForm onAdd={() => {}} />
        </div>
      </div>

      <Card className="p-6 md:p-8 rounded-2xl shadow-sm border-border/40 bg-gradient-to-br from-card to-card/50 overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div>
              <h2 className="text-xl font-semibold mb-1">Distribuição da Equipe</h2>
              <p className="text-sm text-muted-foreground">
                Membros agrupados por área de formação ou especialidade.
              </p>
            </div>

            <div className="flex justify-center md:justify-start gap-8">
              <div className="space-y-1">
                <p className="text-4xl font-bold tracking-tight">{dbUsers.length}</p>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                  Total
                </p>
              </div>
              <div className="w-px bg-border/60"></div>
              <div className="space-y-1">
                <p className="text-4xl font-bold tracking-tight text-emerald-600">
                  {dbUsers.filter((u) => u.status !== 'Inativo').length}
                </p>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                  Ativos
                </p>
              </div>
            </div>
          </div>

          <div className="h-[220px] w-full md:w-[400px] shrink-0">
            {formacaoData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <PieChart>
                  <Pie
                    data={formacaoData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {formacaoData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={`var(--color-${entry.key})`}
                        className="drop-shadow-sm"
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend
                    content={<ChartLegendContent />}
                    className="-translate-y-2 flex-wrap"
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border/50 rounded-xl">
                Nenhum dado disponível.
              </div>
            )}
          </div>
        </div>
      </Card>

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

      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              user={member}
              onUpdate={() => {}}
              onDelete={handleDeleteMember}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center border-dashed bg-muted/10 rounded-2xl">
          <div className="bg-background p-5 rounded-full mb-4 shadow-sm border border-border/50">
            <Users className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-semibold text-foreground">Nenhum membro encontrado</p>
          <p className="text-sm mt-1">
            Ajuste os filtros de busca ou adicione um novo membro à equipe.
          </p>
        </Card>
      )}
    </div>
  )
}
