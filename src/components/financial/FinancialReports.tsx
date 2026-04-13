import { useState, useMemo } from 'react'
import {
  PieChart as PieChartIcon,
  BarChart3,
  Download,
  FileText,
  Pencil,
  Calendar as CalIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import useProjectStore from '@/stores/useProjectStore'
import { useFinancialCategories } from '@/hooks/use-financial-categories'
import { useAuth } from '@/hooks/use-auth'
import { exportFinancialCSV } from '@/lib/export'
import { exportFinancialPDF } from '@/lib/exportPdf'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

export function FinancialReports() {
  const { projects, transactions } = useProjectStore()
  const { categories } = useFinancialCategories()
  const { user } = useAuth()

  const [period, setPeriod] = useState('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const [editBudgetProject, setEditBudgetProject] = useState<any>(null)
  const [budgetInput, setBudgetInput] = useState('')

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (period === 'all') return true
      const d = new Date(tx.date)
      const now = new Date()
      if (period === 'current_month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }
      if (period === 'last_3_months') {
        const limit = new Date()
        limit.setMonth(now.getMonth() - 3)
        return d >= limit
      }
      if (period === 'this_year') {
        return d.getFullYear() === now.getFullYear()
      }
      if (period === 'custom' && customStart && customEnd) {
        return d >= new Date(customStart) && d <= new Date(customEnd)
      }
      return true
    })
  }, [transactions, period, customStart, customEnd])

  const expenses = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'Saída'),
    [filteredTransactions],
  )

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        const val = tx.value || (tx as any).amount || 0
        if (tx.type === 'Entrada') acc.revenue += val
        else if (tx.type === 'Saída') acc.expenses += val
        acc.balance = acc.revenue - acc.expenses
        return acc
      },
      { revenue: 0, expenses: 0, balance: 0 },
    )
  }, [filteredTransactions])

  const projectCosts = useMemo(() => {
    const costs: Record<string, number> = {}
    expenses.forEach((tx) => {
      const pId = tx.projectId || (tx as any).project_id || 'tozzi_interno'
      const pName =
        pId === 'tozzi_interno'
          ? 'TOZZI (Interno)'
          : projects.find((p) => p.id === pId)?.name || 'TOZZI (Interno)'
      costs[pName] = (costs[pName] || 0) + (tx.value || (tx as any).amount || 0)
    })
    return Object.entries(costs)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
  }, [expenses, projects])

  const categoryCosts = useMemo(() => {
    const costs: Record<string, number> = {}
    expenses.forEach((tx) => {
      const cId = tx.categoryId || (tx as any).category
      const cName = categories.find((c) => c.id === cId)?.name || 'Sem Categoria'
      costs[cName] = (costs[cName] || 0) + (tx.value || (tx as any).amount || 0)
    })
    return Object.entries(costs)
      .map(([name, total]) => {
        const cat = categories.find((c) => c.name === name)
        return { name, total, fill: cat?.color || '#94a3b8' }
      })
      .sort((a, b) => b.total - a.total)
  }, [expenses, categories])

  const budgetAnalysis = useMemo(() => {
    const allExpenses = transactions.filter((t) => t.type === 'Saída')
    return projects.map((p) => {
      const spent = allExpenses
        .filter((tx) => (tx.projectId || (tx as any).project_id) === p.id)
        .reduce((sum, tx) => sum + (tx.value || (tx as any).amount || 0), 0)
      return { ...p, calculatedSpent: spent }
    })
  }, [projects, transactions])

  const exportCSV = () => exportFinancialCSV(filteredTransactions, 'Relatório')
  const exportPDF = () => {
    const totals = filteredTransactions.reduce(
      (acc, tx) => {
        const val = tx.value || (tx as any).amount || 0
        if (tx.type === 'Entrada') acc.revenue += val
        else acc.expenses += val
        acc.balance = acc.revenue - acc.expenses
        return acc
      },
      { revenue: 0, expenses: 0, balance: 0 },
    )
    exportFinancialPDF(filteredTransactions, totals, 'Relatório', user?.name || 'Usuário')
  }

  const handleSaveBudget = async () => {
    if (!editBudgetProject) return
    try {
      await pb.collection('projects').update(editBudgetProject.id, { budget: Number(budgetInput) })
      setEditBudgetProject(null)
    } catch (err) {
      console.error(err)
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <CalIcon className="h-4 w-4 text-slate-500" />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-slate-950">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o Período</SelectItem>
                <SelectItem value="current_month">Mês Atual</SelectItem>
                <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
                <SelectItem value="this_year">Este Ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-[140px] bg-white dark:bg-slate-950"
              />
              <span className="text-slate-500">até</span>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-[140px] bg-white dark:bg-slate-950"
              />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
          <Button variant="outline" onClick={exportPDF}>
            <FileText className="h-4 w-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totals.revenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {formatCurrency(totals.expenses)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Saldo no Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                totals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600',
              )}
            >
              {formatCurrency(totals.balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Custo por Projeto
            </CardTitle>
            <CardDescription>Comparativo de gastos no período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            {projectCosts.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
                Nenhum custo registrado.
              </div>
            ) : (
              <ChartContainer
                config={{ total: { label: 'Custo', color: 'hsl(var(--primary))' } }}
                className="h-[300px] w-full"
              >
                <BarChart data={projectCosts} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    className="stroke-slate-200 dark:stroke-slate-800"
                  />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    tickFormatter={(val) => `R$ ${val.toLocaleString('pt-BR')}`}
                    width={80}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" /> Despesas por Categoria
            </CardTitle>
            <CardDescription>Distribuição percentual no período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryCosts.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
                Nenhuma despesa registrada.
              </div>
            ) : (
              <ChartContainer config={{}} className="h-[300px] w-full">
                <PieChart>
                  <Pie
                    data={categoryCosts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="total"
                    nameKey="name"
                  >
                    {categoryCosts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    formatter={(value) => (
                      <span className="text-xs text-slate-700 dark:text-slate-300">{value}</span>
                    )}
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Orçamento de Projetos (Análise de Rentabilidade)</CardTitle>
            <CardDescription>
              Acompanhamento de orçamento estimado vs gasto real (histórico completo de despesas)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {budgetAnalysis.length === 0 ? (
                <div className="text-center py-6 text-slate-500">Nenhum projeto encontrado.</div>
              ) : (
                budgetAnalysis.map((p) => {
                  const budget = p.budget || 0
                  const spent = p.calculatedSpent
                  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
                  const isOver = spent > budget
                  return (
                    <div
                      key={p.id}
                      className="space-y-2 p-4 rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm gap-2">
                        <div className="font-medium text-base">{p.name}</div>
                        <div className="flex items-center flex-wrap gap-4">
                          <span className="text-slate-500">
                            Gasto:{' '}
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {formatCurrency(spent)}
                            </span>
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Orçamento: {formatCurrency(budget)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditBudgetProject(p)
                              setBudgetInput(budget.toString())
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Progress
                        value={pct}
                        className={cn('h-2', isOver && 'bg-red-100 [&>div]:bg-red-600')}
                      />
                      {isOver && (
                        <p className="text-xs text-red-500 font-medium">
                          Atenção: O gasto já ultrapassou o orçamento estabelecido para o projeto.
                        </p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editBudgetProject} onOpenChange={(o) => !o && setEditBudgetProject(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Ajustar Orçamento - {editBudgetProject?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Novo Orçamento (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBudgetProject(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveBudget}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
