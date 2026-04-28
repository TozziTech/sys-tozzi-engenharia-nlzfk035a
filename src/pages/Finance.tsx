import { useState, useMemo } from 'react'
import { AlertCircle, ArrowUpRight, ArrowDownRight, Wallet, FilterX } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePermissions } from '@/hooks/use-permissions'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import useProjectStore from '@/stores/useProjectStore'
import { subDays, isAfter } from 'date-fns'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
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
  const { projects, transactions, categories } = useProjectStore()
  const { canAccess } = usePermissions()
  const { user } = useAuth()
  const { toast } = useToast()

  const [periodFilter, setPeriodFilter] = useState<string>('all')

  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

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

  const LOW_BALANCE_THRESHOLD = 5000

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

  const clearFilters = () => {
    setSelectedProject('all')
    setSelectedMonth('all')
    setSelectedYear('all')
    setSelectedType('all')
    setPeriodFilter('all')
  }

  if (!user) return null

  if (!canAccess('planilha_financeira') && user.role !== 'Administrador') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] p-8 animate-fade-in">
        <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">
          Acesso Negado
        </h2>
        <p className="text-muted-foreground">
          Você não tem permissão para acessar a planilha financeira.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full p-6 md:p-8 mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" />
            Dashboard Financeiro
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Análise e acompanhamento das receitas e despesas dos seus projetos.
          </p>
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

      {balance < LOW_BALANCE_THRESHOLD && (
        <Alert
          variant="destructive"
          className="bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-200"
        >
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-base font-semibold">
            Alerta de Fluxo de Caixa Crítico
          </AlertTitle>
          <AlertDescription className="mt-1">
            O saldo atual ({formatCurrency(balance)}) está abaixo do limite de segurança de{' '}
            {formatCurrency(LOW_BALANCE_THRESHOLD)}. Atenção aos próximos vencimentos para evitar
            descoberto.
          </AlertDescription>
        </Alert>
      )}

      <Alert className="bg-primary/10 text-primary border-primary/20 mt-4">
        <AlertTitle className="text-base font-semibold flex items-center gap-2">
          Filtros Migrados
        </AlertTitle>
        <AlertDescription className="mt-1">
          Os filtros avançados foram migrados para o módulo de "Análise Avançada" no Dashboard
          Financeiro para uma experiência unificada.
        </AlertDescription>
      </Alert>
    </div>
  )
}
