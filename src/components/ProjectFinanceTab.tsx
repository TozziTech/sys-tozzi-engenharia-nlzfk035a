import { useState, useEffect, useCallback } from 'react'
import { subDays, isAfter } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { useFinancialCategories } from '@/hooks/use-financial-categories'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'
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
import { DollarSign, TrendingDown, TrendingUp, Download, Loader2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { useToast } from '@/hooks/use-toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const formatCurrency = (value?: number) => {
  if (value === undefined) return 'N/A'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function ProjectFinanceTab({ project }: { project: any }) {
  const { categories } = useFinancialCategories()
  const { user } = useAuth()
  const effectiveRole = user?.role
  const { can, canAccess } = usePermissions()

  const [periodFilter, setPeriodFilter] = useState<string>('all')
  const [draggedTx, setDraggedTx] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const canViewFinance =
    effectiveRole === 'Administrador' ||
    effectiveRole === 'Cliente' ||
    (canAccess && canAccess('financeiro') && can && can('view', 'financeiro'))

  const loadRecords = useCallback(async () => {
    if (!project?.id) return
    setLoading(true)
    try {
      let filterStr = `project_id = "${project.id}"`
      const now = new Date()

      const getPBDateString = (d: Date) => {
        const pad = (n: number) => n.toString().padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 00:00:00.000Z`
      }

      if (periodFilter === '30d') {
        filterStr += ` && date >= "${getPBDateString(subDays(now, 30))}"`
      } else if (periodFilter === 'month') {
        filterStr += ` && date >= "${getPBDateString(new Date(now.getFullYear(), now.getMonth(), 1))}"`
      } else if (periodFilter === 'year') {
        filterStr += ` && date >= "${getPBDateString(new Date(now.getFullYear(), 0, 1))}"`
      }

      const data = await pb.collection('financial_records').getFullList({
        filter: filterStr,
        sort: '-date',
        expand: 'responsible',
      })

      let mappedData = data.map((d) => ({
        id: d.id,
        projectId: d.project_id,
        description: d.description,
        type: d.type,
        value: d.amount,
        categoryId: d.category,
        date: d.date,
        status: d.status || 'Pago',
        responsible: d.expand?.responsible?.name || '-',
      }))

      if (mappedData.length === 0) {
        const totalCount = await pb.collection('financial_records').getList(1, 1, {
          filter: `project_id = "${project.id}"`,
        })
        if (totalCount.totalItems === 0) {
          const mocks = [
            {
              id: 'm1',
              projectId: project.id,
              description: 'Initial Payment',
              type: 'Entrada',
              value: 5000,
              categoryId: '',
              date: now.toISOString(),
              status: 'Pago',
              responsible: '-',
            },
            {
              id: 'm2',
              projectId: project.id,
              description: 'Material Purchase',
              type: 'Saída',
              value: 1200,
              categoryId: '',
              date: now.toISOString(),
              status: 'Pago',
              responsible: '-',
            },
            {
              id: 'm3',
              projectId: project.id,
              description: 'Consultant Fee',
              type: 'Saída',
              value: 800,
              categoryId: '',
              date: subDays(now, 15).toISOString(),
              status: 'Pago',
              responsible: '-',
            },
            {
              id: 'm4',
              projectId: project.id,
              description: 'Milestone 1',
              type: 'Entrada',
              value: 3000,
              categoryId: '',
              date: subDays(now, 40).toISOString(),
              status: 'Pago',
              responsible: '-',
            },
            {
              id: 'm5',
              projectId: project.id,
              description: 'Software Licenses',
              type: 'Saída',
              value: 500,
              categoryId: '',
              date: subDays(now, 100).toISOString(),
              status: 'Pago',
              responsible: '-',
            },
          ]
          mappedData = mocks.filter((m) => {
            if (periodFilter === 'all') return true
            const mDate = new Date(m.date)
            if (periodFilter === '30d') return isAfter(mDate, subDays(now, 30))
            if (periodFilter === 'month')
              return isAfter(mDate, new Date(now.getFullYear(), now.getMonth(), 1))
            if (periodFilter === 'year') return isAfter(mDate, new Date(now.getFullYear(), 0, 1))
            return true
          })
        }
      }

      setRecords(mappedData)
    } catch (err) {
      console.error('Error fetching financial records:', err)
    } finally {
      setLoading(false)
    }
  }, [project?.id, periodFilter])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  useRealtime('financial_records', () => {
    loadRecords()
  })

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

  const totalIn = records
    .filter((t) => t.type === 'Entrada')
    .reduce((acc, curr) => acc + curr.value, 0)
  const totalOut = records
    .filter((t) => t.type === 'Saída')
    .reduce((acc, curr) => acc + curr.value, 0)
  const approvedOut = records
    .filter((t) => t.type === 'Saída' && t.isApproved)
    .reduce((acc, curr) => acc + curr.value, 0)
  const pendingOut = totalOut - approvedOut
  const profit = totalIn - approvedOut

  const expensesByMonth = (() => {
    const data: Record<string, number> = {}
    records.forEach((tx) => {
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
    records.forEach((tx) => {
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
    if (records.length === 0) {
      toast({
        title: 'Nenhum dado',
        description: 'Não há registros financeiros para o período selecionado.',
        variant: 'destructive',
      })
      return
    }

    const headers = ['Descrição', 'Valor', 'Tipo', 'Categoria', 'Data', 'Status', 'Responsável']
    const rows = records.map((t) => {
      const cat = categories.find((c) => c.id === t.categoryId)
      return [
        `"${t.description.replace(/"/g, '""')}"`,
        (t.value || 0).toString().replace('.', ','),
        `"${t.type || ''}"`,
        `"${(cat?.name || t.categoryId || '-').replace(/"/g, '""')}"`,
        new Date(t.date).toLocaleDateString('pt-BR'),
        `"${t.status || ''}"`,
        `"${(t.responsible || '-').replace(/"/g, '""')}"`,
      ]
    })

    const summary = [
      ['Resumo Financeiro'],
      ['Orçamento Estimado', project.budget || 0],
      ['Custo Real', totalOut],
      ['Lucro Atual', profit],
      [],
      headers,
    ]

    const csvContent = [...summary.map((r) => r.join(';')), ...rows.map((r) => r.join(';'))].join(
      '\n',
    )
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')

    const today = new Date().toISOString().split('T')[0]
    a.download = `financeiro-${project.name.replace(/\s+/g, '-').toLowerCase()}-${today}.csv`

    a.href = url
    a.click()
    URL.revokeObjectURL(url)
  }

  const budgetPct =
    project.budget && project.budget > 0 ? Math.round((approvedOut / project.budget) * 100) : 0
  const progressColorClass =
    budgetPct > 100
      ? '[&>div]:bg-red-500 bg-red-100'
      : budgetPct >= 80
        ? '[&>div]:bg-amber-500 bg-amber-100'
        : '[&>div]:bg-emerald-500 bg-emerald-100'

  const handleApprove = async (id: string) => {
    try {
      await pb.collection('financial_records').update(id, {
        is_approved: true,
        approved_by: pb.authStore.record?.id,
      })
      toast({ title: 'Despesa aprovada com sucesso!' })
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao aprovar', variant: 'destructive' })
    }
  }

  return (
    <ErrorBoundary>
      <div
        className={cn(
          'space-y-6 transition-opacity duration-200',
          loading ? 'opacity-60 pointer-events-none' : 'opacity-100',
        )}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[200px] bg-white dark:bg-slate-950">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tudo</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="month">Mensal</SelectItem>
              <SelectItem value="year">Anual</SelectItem>
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
                  Nenhum dado disponível para este período
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
                  Nenhum dado disponível para este período
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
              <CardTitle className="text-sm font-medium">Custo Aprovado</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(approvedOut)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                + {formatCurrency(pendingOut)} aguardando
              </p>
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
                Movimentações financeiras do projeto. Arraste uma transação para as categorias
                abaixo para reatribuir.
              </CardDescription>
            </div>
            {(effectiveRole === 'Administrador' || effectiveRole === 'Gerente de Projeto') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={records.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar para CSV
              </Button>
            )}
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
                    onDrop={async (e) => {
                      e.preventDefault()
                      if (draggedTx) {
                        if (draggedTx.startsWith('m')) {
                          setRecords((prev) =>
                            prev.map((r) =>
                              r.id === draggedTx ? { ...r, categoryId: c.id, type: 'Saída' } : r,
                            ),
                          )
                        } else {
                          try {
                            await pb.collection('financial_records').update(draggedTx, {
                              category: c.id,
                              type: 'Saída',
                            })
                          } catch (err) {
                            console.error(err)
                          }
                        }
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
            {records.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aprovação</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((transaction) => {
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
                            {transaction.type === 'Saída' ? (
                              cat ? (
                                <Badge
                                  variant="outline"
                                  style={{ borderColor: cat.color, color: cat.color }}
                                >
                                  {cat.name}
                                </Badge>
                              ) : transaction.categoryId ? (
                                <Badge variant="outline">{transaction.categoryId}</Badge>
                              ) : (
                                '-'
                              )
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
                          <TableCell>
                            {transaction.status === 'Pago' && (
                              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent">
                                Pago
                              </Badge>
                            )}
                            {transaction.status === 'Pendente' && (
                              <Badge
                                variant="outline"
                                className="text-amber-600 border-amber-500 dark:text-amber-400"
                              >
                                Pendente
                              </Badge>
                            )}
                            {transaction.status === 'Atrasado' && (
                              <Badge variant="destructive">Atrasado</Badge>
                            )}
                            {transaction.status === 'Cancelado' && (
                              <Badge
                                variant="secondary"
                                className="dark:bg-zinc-800 dark:text-zinc-300"
                              >
                                Cancelado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {transaction.type === 'Saída' ? (
                              transaction.isApproved ? (
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                                >
                                  Aprovado
                                </Badge>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                                  >
                                    Pendente
                                  </Badge>
                                  {(effectiveRole === 'Administrador' ||
                                    effectiveRole === 'Gerente de Projeto') && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleApprove(transaction.id)
                                      }}
                                    >
                                      Aprovar
                                    </Button>
                                  )}
                                </div>
                              )
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm">
                            {transaction.responsible}
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
                Nenhuma transação registrada para este projeto neste período.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  )
}
