import { useState } from 'react'
import { subDays, isAfter } from 'date-fns'
import useProjectStore from '@/stores/useProjectStore'
import { useAuth } from '@/hooks/use-auth'
import { useFinancialCategories } from '@/hooks/use-financial-categories'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingDown, TrendingUp, Download } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

const formatCurrency = (value?: number) => {
  if (value === undefined) return 'N/A'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function ProjectFinanceTab({ project }: { project: any }) {
  const { transactions, updateTransaction } = useProjectStore()
  const { categories } = useFinancialCategories()
  const { effectiveRole } = useAuth()

  const canViewFinance =
    effectiveRole === 'Administrador' ||
    effectiveRole === 'Gerente de Projeto' ||
    effectiveRole === 'Cliente'

  if (!canViewFinance) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20">
        <h3 className="text-lg font-medium">Acesso Restrito</h3>
        <p className="text-muted-foreground mt-2">
          Você não tem permissão para visualizar dados financeiros deste projeto.
        </p>
      </div>
    )
  }
  const [periodFilter, setPeriodFilter] = useState<string>('all')
  const [draggedTx, setDraggedTx] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const now = new Date()
  let limitDate: Date | null = null
  if (periodFilter === '30d') limitDate = subDays(now, 30)
  else if (periodFilter === 'quarter') limitDate = subDays(now, 90)
  else if (periodFilter === 'year') limitDate = new Date(now.getFullYear(), 0, 1)

  const storeTransactions = transactions.filter((t) => t.projectId === project.id)
  const mockTransactions =
    storeTransactions.length === 0
      ? [
          {
            id: 'm1',
            projectId: project.id,
            description: 'Initial Payment',
            type: 'Entrada' as const,
            value: 5000,
            date: new Date().toISOString(),
          },
          {
            id: 'm2',
            projectId: project.id,
            description: 'Material Purchase',
            type: 'Saída' as const,
            value: 1200,
            date: new Date().toISOString(),
          },
          {
            id: 'm3',
            projectId: project.id,
            description: 'Consultant Fee',
            type: 'Saída' as const,
            value: 800,
            date: new Date().toISOString(),
          },
          {
            id: 'm4',
            projectId: project.id,
            description: 'Milestone 1',
            type: 'Entrada' as const,
            value: 3000,
            date: new Date().toISOString(),
          },
          {
            id: 'm5',
            projectId: project.id,
            description: 'Software Licenses',
            type: 'Saída' as const,
            value: 500,
            date: new Date().toISOString(),
          },
        ]
      : []

  const projectTransactions = [...storeTransactions, ...mockTransactions].filter((t) => {
    if (limitDate) {
      const txDate = new Date(t.date)
      if (!isAfter(txDate, limitDate)) return false
    }
    return true
  })

  const totalIn = projectTransactions
    .filter((t) => t.type === 'Entrada')
    .reduce((acc, curr) => acc + curr.value, 0)
  const totalOut = projectTransactions
    .filter((t) => t.type === 'Saída')
    .reduce((acc, curr) => acc + curr.value, 0)
  const profit = totalIn - totalOut

  const expensesByMonth = (() => {
    const data: Record<string, number> = {}
    projectTransactions.forEach((tx) => {
      if (tx.type === 'Saída') {
        const month = tx.date.substring(0, 7)
        data[month] = (data[month] || 0) + tx.value
      }
    })
    return Object.entries(data)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, value]) => ({ month, value }))
  })()

  const expensesByCategory = (() => {
    const data: Record<string, number> = {}
    projectTransactions.forEach((tx) => {
      if (tx.type === 'Saída' && tx.categoryId) {
        data[tx.categoryId] = (data[tx.categoryId] || 0) + tx.value
      }
    })
    return Object.entries(data).map(([id, value]) => {
      const cat = categories.find((c) => c.id === id)
      return {
        name: cat?.name || 'Outros',
        value,
        fill: cat?.color || 'hsl(var(--muted))',
      }
    })
  })()

  const pieChartConfig = (() => {
    const config: any = { value: { label: 'Valor' } }
    categories.forEach((cat) => {
      config[cat.name] = { label: cat.name, color: cat.color }
    })
    return config
  })()

  const handleExportCSV = () => {
    const headers = ['Data', 'Descrição', 'Tipo', 'Valor']
    const rows = projectTransactions.map((t) => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      `"${t.description.replace(/"/g, '""')}"`,
      t.type,
      t.value,
    ])

    const summary = [
      ['Resumo Financeiro'],
      ['Orçamento Estimado', project.budget || 0],
      ['Custo Real', totalOut],
      ['Lucro Atual', profit],
      [],
      headers,
    ]

    const csvContent = [...summary.map((r) => r.join(',')), ...rows.map((r) => r.join(','))].join(
      '\n',
    )
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Financeiro_${project.name.replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const budgetPct =
    project.budget && project.budget > 0 ? Math.round((totalOut / project.budget) * 100) : 0
  const progressColorClass =
    budgetPct > 90
      ? '[&>div]:bg-red-500 bg-red-100'
      : budgetPct >= 70
        ? '[&>div]:bg-yellow-500 bg-yellow-100'
        : '[&>div]:bg-blue-500 bg-blue-100'

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-[200px] bg-white dark:bg-slate-950">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo Período</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="quarter">Trimestre</SelectItem>
            <SelectItem value="year">Este Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Progresso do Orçamento</CardTitle>
          <CardDescription>Custo Real em relação ao Orçamento Estimado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Orçamento Consumido</span>
            <span className="text-sm font-bold">{budgetPct}%</span>
          </div>
          <Progress value={Math.min(budgetPct, 100)} className={`h-3 ${progressColorClass}`} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Evolução de Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByMonth.length > 0 ? (
              <ChartContainer
                config={{
                  value: { label: 'Despesas', color: 'hsl(var(--chart-1))' },
                }}
                className="h-[200px] w-full"
              >
                <BarChart
                  data={expensesByMonth}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(val) => {
                      const [y, m] = val.split('-')
                      return `${m}/${y}`
                    }}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    tickFormatter={(val) => `R$${val / 1000}k`}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded-md">
                Sem despesas registradas
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length > 0 ? (
              <ChartContainer config={pieChartConfig} className="h-[200px] w-full">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
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
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded-md">
                Sem categorias registradas
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento Estimado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(project.budget || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Real</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOut)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Atual</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
            >
              {formatCurrency(profit)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Histórico de Transações</CardTitle>
            <CardDescription>
              Movimentações financeiras do projeto. Arraste uma transação para as categorias abaixo
              para reatribuir.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório
          </Button>
        </CardHeader>
        <CardContent className="pb-2 border-b mb-4">
          <div
            className={`p-4 rounded-lg border border-dashed transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-800'}`}
          >
            <h4 className="text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">
              Solte aqui para reatribuir Categoria (apenas Saídas)
            </h4>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Badge
                  key={c.id}
                  variant="outline"
                  className="cursor-pointer py-1.5"
                  style={{ borderColor: c.color, color: c.color }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggedTx) {
                      updateTransaction(draggedTx, {
                        categoryId: c.id,
                        type: 'Saída',
                      })
                      setDraggedTx(null)
                      setIsDragging(false)
                    }
                  }}
                >
                  {c.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
        <CardContent>
          {projectTransactions.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectTransactions.map((transaction) => {
                    const cat = categories.find((c) => c.id === transaction.categoryId)
                    return (
                      <TableRow
                        key={transaction.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedTx(transaction.id)
                          setIsDragging(true)
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        onDragEnd={() => {
                          setDraggedTx(null)
                          setIsDragging(false)
                        }}
                        className="cursor-grab active:cursor-grabbing hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                      >
                        <TableCell className="whitespace-nowrap">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          {transaction.type === 'Saída' && cat ? (
                            <Badge
                              variant="outline"
                              style={{ borderColor: cat.color, color: cat.color }}
                            >
                              {cat.name}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={transaction.type === 'Entrada' ? 'default' : 'destructive'}
                            className={
                              transaction.type === 'Entrada'
                                ? 'bg-emerald-500 hover:bg-emerald-600'
                                : ''
                            }
                          >
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium whitespace-nowrap ${
                            transaction.type === 'Entrada' ? 'text-emerald-500' : 'text-red-500'
                          }`}
                        >
                          {transaction.type === 'Entrada' ? '+' : '-'}
                          {formatCurrency(transaction.value)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-md bg-muted/20">
              Nenhuma transação registrada para este projeto.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
