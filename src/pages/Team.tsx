import { useState, useMemo, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { MemberCard } from '@/components/team/MemberCard'
import { MemberForm } from '@/components/team/MemberForm'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Users } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
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
    return dbUsers.filter((m) => {
      const mFormacao = m.formacao || m.specialty
      const matchesFormacao = formacaoFilter === 'all' || mFormacao === formacaoFilter
      const searchString = `${m.codigo || ''} ${m.name}`.toLowerCase()
      const matchesSearch = !searchQuery || searchString.includes(searchQuery.toLowerCase())
      return matchesFormacao && matchesSearch
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
    <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" /> Equipe
          </h1>
          <p className="text-muted-foreground">
            Gerencie os membros da equipe, especialidades, acessos e dados financeiros.
          </p>
        </div>
        <MemberForm onAdd={() => {}} />
      </div>

      <Card className="p-6 flex flex-col items-center shadow-sm w-full bg-card">
        <h2 className="text-lg font-semibold w-full text-left mb-4">
          Distribuição da Equipe por Formação
        </h2>
        {formacaoData.length > 0 ? (
          <div className="h-[250px] w-full max-w-[500px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <PieChart>
                <Pie
                  data={formacaoData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {formacaoData.map((entry) => (
                    <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            Nenhum dado disponível.
          </div>
        )}
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código..."
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[260px]">
          <Select value={formacaoFilter} onValueChange={setFormacaoFilter}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Filtrar por Formação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Formações</SelectItem>
              {formacoes.map((form) => (
                <SelectItem key={form} value={form}>
                  {form}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:ml-auto text-sm font-medium text-muted-foreground">
          {filteredMembers.length} {filteredMembers.length === 1 ? 'membro' : 'membros'} encontrado
          {filteredMembers.length !== 1 && 's'}
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
        <Card className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center border-dashed bg-muted/10">
          <div className="bg-background p-4 rounded-full mb-4 shadow-sm border border-border/50">
            <Users className="h-10 w-10 text-muted-foreground/60" />
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
