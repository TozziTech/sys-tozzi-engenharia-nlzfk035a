import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import {
  Bar,
  BarChart,
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

export default function FinancialDashboard() {
  const [financials, setFinancials] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [fins, projs] = await Promise.all([
        pb.collection('financial_records').getFullList({ sort: 'date' }),
        pb.collection('projects').getFullList(),
      ])
      setFinancials(fins)
      setProjects(projs)
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

  const { totalRevenue, totalExpenses, balance } = useMemo(() => {
    let rev = 0
    let exp = 0
    financials.forEach((f) => {
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
  }, [financials])

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {}
    financials.forEach((f) => {
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
  }, [financials])

  const cashFlowData = useMemo(() => {
    const monthly: Record<string, { month: string; receita: number; despesa: number }> = {}
    financials.forEach((f) => {
      const date = new Date(f.date || f.created)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' })
      if (!monthly[monthKey]) {
        monthly[monthKey] = { month: monthLabel, receita: 0, despesa: 0 }
      }
      const isExpense =
        f.type?.toLowerCase().includes('saída') ||
        f.type?.toLowerCase().includes('despesa') ||
        f.amount < 0
      if (isExpense) {
        monthly[monthKey].despesa += Math.abs(f.amount)
      } else {
        monthly[monthKey].receita += f.amount
      }
    })
    return Object.keys(monthly)
      .sort()
      .map((k) => monthly[k])
      .slice(-12)
  }, [financials])

  const activeProjectsFinancials = useMemo(() => {
    return projects
      .filter((p) => p.status !== 'Concluído' && p.budget > 0)
      .map((p) => ({
        name: p.name,
        budget: p.budget,
        spent: p.spent || 0,
      }))
      .sort((a, b) => b.budget - a.budget)
  }, [projects])

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

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h2>
        <p className="text-muted-foreground mt-1">
          Visão detalhada da saúde financeira, custos de projetos e receitas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
                <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis
                    tickFormatter={(v) => `R$ ${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="receita"
                    fill="var(--color-receita)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                  <Bar
                    dataKey="despesa"
                    fill="var(--color-despesa)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
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
                <Bar dataKey="spent" fill="var(--color-spent)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
