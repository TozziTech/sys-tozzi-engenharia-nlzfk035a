import { useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {formatCurrency(balance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalIncomes)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
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
        <Card>
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
    </div>
  )
}
