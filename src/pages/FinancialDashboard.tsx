import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  isWithinInterval,
  format,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Download,
  FileText,
  Banknote,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { exportFinancialCSV } from '@/lib/export'
import { exportFinancialPDF } from '@/lib/exportPdf'
import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import useProjectStore from '@/stores/useProjectStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FinancialReports } from '@/components/financial/FinancialReports'
import { RecurringExpensesChart } from '@/components/financial/RecurringExpensesChart'
import { RecurringExpensesCard } from '@/components/financial/RecurringExpensesCard'
import { usePermissions } from '@/hooks/use-permissions'
import { AccessRestricted } from '@/components/auth/AccessRestricted'

export default function FinancialDashboard() {
  const { updateProject } = useProjectStore()
  const { toast } = useToast()
  const { user } = useAuth()
  const { canAccess } = usePermissions()
  const [financials, setFinancials] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [distributions, setDistributions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<string>('monthly')

  const filteredFinancials = useMemo(() => {
    const now = new Date()
    return financials.filter((f) => {
      if (period === 'all') return true
      const date = new Date(f.date || f.created)
      if (period === 'weekly')
        return isWithinInterval(date, {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        })
      if (period === 'monthly')
        return isWithinInterval(date, { start: startOfMonth(now), end: endOfMonth(now) })
      if (period === 'quarterly')
        return isWithinInterval(date, { start: startOfQuarter(now), end: endOfQuarter(now) })
      return true
    })
  }, [financials, period])

  const loadData = async () => {
    try {
      const [fins, projs, dists] = await Promise.all([
        pb.collection('financial_records').getFullList({ sort: 'date' }),
        pb.collection('projects').getFullList(),
        pb.collection('distribution_calculations').getFullList(),
      ])
      setFinancials(fins)
      setProjects(projs)
      setDistributions(dists)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('financial_records', () => loadData())
  useRealtime('projects', () => loadData())
  useRealtime('distribution_calculations', () => loadData())

  const currentMonthDistributed = useMemo(() => {
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)

    return distributions
      .filter((d) => {
        const date = new Date(d.date || d.created)
        return isWithinInterval(date, { start, end })
      })
      .reduce((sum, d) => sum + (d.total_amount || 0), 0)
  }, [distributions])

  const { totalRevenue, totalExpenses, balance } = useMemo(() => {
    let rev = 0
    let exp = 0
    filteredFinancials.forEach((f) => {
      const isExpense =
        f.type?.toLowerCase().includes('saída') ||
        f.type?.toLowerCase().includes('despesa') ||
        f.amount < 0
      if (isExpense) {
        exp += Math.abs(f.amount)
      } else {
        rev += f.amount
      }
    })
    return { totalRevenue: rev, totalExpenses: exp, balance: rev - exp }
  }, [filteredFinancials])

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {}
    filteredFinancials.forEach((f) => {
      const isExpense =
        f.type?.toLowerCase().includes('saída') ||
        f.type?.toLowerCase().includes('despesa') ||
        f.amount < 0
      if (isExpense) {
        const cat = f.category || 'Outros'
        cats[cat] = (cats[cat] || 0) + Math.abs(f.amount)
      }
    })
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredFinancials])

  const cashFlowData = useMemo(() => {
    const grouped: Record<
      string,
      { sortKey: string; month: string; receita: number; despesa: number }
    > = {}
    filteredFinancials.forEach((f) => {
      const date = new Date(f.date || f.created)
      let key = ''
      let label = ''

      if (period === 'weekly' || period === 'monthly') {
        key = format(date, 'yyyy-MM-dd')
        label = format(date, 'dd/MM')
      } else {
        key = format(date, 'yyyy-MM')
        label = format(date, 'MMM yy', { locale: ptBR })
      }

      if (!grouped[key]) {
        grouped[key] = { sortKey: key, month: label, receita: 0, despesa: 0 }
      }
      const isExpense =
        f.type?.toLowerCase().includes('saída') ||
        f.type?.toLowerCase().includes('despesa') ||
        f.amount < 0
      if (isExpense) {
        grouped[key].despesa += Math.abs(f.amount)
      } else {
        grouped[key].receita += f.amount
      }
    })
    return Object.values(grouped)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-12)
  }, [filteredFinancials, period])

  const activeProjectsFinancials = useMemo(() => {
    return projects
      .filter((p) => p.status !== 'Concluído' && p.budget > 0)
      .map((p) => ({
        id: p.id,
        name: p.name,
        budget: p.budget,
        spent: p.spent || 0,
        progress: p.progress || 0,
      }))
      .sort((a, b) => b.budget - a.budget)
  }, [projects])

  const { totalBudget, totalSpent } = useMemo(() => {
    return activeProjectsFinancials.reduce(
      (acc, p) => {
        acc.totalBudget += p.budget
        acc.totalSpent += p.spent
        return acc
      },
      { totalBudget: 0, totalSpent: 0 },
    )
  }, [activeProjectsFinancials])

  const handleProgressChange = async (id: string, newProgress: string) => {
    const val = parseFloat(newProgress)
    if (isNaN(val) || val < 0 || val > 100) return

    try {
      await updateProject(id, { progress: val })
      toast({
        title: 'Sucesso',
        description: 'Progresso do projeto atualizado.',
      })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar o progresso do projeto.',
        variant: 'destructive',
      })
    }
  }

  const formatCurrency = (v: number) =>
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--primary))',
  ]

  if (!canAccess('dashboard_financeiro') && user?.role !== 'Administrador') {
    return <AccessRestricted />
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-fade-in">
      <Tabs defaultValue="overview" className="w-full space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h2>
            <p className="text-muted-foreground mt-1">
              Visão detalhada da saúde financeira, custos de projetos e receitas.
            </p>
          </div>
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="overview" className="py-2 px-4">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="reports" className="py-2 px-4">
              Relatórios
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6 outline-none focus:outline-none m-0">
          <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-2 w-full">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto">
              <div className="w-full md:w-48">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="all">Todo o Período</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-full md:w-auto gap-2">
                <Button
                  variant="outline"
                  onClick={() => exportFinancialCSV(filteredFinancials, period)}
                  className="flex-1 md:flex-none bg-background shadow-sm"
                >
                  <Download className="mr-2 h-4 w-4" /> CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    exportFinancialPDF(
                      filteredFinancials,
                      { revenue: totalRevenue, expenses: totalExpenses, balance },
                      period,
                      user?.name || user?.email || 'Usuário',
                    )
                  }
                  className="flex-1 md:flex-none bg-background shadow-sm"
                >
                  <FileText className="mr-2 h-4 w-4" /> PDF
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <div className="p-2 bg-emerald-500/10 rounded-full">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {loading ? '-' : formatCurrency(totalRevenue)}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesa Total</CardTitle>
                <div className="p-2 bg-rose-500/10 rounded-full">
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {loading ? '-' : formatCurrency(totalExpenses)}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo em Caixa</CardTitle>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}
                >
                  {loading ? '-' : formatCurrency(balance)}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orçamento vs Gasto</CardTitle>
                <div className="p-2 bg-blue-500/10 rounded-full">
                  <Banknote className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {loading ? '-' : `${formatCurrency(totalSpent)} / ${formatCurrency(totalBudget)}`}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Projetos Ativos</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3 items-stretch">
            <div className="md:col-span-1">
              <RecurringExpensesCard />
            </div>
            <div className="md:col-span-2">
              <RecurringExpensesChart />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Fluxo de Caixa Mensal</CardTitle>
                <CardDescription>Comparativo de receitas e despesas por mês</CardDescription>
              </CardHeader>
              <CardContent>
                {cashFlowData.length === 0 ? (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    Nenhum dado disponível.
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      receita: { label: 'Receita', color: 'hsl(var(--chart-2))' },
                      despesa: { label: 'Despesa', color: 'hsl(var(--destructive))' },
                    }}
                    className="h-[300px] w-full"
                  >
                    <AreaChart
                      data={cashFlowData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="fillReceita" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-receita)" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="var(--color-receita)" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="fillDespesa" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-despesa)" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="var(--color-despesa)" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                      <YAxis
                        tickFormatter={(v) => `R$ ${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="receita"
                        stroke="var(--color-receita)"
                        fillOpacity={1}
                        fill="url(#fillReceita)"
                      />
                      <Area
                        type="monotone"
                        dataKey="despesa"
                        stroke="var(--color-despesa)"
                        fillOpacity={1}
                        fill="url(#fillDespesa)"
                      />
                    </AreaChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
                <CardDescription>Distribuição dos gastos totais</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    Nenhum dado disponível.
                  </div>
                ) : (
                  <div className="h-[300px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid hsl(var(--border))',
                            backgroundColor: 'hsl(var(--background))',
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Financeiro dos Projetos Ativos</CardTitle>
              <CardDescription>Comparativo de Orçamento vs Custo Realizado</CardDescription>
            </CardHeader>
            <CardContent>
              {activeProjectsFinancials.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  Nenhum projeto com orçamento definido.
                </div>
              ) : (
                <ChartContainer
                  config={{
                    budget: { label: 'Orçamento', color: 'hsl(var(--primary))' },
                    spent: { label: 'Custo Realizado', color: 'hsl(var(--destructive))' },
                  }}
                  className="h-[400px] w-full"
                >
                  <BarChart
                    data={activeProjectsFinancials}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 50, bottom: 20 }}
                  >
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => `R$ ${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      width={150}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="budget"
                      fill="var(--color-budget)"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                    <Bar
                      dataKey="spent"
                      fill="var(--color-spent)"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Atualização de Progresso</CardTitle>
              <CardDescription>
                Acompanhe e atualize o progresso dos projetos ativos diretamente do painel
                financeiro.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeProjectsFinancials.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Nenhum projeto ativo disponível.
                  </div>
                ) : (
                  activeProjectsFinancials.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg bg-card"
                    >
                      <div>
                        <h4 className="font-medium text-sm">{p.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Orçamento: {formatCurrency(p.budget)} | Custo: {formatCurrency(p.spent)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium whitespace-nowrap">Progresso:</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            defaultValue={p.progress}
                            onBlur={(e) => {
                              if (e.target.value !== String(p.progress)) {
                                handleProgressChange(p.id, e.target.value)
                              }
                            }}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="outline-none focus:outline-none m-0">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  )
}
