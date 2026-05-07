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
  subDays,
  isAfter,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Download,
  FileText,
  Banknote,
  FilterX,
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
  Line,
  LineChart,
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<string>('monthly')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [comparisonSelectedProjects, setComparisonSelectedProjects] = useState<string[]>([])

  const [advSelectedProject, setAdvSelectedProject] = useState<string>('all')
  const [advSelectedMonth, setAdvSelectedMonth] = useState<string>('all')
  const [advSelectedYear, setAdvSelectedYear] = useState<string>('all')
  const [advSelectedType, setAdvSelectedType] = useState<string>('all')
  const [advPeriodFilter, setAdvPeriodFilter] = useState<string>('all')

  const months = useMemo(
    () => [
      { value: '01', label: 'Janeiro' },
      { value: '02', label: 'Fevereiro' },
      { value: '03', label: 'Março' },
      { value: '04', label: 'Abril' },
      { value: '05', label: 'Maio' },
      { value: '06', label: 'Junho' },
      { value: '07', label: 'Julho' },
      { value: '08', label: 'Agosto' },
      { value: '09', label: 'Setembro' },
      { value: '10', label: 'Outubro' },
      { value: '11', label: 'Novembro' },
      { value: '12', label: 'Dezembro' },
    ],
    [],
  )

  const toggleComparisonProject = (id: string) => {
    setComparisonSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id],
    )
  }

  const filteredFinancials = useMemo(() => {
    const now = new Date()
    return financials.filter((f) => {
      if (projectFilter !== 'all' && f.project_id !== projectFilter) return false

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
  }, [financials, period, projectFilter])

  const advAvailableYears = useMemo(() => {
    const years = new Set<string>()
    years.add(new Date().getFullYear().toString())
    financials.forEach((f) => {
      const d = new Date(f.date || f.created)
      if (!isNaN(d.getTime())) {
        years.add(d.getUTCFullYear().toString())
      }
    })
    return Array.from(years).sort().reverse()
  }, [financials])

  const advFilteredFinancials = useMemo(() => {
    const now = new Date()
    let limitDate: Date | null = null
    if (advPeriodFilter === '7d') limitDate = subDays(now, 7)
    else if (advPeriodFilter === '30d') limitDate = subDays(now, 30)
    else if (advPeriodFilter === 'quarter') limitDate = subDays(now, 90)
    else if (advPeriodFilter === 'year') limitDate = new Date(now.getFullYear(), 0, 1)

    return financials.filter((f) => {
      const d = new Date(f.date || f.created)
      if (isNaN(d.getTime())) return false

      const fYear = d.getUTCFullYear().toString()
      const fMonth = (d.getUTCMonth() + 1).toString().padStart(2, '0')

      const isExpense =
        f.type?.toLowerCase().includes('saída') ||
        f.type?.toLowerCase().includes('despesa') ||
        f.amount < 0
      const type = isExpense ? 'Saída' : 'Entrada'

      if (advSelectedProject !== 'all' && f.project_id !== advSelectedProject) return false
      if (advSelectedMonth !== 'all' && fMonth !== advSelectedMonth) return false
      if (advSelectedYear !== 'all' && fYear !== advSelectedYear) return false
      if (advSelectedType !== 'all' && type !== advSelectedType) return false

      if (limitDate) {
        if (!isAfter(d, limitDate)) return false
      }

      return true
    })
  }, [
    financials,
    advSelectedProject,
    advSelectedMonth,
    advSelectedYear,
    advSelectedType,
    advPeriodFilter,
  ])

  const comparisonData = useMemo(() => {
    return comparisonSelectedProjects.map((projectId) => {
      const p = projects.find((proj) => proj.id === projectId)
      let actualSpent = 0
      let actualRevenue = 0

      advFilteredFinancials.forEach((f) => {
        if (f.project_id === projectId) {
          const isExpense =
            f.type?.toLowerCase().includes('saída') ||
            f.type?.toLowerCase().includes('despesa') ||
            f.amount < 0
          if (isExpense) {
            actualSpent += Math.abs(f.amount)
          } else {
            actualRevenue += f.amount
          }
        }
      })

      return {
        id: projectId,
        name: p?.name || 'Desconhecido',
        Orçamento: p?.budget || 0,
        Custo: actualSpent,
        Receita: actualRevenue,
      }
    })
  }, [comparisonSelectedProjects, projects, advFilteredFinancials])

  const loadData = async () => {
    try {
      const [fins, projs, dists, cats] = await Promise.all([
        pb.collection('financial_records').getFullList({ sort: 'date' }),
        pb.collection('projects').getFullList(),
        pb.collection('distribution_calculations').getFullList(),
        pb.collection('financial_categories').getFullList(),
      ])
      setFinancials(fins)
      setProjects(projs)
      setDistributions(dists)
      setCategories(cats)
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
  useRealtime('financial_categories', () => loadData())

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
    const cats: Record<string, { value: number; color: string }> = {}
    advFilteredFinancials.forEach((f) => {
      const isExpense =
        f.type?.toLowerCase().includes('saída') ||
        f.type?.toLowerCase().includes('despesa') ||
        f.amount < 0
      if (isExpense) {
        const catName = f.category || 'Outros'
        if (!cats[catName]) {
          const dbCat = categories.find((c) => c.name === catName)
          cats[catName] = { value: 0, color: dbCat?.color || '' }
        }
        cats[catName].value += Math.abs(f.amount)
      }
    })
    return Object.entries(cats)
      .map(([name, data]) => ({ name, value: data.value, fill: data.color }))
      .sort((a, b) => b.value - a.value)
  }, [advFilteredFinancials, categories])

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
      .filter((p) => projectFilter === 'all' || p.id === projectFilter)
      .map((p) => ({
        id: p.id,
        name: p.name,
        budget: p.budget,
        spent: p.spent || 0,
        progress: p.progress || 0,
      }))
      .sort((a, b) => b.budget - a.budget)
  }, [projects, projectFilter])

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

  const projectPerformance = useMemo(() => {
    const perf: Record<
      string,
      { id: string; name: string; income: number; expense: number; profit: number }
    > = {}

    projects.forEach((p) => {
      perf[p.id] = { id: p.id, name: p.name, income: 0, expense: 0, profit: 0 }
    })

    advFilteredFinancials.forEach((f) => {
      if (f.project_id && perf[f.project_id]) {
        const isExpense =
          f.type?.toLowerCase().includes('saída') ||
          f.type?.toLowerCase().includes('despesa') ||
          f.amount < 0
        const absAmount = Math.abs(f.amount)
        if (isExpense) {
          perf[f.project_id].expense += absAmount
        } else {
          perf[f.project_id].income += absAmount
        }
      }
    })

    return Object.values(perf)
      .map((p) => ({ ...p, profit: p.income - p.expense }))
      .filter((p) => p.income > 0 || p.expense > 0 || p.profit !== 0)
      .sort((a, b) => b.profit - a.profit)
  }, [advFilteredFinancials, projects])

  const expenseEvolution = useMemo(() => {
    const grouped: Record<string, { date: string; label: string; amount: number }> = {}

    advFilteredFinancials.forEach((f) => {
      const isExpense =
        f.type?.toLowerCase().includes('saída') ||
        f.type?.toLowerCase().includes('despesa') ||
        f.amount < 0

      if (isExpense) {
        const date = new Date(f.date || f.created)
        let key = ''
        let label = ''

        if (advPeriodFilter === '7d' || advPeriodFilter === '30d') {
          key = format(date, 'yyyy-MM-dd')
          label = format(date, 'dd/MM')
        } else {
          key = format(date, 'yyyy-MM')
          label = format(date, 'MMM yy', { locale: ptBR })
        }

        if (!grouped[key]) {
          grouped[key] = { date: key, label, amount: 0 }
        }
        grouped[key].amount += Math.abs(f.amount)
      }
    })

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
  }, [advFilteredFinancials, advPeriodFilter])

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

  const clearAdvFilters = () => {
    setAdvSelectedProject('all')
    setAdvSelectedMonth('all')
    setAdvSelectedYear('all')
    setAdvSelectedType('all')
    setAdvPeriodFilter('all')
  }

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
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-fade-in bg-slate-50 dark:bg-transparent min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h2>
          <p className="text-muted-foreground mt-1">
            Visão detalhada da saúde financeira, custos de projetos e receitas.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
          <div className="w-full sm:w-40">
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
          <div className="w-full sm:w-48">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Todos os Projetos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Projetos</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <Button
              variant="outline"
              onClick={() => exportFinancialCSV(filteredFinancials, period)}
              className="flex-1 sm:flex-none bg-background shadow-sm"
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
              className="flex-1 sm:flex-none bg-background shadow-sm"
            >
              <FileText className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full space-y-6">
        <TabsList className="bg-slate-200/50 dark:bg-muted p-1 inline-flex h-10 items-center justify-center rounded-md text-muted-foreground w-full md:w-auto overflow-x-auto whitespace-nowrap shadow-inner border border-slate-300 dark:border-border">
          <TabsTrigger value="overview" className="py-2 px-4 flex-1 md:flex-none">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="detailed" className="py-2 px-4 flex-1 md:flex-none">
            Análise Avançada
          </TabsTrigger>
          <TabsTrigger value="reports" className="py-2 px-4 flex-1 md:flex-none">
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 outline-none focus:outline-none m-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-md border-primary/40 dark:border-border bg-white dark:bg-card">
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
            <Card className="shadow-md border-primary/40 dark:border-border bg-white dark:bg-card">
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
            <Card className="shadow-md border-primary/40 dark:border-border bg-white dark:bg-card">
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
            <Card className="shadow-md border-primary/40 dark:border-border bg-white dark:bg-card">
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
            <Card className="shadow-md border-primary/40 dark:border-border bg-white dark:bg-card">
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

            <Card className="shadow-md border-primary/40 dark:border-border bg-white dark:bg-card">
              <CardHeader>
                <CardTitle>Atualização de Progresso</CardTitle>
                <CardDescription>
                  Acompanhe e atualize o progresso dos projetos ativos.
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
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6 outline-none focus:outline-none m-0">
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap bg-slate-100/80 dark:bg-slate-900/50 p-4 rounded-lg border border-primary/30 dark:border-slate-800 shadow-sm">
            <Select value={advSelectedProject} onValueChange={setAdvSelectedProject}>
              <SelectTrigger className="w-full sm:w-[220px] bg-white dark:bg-slate-950">
                <SelectValue placeholder="Filtrar por Projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Projetos</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={advSelectedMonth} onValueChange={setAdvSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-slate-950">
                <SelectValue placeholder="Filtrar por Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Meses</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={advSelectedYear} onValueChange={setAdvSelectedYear}>
              <SelectTrigger className="w-full sm:w-[160px] bg-white dark:bg-slate-950">
                <SelectValue placeholder="Filtrar por Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Anos</SelectItem>
                {advAvailableYears.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={advSelectedType} onValueChange={setAdvSelectedType}>
              <SelectTrigger className="w-full sm:w-[160px] bg-white dark:bg-slate-950">
                <SelectValue placeholder="Filtrar por Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="Entrada">Entrada</SelectItem>
                <SelectItem value="Saída">Saída</SelectItem>
              </SelectContent>
            </Select>

            <Select value={advPeriodFilter} onValueChange={setAdvPeriodFilter}>
              <SelectTrigger className="w-full sm:w-[160px] bg-white dark:bg-slate-950">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo Período</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="quarter">Trimestral</SelectItem>
                <SelectItem value="year">Anual</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={clearAdvFilters}
              className="w-full sm:w-auto ml-auto bg-white dark:bg-slate-950"
              disabled={
                advSelectedProject === 'all' &&
                advSelectedMonth === 'all' &&
                advSelectedYear === 'all' &&
                advSelectedType === 'all' &&
                advPeriodFilter === 'all'
              }
            >
              <FilterX className="h-4 w-4 mr-2" /> Limpar
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-md border-primary/40 dark:border-border bg-white dark:bg-card">
              <CardHeader>
                <CardTitle>Evolução de Despesas</CardTitle>
                <CardDescription>Tendência de gastos no período selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                {expenseEvolution.length === 0 ? (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    Nenhum dado disponível.
                  </div>
                ) : (
                  <ChartContainer
                    config={{ amount: { label: 'Despesas', color: 'hsl(var(--destructive))' } }}
                    className="h-[300px] w-full"
                  >
                    <LineChart
                      data={expenseEvolution}
                      margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
                      <YAxis
                        tickFormatter={(v) => `R$ ${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="var(--color-amount)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md border-primary/40 dark:border-border bg-white dark:bg-card">
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
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.fill || COLORS[index % COLORS.length]}
                            />
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

          <Card className="shadow-md border-primary/40 dark:border-border bg-white dark:bg-card">
            <CardHeader>
              <CardTitle>Performance de Projetos</CardTitle>
              <CardDescription>Receitas, despesas e lucro por projeto</CardDescription>
            </CardHeader>
            <CardContent>
              {projectPerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum projeto com movimentação financeira no período.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Projeto</th>
                        <th className="px-4 py-3 font-medium text-right">Entradas</th>
                        <th className="px-4 py-3 font-medium text-right">Saídas</th>
                        <th className="px-4 py-3 font-medium text-right">Lucro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {projectPerformance.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 font-medium">{p.name}</td>
                          <td className="px-4 py-3 text-right text-emerald-600">
                            {formatCurrency(p.income)}
                          </td>
                          <td className="px-4 py-3 text-right text-rose-600">
                            {formatCurrency(p.expense)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-bold ${
                              p.profit >= 0 ? 'text-primary' : 'text-destructive'
                            }`}
                          >
                            {formatCurrency(p.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-primary/40 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/50 backdrop-blur-md text-foreground dark:text-zinc-100 shadow-xl">
            <CardHeader>
              <CardTitle>Comparação de Projetos</CardTitle>
              <CardDescription className="text-slate-500 dark:text-zinc-400">
                Selecione múltiplos projetos para comparar Orçamento vs Custo e Receita.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6 p-4 bg-slate-50 dark:bg-zinc-800/30 rounded-lg border border-primary/20 dark:border-zinc-700/50">
                {projects
                  .filter((p) => p.status !== 'Concluído')
                  .map((p) => (
                    <div key={p.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`comp-${p.id}`}
                        checked={comparisonSelectedProjects.includes(p.id)}
                        onCheckedChange={() => toggleComparisonProject(p.id)}
                      />
                      <Label
                        htmlFor={`comp-${p.id}`}
                        className="cursor-pointer font-medium text-foreground dark:text-zinc-200"
                      >
                        {p.name}
                      </Label>
                    </div>
                  ))}
              </div>

              {comparisonSelectedProjects.length > 0 ? (
                <ChartContainer
                  config={{
                    Orçamento: { label: 'Orçamento', color: 'hsl(var(--chart-1))' },
                    Receita: { label: 'Receita', color: 'hsl(var(--chart-2))' },
                    Custo: { label: 'Custo', color: 'hsl(var(--destructive))' },
                  }}
                  className="h-[350px] w-full"
                >
                  <BarChart
                    data={comparisonData}
                    margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#52525b" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#a1a1aa" />
                    <YAxis
                      tickFormatter={(val) =>
                        `R$${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`
                      }
                      tickLine={false}
                      axisLine={false}
                      stroke="#a1a1aa"
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="Orçamento" fill="var(--color-Orçamento)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Receita" fill="var(--color-Receita)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Custo" fill="var(--color-Custo)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-sm text-slate-500 dark:text-zinc-400 border border-dashed border-primary/40 dark:border-zinc-700 rounded-md bg-slate-50 dark:bg-zinc-800/20">
                  Selecione um ou mais projetos acima para visualizar a comparação.
                </div>
              )}
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
