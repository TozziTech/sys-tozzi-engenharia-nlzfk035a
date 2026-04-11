import { useState, useMemo } from 'react'
import {
  Plus,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  FilterX,
  Tags,
  Trash2,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import useProjectStore from '@/stores/useProjectStore'
import type { Transaction } from '@/types/project'
import { subDays, isAfter } from 'date-fns'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart'

const months = [
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
]

export default function Finance() {
  const {
    projects,
    transactions,
    addTransaction,
    updateTransaction,
    categories,
    addCategory,
    deleteCategory,
  } = useProjectStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [periodFilter, setPeriodFilter] = useState<string>('all')
  const [draggedTx, setDraggedTx] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isCatModalOpen, setIsCatModalOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#6366f1')

  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'Entrada',
    status: 'Pendente',
    value: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    projectId: '',
    categoryId: '',
  })

  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR')
  }

  const availableYears = useMemo(() => {
    const years = new Set<string>()
    years.add(new Date().getFullYear().toString())
    transactions.forEach((tx) => years.add(tx.date.substring(0, 4)))
    return Array.from(years).sort().reverse()
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    const now = new Date()
    let limitDate: Date | null = null
    if (periodFilter === '30d') limitDate = subDays(now, 30)
    else if (periodFilter === 'quarter') limitDate = subDays(now, 90)
    else if (periodFilter === 'year') limitDate = new Date(now.getFullYear(), 0, 1)

    return transactions.filter((tx) => {
      const txYear = tx.date.substring(0, 4)
      const txMonth = tx.date.substring(5, 7)

      if (selectedProject !== 'all' && tx.projectId !== selectedProject) return false
      if (selectedMonth !== 'all' && txMonth !== selectedMonth) return false
      if (selectedYear !== 'all' && txYear !== selectedYear) return false
      if (selectedType !== 'all' && tx.type !== selectedType) return false

      if (limitDate) {
        const txDate = new Date(tx.date)
        if (!isAfter(txDate, limitDate)) return false
      }

      return true
    })
  }, [transactions, selectedProject, selectedMonth, selectedYear, selectedType, periodFilter])

  const { totalIn, totalOut, balance } = useMemo(() => {
    let inFlow = 0
    let outFlow = 0
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'Entrada') inFlow += tx.value
      else outFlow += tx.value
    })
    return {
      totalIn: inFlow,
      totalOut: outFlow,
      balance: inFlow - outFlow,
    }
  }, [filteredTransactions])

  const projectPerformance = useMemo(() => {
    const map = new Map<string, { in: number; out: number }>()
    filteredTransactions.forEach((tx) => {
      if (!map.has(tx.projectId)) map.set(tx.projectId, { in: 0, out: 0 })
      if (tx.type === 'Entrada') map.get(tx.projectId)!.in += tx.value
      else map.get(tx.projectId)!.out += tx.value
    })
    return Array.from(map.entries()).map(([id, data]) => {
      const p = projects.find((proj) => proj.id === id)
      return {
        id,
        name: p?.name || 'Desconhecido',
        inflow: data.in,
        outflow: data.out,
        profit: data.in - data.out,
      }
    })
  }, [filteredTransactions, projects])

  const expensesByMonth = useMemo(() => {
    const data: Record<string, number> = {}
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'Saída') {
        const month = tx.date.substring(0, 7)
        data[month] = (data[month] || 0) + tx.value
      }
    })
    return Object.entries(data)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, value]) => ({ month, value }))
  }, [filteredTransactions])

  const expensesByCategory = useMemo(() => {
    const data: Record<string, number> = {}
    filteredTransactions.forEach((tx) => {
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
  }, [filteredTransactions, categories])

  const pieChartConfig = useMemo(() => {
    const config: ChartConfig = { value: { label: 'Valor' } }
    categories.forEach((cat) => {
      config[cat.name] = { label: cat.name, color: cat.color }
    })
    return config
  }, [categories])

  const [comparisonSelectedProjects, setComparisonSelectedProjects] = useState<string[]>([])

  const comparisonData = useMemo(() => {
    return comparisonSelectedProjects.map((projectId) => {
      const p = projects.find((proj) => proj.id === projectId)
      const pTxs = transactions.filter((tx) => tx.projectId === projectId)
      let inFlow = 0
      let outFlow = 0
      pTxs.forEach((tx) => {
        if (tx.type === 'Entrada') inFlow += tx.value
        else outFlow += tx.value
      })
      return {
        name: p?.name || 'Desconhecido',
        Entradas: inFlow,
        Saídas: outFlow,
        Lucro: inFlow - outFlow,
      }
    })
  }, [comparisonSelectedProjects, projects, transactions])

  const toggleComparisonProject = (id: string) => {
    setComparisonSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id],
    )
  }

  const clearFilters = () => {
    setSelectedProject('all')
    setSelectedMonth('all')
    setSelectedYear('all')
    setSelectedType('all')
    setPeriodFilter('all')
  }

  const handleSubmit = () => {
    if (!formData.description || !formData.date || !formData.projectId || !formData.value) return

    addTransaction({
      description: formData.description,
      type: formData.type as 'Entrada' | 'Saída',
      value: formData.value,
      date: new Date(formData.date).toISOString(),
      projectId: formData.projectId,
      status: formData.status as 'Pendente' | 'Pago',
      categoryId: formData.type === 'Saída' ? formData.categoryId : undefined,
    })

    setIsModalOpen(false)
    setFormData({
      type: 'Entrada',
      status: 'Pendente',
      value: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      projectId: '',
      categoryId: '',
    })
  }

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      addCategory({ name: newCatName.trim(), color: newCatColor })
      setNewCatName('')
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" />
            Dashboard Financeiro
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gerencie as receitas e despesas dos seus projetos.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Dialog open={isCatModalOpen} onOpenChange={setIsCatModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white dark:bg-slate-950">
                <Tags className="h-4 w-4 mr-2" /> Categorias
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerenciar Categorias de Despesas</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nova categoria..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <Input
                    type="color"
                    className="w-14 h-10 p-1 cursor-pointer"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                  />
                  <Button onClick={handleAddCategory}>Adicionar</Button>
                </div>
                <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2">
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="font-medium">{c.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteCategory(c.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm border border-dashed rounded-md">
                      Nenhuma categoria cadastrada.
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" /> Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Transação</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2 space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Compra de materiais..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v: 'Entrada' | 'Saída') =>
                      setFormData({
                        ...formData,
                        type: v,
                        categoryId: v === 'Entrada' ? undefined : formData.categoryId,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entrada">Entrada</SelectItem>
                      <SelectItem value="Saída">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.value || ''}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v: 'Pendente' | 'Pago') =>
                      setFormData({ ...formData, status: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Pago">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Projeto Vinculado</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(v) => setFormData({ ...formData, projectId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.type === 'Saída' && (
                  <div className="col-span-2 space-y-2">
                    <Label>Categoria de Despesa</Label>
                    <Select
                      value={formData.categoryId || 'none'}
                      onValueChange={(v) =>
                        setFormData({ ...formData, categoryId: v === 'none' ? undefined : v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem categoria</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: c.color }}
                              />
                              {c.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Alert className="bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Os dados (categorias, transações) inseridos nesta sessão são temporários e serão perdidos
          ao recarregar a página. Recomendamos conectar um backend (Supabase ou Skip Cloud) para
          persistência dos dados.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total de Entradas
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalIn)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total de Saídas
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(totalOut)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Saldo Atual
            </CardTitle>
            <Wallet className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${balance > 0 ? 'text-emerald-600 dark:text-emerald-400' : balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}
            >
              {formatCurrency(balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução de Despesas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Comparativo mensal baseado nos filtros aplicados.
            </p>
          </CardHeader>
          <CardContent>
            {expensesByMonth.length > 0 ? (
              <ChartContainer
                config={{ value: { label: 'Despesas', color: 'hsl(var(--chart-1))' } }}
                className="h-[250px] w-full"
              >
                <BarChart
                  data={expensesByMonth}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                  />
                  <YAxis
                    tickFormatter={(val) => `R$${val / 1000}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded-md">
                Nenhuma despesa para exibir.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribuição dos gastos baseado nos filtros aplicados.
            </p>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length > 0 ? (
              <ChartContainer config={pieChartConfig} className="h-[250px] w-full">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend
                    content={<ChartLegendContent />}
                    className="-translate-y-4 flex-wrap"
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded-md">
                Nenhuma categoria vinculada as despesas filtradas.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 flex-wrap bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
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

        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
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

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-full sm:w-[160px] bg-white dark:bg-slate-950">
            <SelectValue placeholder="Filtrar por Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Anos</SelectItem>
            {availableYears.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-[160px] bg-white dark:bg-slate-950">
            <SelectValue placeholder="Filtrar por Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="Entrada">Entrada</SelectItem>
            <SelectItem value="Saída">Saída</SelectItem>
          </SelectContent>
        </Select>

        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-full sm:w-[160px] bg-white dark:bg-slate-950">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo Período</SelectItem>
            <SelectItem value="30d">Mensal</SelectItem>
            <SelectItem value="quarter">Trimestral</SelectItem>
            <SelectItem value="year">Anual</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full sm:w-auto ml-auto bg-white dark:bg-slate-950"
          disabled={
            selectedProject === 'all' &&
            selectedMonth === 'all' &&
            selectedYear === 'all' &&
            selectedType === 'all' &&
            periodFilter === 'all'
          }
        >
          <FilterX className="h-4 w-4 mr-2" /> Limpar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparação de Projetos</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Selecione múltiplos projetos para comparar suas métricas financeiras lado a lado.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
            {projects.map((p) => (
              <div key={p.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`comp-${p.id}`}
                  checked={comparisonSelectedProjects.includes(p.id)}
                  onCheckedChange={() => toggleComparisonProject(p.id)}
                />
                <Label htmlFor={`comp-${p.id}`} className="cursor-pointer font-medium">
                  {p.name}
                </Label>
              </div>
            ))}
          </div>

          {comparisonSelectedProjects.length > 0 ? (
            <ChartContainer
              config={{
                Entradas: { label: 'Entradas', color: 'hsl(var(--chart-1))' },
                Saídas: { label: 'Saídas', color: 'hsl(var(--chart-2))' },
                Lucro: { label: 'Lucro', color: 'hsl(var(--chart-3))' },
              }}
              className="h-[350px] w-full"
            >
              <BarChart data={comparisonData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(val) => `R$${val / 1000}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="Entradas" fill="var(--color-Entradas)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saídas" fill="var(--color-Saídas)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Lucro" fill="var(--color-Lucro)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded-md bg-slate-50/50 dark:bg-slate-900/20">
              Selecione um ou mais projetos acima para visualizar a comparação.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance de Projetos</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Comparativo financeiro dos projetos baseado nos filtros atuais.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead className="text-right">Entradas</TableHead>
                  <TableHead className="text-right">Saídas</TableHead>
                  <TableHead className="text-right">Lucro Líquido</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectPerformance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      Nenhum projeto encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  projectPerformance.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        {p.name}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.inflow)}
                      </TableCell>
                      <TableCell className="text-right text-rose-600 dark:text-rose-400">
                        {formatCurrency(p.outflow)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold ${p.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                      >
                        {formatCurrency(p.profit)}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.profit >= 0 ? (
                          <Badge
                            variant="default"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
                          >
                            Lucrativo
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Déficit</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Lista de todas as transações de acordo com os filtros. Arraste uma transação para os
            painéis abaixo para reatribuí-la.
          </p>
        </CardHeader>
        <CardContent className="pb-2 border-b mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-lg border border-dashed transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-800'}`}
            >
              <h4 className="text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">
                Solte aqui para reatribuir Categoria
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
                        updateTransaction(draggedTx, { categoryId: c.id, type: 'Saída' })
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
            <div
              className={`p-4 rounded-lg border border-dashed transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-800'}`}
            >
              <h4 className="text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">
                Solte aqui para reatribuir Projeto
              </h4>
              <div className="flex flex-wrap gap-2">
                {projects.map((p) => (
                  <Badge
                    key={p.id}
                    variant="secondary"
                    className="cursor-pointer py-1.5"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (draggedTx) {
                        updateTransaction(draggedTx, { projectId: p.id })
                        setDraggedTx(null)
                        setIsDragging(false)
                      }
                    }}
                  >
                    {p.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardContent>
          <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor (R$)</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      Nenhuma transação encontrada para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => {
                    const cat = categories.find((c) => c.id === tx.categoryId)
                    const proj = projects.find((p) => p.id === tx.projectId)
                    return (
                      <TableRow
                        key={tx.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedTx(tx.id)
                          setIsDragging(true)
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        onDragEnd={() => {
                          setDraggedTx(null)
                          setIsDragging(false)
                        }}
                        className="cursor-grab active:cursor-grabbing hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                      >
                        <TableCell className="font-medium">{tx.description}</TableCell>
                        <TableCell>
                          {tx.type === 'Saída' && cat ? (
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
                          {tx.type === 'Entrada' ? (
                            <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                              <ArrowUpRight className="mr-1 h-4 w-4" /> Entrada
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-rose-600 dark:text-rose-400 font-medium">
                              <ArrowDownRight className="mr-1 h-4 w-4" /> Saída
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(tx.value)}</TableCell>
                        <TableCell>{formatDate(tx.date)}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">
                          {proj?.name || '-'}
                        </TableCell>
                        <TableCell>
                          {tx.status === 'Pago' ? (
                            <Badge
                              variant="default"
                              className="bg-emerald-500 hover:bg-emerald-600 border-transparent text-white"
                            >
                              Pago
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-amber-600 border-amber-500 dark:text-amber-400"
                            >
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
