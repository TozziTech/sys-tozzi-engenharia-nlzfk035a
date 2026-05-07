import { useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

interface OverviewProps {
  transactions: any[]
  categories: any[]
}

export function FinancialOverview({ transactions, categories }: OverviewProps) {
  const { totalIncomes, totalExpenses, balance } = useMemo(() => {
    if (!transactions || !Array.isArray(transactions))
      return { totalIncomes: 0, totalExpenses: 0, balance: 0 }
    return transactions.reduce(
      (acc, tx) => {
        const val = tx.value || tx.amount || 0
        if (tx.type === 'Entrada') acc.totalIncomes += val
        else acc.totalExpenses += val
        acc.balance = acc.totalIncomes - acc.totalExpenses
        return acc
      },
      { totalIncomes: 0, totalExpenses: 0, balance: 0 },
    )
  }, [transactions])

  const expensesByCategory = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return []
    const expenses = transactions.filter((t) => t.type === 'Saída')
    const grouped = expenses.reduce(
      (acc, tx) => {
        const cId = tx.categoryId || tx.category
        const cat = categories.find((c) => c.id === cId || c.name === cId)
        const catName = cat?.name || 'Sem categoria'
        const color = cat?.color || 'hsl(var(--muted-foreground))'

        if (!acc[catName]) {
          acc[catName] = { name: catName, value: 0, fill: color }
        }
        acc[catName].value += tx.value || tx.amount || 0
        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(grouped).sort((a: any, b: any) => b.value - a.value)
  }, [transactions, categories])

  const cashFlowByMonth = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return []
    const currentYear = new Date().getFullYear()

    const grouped = transactions.reduce(
      (acc, tx) => {
        if (!tx.date) return acc
        const d = new Date(tx.date)
        if (d.getUTCFullYear() !== currentYear) return acc // Apenas do ano atual

        const monthYear = format(d, 'MMM/yy', { locale: ptBR })
        if (!acc[monthYear]) {
          acc[monthYear] = {
            name: monthYear,
            Entrada: 0,
            Saída: 0,
            sortKey: d.getUTCFullYear() * 100 + d.getUTCMonth(),
          }
        }
        const val = tx.value || tx.amount || 0
        if (tx.type === 'Entrada') acc[monthYear].Entrada += val
        else acc[monthYear].Saída += val
        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(grouped).sort((a: any, b: any) => a.sortKey - b.sortKey)
  }, [transactions])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const pieConfig = useMemo(() => {
    const config: any = {}
    expensesByCategory.forEach((item: any) => {
      config[item.name] = { label: item.name, color: item.fill }
    })
    return config
  }, [expensesByCategory])

  const barConfig = {
    Entrada: { label: 'Entradas', color: '#10b981' },
    Saída: { label: 'Saídas', color: '#f43f5e' },
  }

  const monthlyGoals = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return []
    if (!transactions || !Array.isArray(transactions)) return []

    const currentMonth = new Date().getUTCMonth()
    const currentYear = new Date().getFullYear()

    const expensesThisMonth = transactions.filter((tx) => {
      if (tx.type !== 'Saída' || !tx.date) return false
      const d = new Date(tx.date)
      return d.getUTCMonth() === currentMonth && d.getUTCFullYear() === currentYear
    })

    return categories
      .filter((c) => c.monthly_limit && c.monthly_limit > 0)
      .map((c) => {
        const spent = expensesThisMonth
          .filter(
            (tx) =>
              (tx.categoryId || tx.category) === c.id || (tx.categoryId || tx.category) === c.name,
          )
          .reduce((sum, tx) => sum + (tx.value || tx.amount || 0), 0)

        const limit = c.monthly_limit
        const percentage = (spent / limit) * 100

        return {
          id: c.id,
          name: c.name,
          spent,
          limit,
          percentage,
          color: c.color || 'hsl(var(--primary))',
        }
      })
      .sort((a, b) => b.percentage - a.percentage)
  }, [transactions, categories])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-md border-primary/40 dark:border-border bg-white dark:bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
            >
              {formatCurrency(balance)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md border-primary/40 dark:border-border bg-white dark:bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total de Entradas</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {formatCurrency(totalIncomes)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md border-primary/40 dark:border-border bg-white dark:bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total de Saídas</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-md border-primary/40 dark:border-border bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length > 0 ? (
              <ChartContainer config={pieConfig} className="h-[250px] w-full">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    className="text-foreground fill-foreground"
                  >
                    {expensesByCategory.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent formatter={(val) => formatCurrency(Number(val))} />
                    }
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-500 text-sm">
                Nenhum dado disponível.
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-md border-primary/40 dark:border-border bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Fluxo de Caixa</CardTitle>
          </CardHeader>
          <CardContent>
            {cashFlowByMonth.length > 0 ? (
              <ChartContainer config={barConfig} className="h-[250px] w-full">
                <BarChart data={cashFlowByMonth}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => (val >= 1000 ? `R$ ${val / 1000}k` : `R$ ${val}`)}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent formatter={(val) => formatCurrency(Number(val))} />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="Entrada" fill="var(--color-Entrada)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Saída" fill="var(--color-Saída)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-500 text-sm">
                Nenhum dado disponível.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {monthlyGoals.length > 0 && (
        <Card className="shadow-md border-primary/40 dark:border-border bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="text-base">Metas de Gastos Mensais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {monthlyGoals.map((goal) => {
                let progressColorClass = 'bg-primary'
                if (goal.percentage >= 100) {
                  progressColorClass = 'bg-destructive'
                } else if (goal.percentage >= 80) {
                  progressColorClass = 'bg-amber-500'
                }

                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-medium flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: goal.color }}
                        />
                        {goal.name}
                      </div>
                      <div className="text-muted-foreground font-medium">
                        {formatCurrency(goal.spent)} / {formatCurrency(goal.limit)}
                      </div>
                    </div>
                    <Progress
                      value={Math.min(goal.percentage, 100)}
                      className="h-2"
                      indicatorClassName={progressColorClass}
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
