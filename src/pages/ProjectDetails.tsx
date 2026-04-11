import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useProjectStore from '@/stores/useProjectStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/StatusBadge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { subDays, isAfter } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  User,
  Briefcase,
  Clock,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EditProjectModal } from '@/components/EditProjectModal'
import { ProjectComments } from '@/components/ProjectComments'
import { KanbanBoard } from '@/components/KanbanBoard'
import { ProjectVersions } from '@/components/ProjectVersions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'

const MOCK_TEAM = [
  {
    id: 1,
    name: 'João Carlos',
    role: 'Arquiteto Sênior',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1',
  },
  {
    id: 2,
    name: 'Ana Silva',
    role: 'Engenheira Civil',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=2',
  },
  {
    id: 3,
    name: 'Marcos Paulo',
    role: 'Mestre de Obras',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=3',
  },
]

const MOCK_HISTORY = [
  { id: 1, date: '2024-03-01', time: '10:00', action: 'Projeto criado no sistema' },
  { id: 2, date: '2024-03-05', time: '14:30', action: 'Documentação anexada: Planta Baixa.pdf' },
  { id: 3, date: '2024-03-10', time: '09:15', action: 'Status alterado para Em Andamento' },
  { id: 4, date: '2024-03-12', time: '16:45', action: 'Orçamento estimado atualizado' },
]

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { projects, deleteProject, transactions, updateTransaction, categories } = useProjectStore()
  const { toast } = useToast()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [periodFilter, setPeriodFilter] = useState<string>('all')
  const [draggedTx, setDraggedTx] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id])

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-2xl font-bold mb-4">Projeto não encontrado</h2>
        <Button onClick={() => navigate('/projects')}>Voltar para Projetos</Button>
      </div>
    )
  }

  const handleDelete = () => {
    deleteProject(project.id)
    toast({
      title: 'Projeto deletado',
      description: 'O projeto foi removido com sucesso.',
      variant: 'destructive',
    })
    navigate('/projects')
  }

  const formatCurrency = (value?: number) => {
    if (value === undefined) return 'N/A'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const budget = project.budget || 0
  const spent = project.spent || 0
  const budgetPercentage = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link to="/projects">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="gap-2"
          >
            <Edit2 className="h-4 w-4" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Deletar</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold">{project.name}</CardTitle>
                  <CardDescription className="text-base mt-1">{project.client}</CardDescription>
                </div>
                <StatusBadge status={project.status} className="px-3 py-1 text-sm font-medium" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                      Disciplina
                    </p>
                    <p className="font-medium">{project.discipline}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                      Engenheiro Resp.
                    </p>
                    <p className="font-medium">{project.engineer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                      Início
                    </p>
                    <p className="font-medium">
                      {project.startDate.split('-').reverse().join('/')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                      Entrega
                    </p>
                    <p className="font-medium">{project.endDate.split('-').reverse().join('/')}</p>
                  </div>
                </div>
                {project.cno && (
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                        CNO da Obra
                      </p>
                      <p className="font-medium">{project.cno}</p>
                    </div>
                  </div>
                )}
                {project.cnpj && (
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                        CNPJ da Obra
                      </p>
                      <p className="font-medium">{project.cnpj}</p>
                    </div>
                  </div>
                )}
              </div>

              {project.description && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-muted-foreground text-sm">{project.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              {project.observations ? (
                <div className="bg-muted/50 p-4 rounded-lg border border-border">
                  <p className="text-sm whitespace-pre-wrap text-foreground">
                    {project.observations}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma observação detalhada foi registrada para este projeto.
                </p>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="flex flex-wrap w-full h-auto gap-1 sm:grid sm:grid-cols-6 p-1">
              <TabsTrigger value="tasks" className="flex-1">
                Tarefas
              </TabsTrigger>
              <TabsTrigger value="team" className="flex-1">
                Equipe
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1">
                Histórico
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex-1">
                Comentários
              </TabsTrigger>
              <TabsTrigger value="versions" className="flex-1">
                Versões
              </TabsTrigger>
              <TabsTrigger value="finance" className="flex-1">
                Financeiro
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-4">
              <KanbanBoard projectName={project.name} teamMembers={MOCK_TEAM} />
            </TabsContent>

            <TabsContent value="team" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Equipe Alocada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {MOCK_TEAM.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-4 p-3 border rounded-lg"
                      >
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Histórico de Atividades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative border-l border-muted-foreground/30 ml-3 space-y-6">
                    {MOCK_HISTORY.map((item) => (
                      <div key={item.id} className="pl-6 relative">
                        <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1.5 ring-4 ring-background" />
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-1">
                          <span className="font-medium">{item.action}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.date.split('-').reverse().join('/')} às {item.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <ProjectComments projectId={project.id} />
            </TabsContent>

            <TabsContent value="versions" className="mt-4">
              <ProjectVersions projectId={project.id} />
            </TabsContent>

            <TabsContent value="finance" className="mt-4 space-y-6">
              {(() => {
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

                const projectTransactions = [...storeTransactions, ...mockTransactions].filter(
                  (t) => {
                    if (limitDate) {
                      const txDate = new Date(t.date)
                      if (!isAfter(txDate, limitDate)) return false
                    }
                    return true
                  },
                )
                const totalIn = projectTransactions
                  .filter((t) => t.type === 'Entrada')
                  .reduce((acc, curr) => acc + curr.value, 0)
                const totalOut = projectTransactions
                  .filter((t) => t.type === 'Saída')
                  .reduce((acc, curr) => acc + curr.value, 0)
                const profit = totalIn - totalOut

                const expensesByMonth = useMemo(() => {
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
                }, [projectTransactions])

                const expensesByCategory = useMemo(() => {
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
                }, [projectTransactions])

                const pieChartConfig = useMemo(() => {
                  const config: any = { value: { label: 'Valor' } }
                  categories.forEach((cat) => {
                    config[cat.name] = { label: cat.name, color: cat.color }
                  })
                  return config
                }, [])

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

                  const csvContent = [
                    ...summary.map((r) => r.join(',')),
                    ...rows.map((r) => r.join(',')),
                  ].join('\n')
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
                  project.budget && project.budget > 0
                    ? Math.round((totalOut / project.budget) * 100)
                    : 0
                const progressColorClass =
                  budgetPct > 90
                    ? '[&>div]:bg-red-500 bg-red-100'
                    : budgetPct >= 70
                      ? '[&>div]:bg-yellow-500 bg-yellow-100'
                      : '[&>div]:bg-blue-500 bg-blue-100'

                return (
                  <>
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
                        <CardDescription>
                          Custo Real em relação ao Orçamento Estimado
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Orçamento Consumido
                          </span>
                          <span className="text-sm font-bold">{budgetPct}%</span>
                        </div>
                        <Progress
                          value={Math.min(budgetPct, 100)}
                          className={`h-3 ${progressColorClass}`}
                        />
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">
                            Evolução de Despesas
                          </CardTitle>
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
                                <Bar
                                  dataKey="value"
                                  fill="var(--color-value)"
                                  radius={[4, 4, 0, 0]}
                                />
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
                          <CardTitle className="text-sm font-medium">
                            Despesas por Categoria
                          </CardTitle>
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
                          <div className="text-2xl font-bold">
                            {formatCurrency(project.budget || 0)}
                          </div>
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
                            Movimentações financeiras do projeto. Arraste uma transação para as
                            categorias abaixo para reatribuir.
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
                                  const cat = categories.find(
                                    (c) => c.id === transaction.categoryId,
                                  )
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
                                          variant={
                                            transaction.type === 'Entrada'
                                              ? 'default'
                                              : 'destructive'
                                          }
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
                                          transaction.type === 'Entrada'
                                            ? 'text-emerald-500'
                                            : 'text-red-500'
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
                  </>
                )
              })()}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Conclusão</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Dados Financeiros</CardTitle>
              <CardDescription>Orçamento vs Despesas reais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Orçamento Estimado
                  </p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(budget)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Despesas Registradas
                  </p>
                  <p className="text-xl font-semibold text-foreground">{formatCurrency(spent)}</p>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1.5 text-muted-foreground font-medium">
                    <span>{budgetPercentage}% Consumido</span>
                  </div>
                  <Progress
                    value={budgetPercentage}
                    className={`h-2 ${budgetPercentage > 100 ? 'bg-red-100 [&>div]:bg-red-500' : budgetPercentage > 80 ? 'bg-amber-100 [&>div]:bg-amber-500' : ''}`}
                  />
                </div>
                {budgetPercentage > 100 && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm font-medium rounded-md border border-red-200">
                    Atenção: O projeto ultrapassou o orçamento planejado.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditProjectModal
        project={project}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja deletar?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso removerá permanentemente o projeto "
              {project.name}" do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
