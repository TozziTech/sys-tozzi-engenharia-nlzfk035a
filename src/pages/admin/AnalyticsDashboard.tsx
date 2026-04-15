import { useState, useEffect, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
} from 'recharts'
import {
  format,
  isBefore,
  startOfMonth,
  endOfMonth,
  subMonths,
  isSameMonth,
  parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FolderKanban, AlertTriangle, DollarSign, Activity } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export default function AnalyticsDashboard() {
  const [projects, setProjects] = useState<any[]>([])
  const [financials, setFinancials] = useState<any[]>([])

  const load = async () => {
    try {
      const [p, f] = await Promise.all([
        pb.collection('projects').getFullList(),
        pb.collection('financial_records').getFullList(),
      ])
      setProjects(p)
      setFinancials(f)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [])
  useRealtime('projects', load)
  useRealtime('financial_records', load)

  const activeProj = projects.filter((p) => !['Concluído', 'Cancelado'].includes(p.status))
  const delayedProj = activeProj.filter(
    (p) => p.end_date && isBefore(parseISO(p.end_date), new Date()) && (p.progress || 0) < 100,
  )

  const currMonthStart = startOfMonth(new Date())
  const currMonthEnd = endOfMonth(new Date())
  const currMonthRev = financials.reduce((sum, r) => {
    const d = parseISO(r.date || r.created)
    if (
      d >= currMonthStart &&
      d <= currMonthEnd &&
      r.amount > 0 &&
      !r.type?.toLowerCase().includes('saída')
    ) {
      return sum + r.amount
    }
    return sum
  }, 0)

  const avgProgress = activeProj.length
    ? activeProj.reduce((acc, p) => acc + (p.progress || 0), 0) / activeProj.length
    : 0

  const cashFlow = useMemo(
    () =>
      Array.from({ length: 6 })
        .map((_, i) => {
          const t = subMonths(new Date(), 5 - i)
          let inC = 0,
            outC = 0
          financials.forEach((r) => {
            const d = parseISO(r.date || r.created)
            if (isSameMonth(d, t)) {
              if (
                r.amount < 0 ||
                r.type?.toLowerCase().includes('saída') ||
                r.type?.toLowerCase().includes('despesa')
              )
                outC += Math.abs(r.amount)
              else inC += r.amount
            }
          })
          return { name: format(t, 'MMM', { locale: ptBR }), Receitas: inC, Despesas: outC }
        })
        .reverse(),
    [financials],
  )

  const projStatus = useMemo(() => {
    const counts = projects.reduce((acc, p) => {
      acc[p.status || 'Outro'] = (acc[p.status || 'Outro'] || 0) + 1
      return acc
    }, {} as any)
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [projects])

  const payStatus = useMemo(() => {
    const counts = financials.reduce((acc, r) => {
      acc[r.status || 'Pendente'] = (acc[r.status || 'Pendente'] || 0) + 1
      return acc
    }, {} as any)
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [financials])

  const profitability = activeProj
    .slice(0, 10)
    .map((p) => ({ name: p.name.substring(0, 15), Orçamento: p.budget || 0, Gasto: p.spent || 0 }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Visão Geral da Carteira</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Projetos Ativos</p>
                <p className="text-2xl font-bold">{activeProj.length}</p>
              </div>
              <FolderKanban className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Projetos em Atraso</p>
                <p className="text-2xl font-bold text-destructive">{delayedProj.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Receita do Mês</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    currMonthRev,
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Progresso Médio</p>
                <p className="text-2xl font-bold text-blue-600">{avgProgress.toFixed(1)}%</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Fluxo de Caixa (6 Meses)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer
              config={{
                Receitas: { color: 'hsl(var(--chart-2))' },
                Despesas: { color: 'hsl(var(--chart-1))' },
              }}
              className="w-full h-full"
            >
              <AreaChart data={cashFlow} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis width={80} tickFormatter={(v) => `R$ ${v / 1000}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="Receitas"
                  stackId="1"
                  stroke="var(--color-Receitas)"
                  fill="var(--color-Receitas)"
                />
                <Area
                  type="monotone"
                  dataKey="Despesas"
                  stackId="2"
                  stroke="var(--color-Despesas)"
                  fill="var(--color-Despesas)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status dos Projetos</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={{}} className="w-full h-full">
              <PieChart>
                <Pie
                  data={projStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {projStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Orçamento vs Gasto (Ativos)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer
              config={{
                Orçamento: { color: 'hsl(var(--chart-3))' },
                Gasto: { color: 'hsl(var(--chart-4))' },
              }}
              className="w-full h-full"
            >
              <BarChart data={profitability} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis width={80} tickFormatter={(v) => `R$ ${v / 1000}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="Orçamento" fill="var(--color-Orçamento)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gasto" fill="var(--color-Gasto)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={{}} className="w-full h-full">
              <PieChart>
                <Pie
                  data={payStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                >
                  {payStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projetos em Atraso</CardTitle>
          <CardDescription>
            Projetos cuja data de término já passou e não estão 100% concluídos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data Fim</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {delayedProj.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum projeto em atraso.
                  </TableCell>
                </TableRow>
              ) : (
                delayedProj.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.client}</TableCell>
                    <TableCell className="text-destructive font-medium">
                      {p.end_date ? format(parseISO(p.end_date), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell>{p.progress || 0}%</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{p.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
