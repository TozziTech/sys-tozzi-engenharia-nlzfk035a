import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import useProjectStore from '@/stores/useProjectStore'
import {
  GripVertical,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Briefcase,
  ArrowRight,
} from 'lucide-react'
import { CartesianGrid, XAxis, YAxis, LineChart, Line } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { Project, Transaction } from '@/types/project'

interface WidgetProps {
  projects: Project[]
  transactions: Transaction[]
}

function PerformanceWidget({ projects, transactions }: WidgetProps) {
  const totalProjects = projects.length
  const activeProjects = projects.filter((p) => p.status === 'Em Andamento').length

  const { totalIn, totalOut } = transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'Entrada') acc.totalIn += tx.value
      else acc.totalOut += tx.value
      return acc
    },
    { totalIn: 0, totalOut: 0 },
  )

  const profit = totalIn - totalOut

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
        <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
          <Briefcase className="h-4 w-4" /> Projetos Ativos
        </p>
        <p className="text-2xl font-bold">
          {activeProjects}{' '}
          <span className="text-sm font-normal text-slate-400">/ {totalProjects}</span>
        </p>
      </div>
      <div className="space-y-1 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
        <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Receita Total
        </p>
        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(totalIn)}
        </p>
      </div>
      <div className="space-y-1 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 col-span-2">
        <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
          <DollarSign className="h-4 w-4" /> Lucro Estimado
        </p>
        <p
          className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
        >
          {formatCurrency(profit)}
        </p>
      </div>
    </div>
  )
}

function TrendWidget({ transactions }: WidgetProps) {
  const chartData = useMemo(() => {
    const data: Record<string, { in: number; out: number }> = {}
    transactions.forEach((tx) => {
      const month = tx.date.substring(0, 7)
      if (!data[month]) data[month] = { in: 0, out: 0 }
      if (tx.type === 'Entrada') data[month].in += tx.value
      else data[month].out += tx.value
    })
    return Object.entries(data)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, vals]) => ({ month, Receitas: vals.in, Despesas: vals.out }))
  }, [transactions])

  if (chartData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm text-slate-500">
        Sem dados suficientes
      </div>
    )
  }

  return (
    <ChartContainer
      config={{
        Receitas: { label: 'Receitas', color: 'hsl(var(--chart-1))' },
        Despesas: { label: 'Despesas', color: 'hsl(var(--chart-2))' },
      }}
      className="h-[250px] w-full"
    >
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
        <YAxis tickFormatter={(val) => `R$${val / 1000}k`} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="Receitas"
          stroke="var(--color-Receitas)"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="Despesas"
          stroke="var(--color-Despesas)"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  )
}

function AlertsWidget({ projects }: WidgetProps) {
  const alerts = projects.filter((p) => {
    const isLate = p.status === 'Atrasado'
    const overBudget = p.spent && p.budget && p.spent > p.budget
    return isLate || overBudget
  })

  if (alerts.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm text-slate-500 border border-dashed rounded-md bg-slate-50/50 dark:bg-slate-900/20">
        Nenhum alerta crítico no momento.
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
      {alerts.map((p) => {
        const isLate = p.status === 'Atrasado'
        const overBudget = p.spent && p.budget && p.spent > p.budget

        return (
          <div
            key={p.id}
            className="flex flex-col gap-2 p-3 rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20"
          >
            <div className="flex justify-between items-start">
              <span className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                {p.name}
              </span>
              <div className="flex gap-1">
                {isLate && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                    Atrasado
                  </Badge>
                )}
                {overBudget && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] px-1.5 py-0 h-5 bg-amber-500 hover:bg-amber-600"
                  >
                    Orçamento Estourado
                  </Badge>
                )}
              </div>
            </div>
            {overBudget && p.spent && p.budget && (
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Gasto: R$ {p.spent.toLocaleString()} / Orçamento: R$ {p.budget.toLocaleString()}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const WIDGETS_DATA = [
  { id: 'perf', title: 'Performance Geral', component: PerformanceWidget },
  { id: 'trend', title: 'Gráficos de Tendência', component: TrendWidget },
  { id: 'alerts', title: 'Alertas de Orçamento', component: AlertsWidget },
]

export default function Dashboard() {
  const { projects, transactions, auditLogs } = useProjectStore()
  const [widgets, setWidgets] = useState(WIDGETS_DATA.map((w) => w.id))
  const [draggedOverId, setDraggedOverId] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    setDraggedOverId(null)
    const draggedId = e.dataTransfer.getData('text/plain')
    if (draggedId && draggedId !== targetId) {
      setWidgets((prev) => {
        const newOrder = [...prev]
        const draggedIdx = newOrder.indexOf(draggedId)
        const targetIdx = newOrder.indexOf(targetId)

        newOrder.splice(draggedIdx, 1)
        newOrder.splice(targetIdx, 0, draggedId)

        return newOrder
      })
    }
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedOverId !== id) {
      setDraggedOverId(id)
    }
  }

  const handleDragLeave = () => {
    setDraggedOverId(null)
  }

  const suspiciousLogs = useMemo(() => {
    return (auditLogs || []).filter((log) => {
      if (log.action === 'Delete') return true
      return log.changes.some((c: any) => {
        const valStr = String(c.newValue || '') + String(c.oldValue || '')
        if (valStr.includes('R$')) {
          const numStr = valStr
            .replace(/\./g, '')
            .replace(',', '.')
            .replace(/[^\d.]/g, '')
          const num = parseFloat(numStr)
          return num > 20000
        }
        return false
      })
    })
  }, [auditLogs])

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Dashboard Geral
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Visão consolidada de suas métricas. Arraste os painéis para personalizar seu layout.
        </p>
      </div>

      {suspiciousLogs.length > 0 && (
        <Alert
          variant="destructive"
          className="bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-200"
        >
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-base font-semibold">
            Alerta de Atividades Suspeitas
          </AlertTitle>
          <AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p>
              Foram detectadas {suspiciousLogs.length} atividade(s) suspeita(s) (exclusões ou
              movimentações de alto valor) nos registros de auditoria.
            </p>
            <Link to="/history">
              <Badge
                variant="outline"
                className="bg-white/50 hover:bg-white dark:bg-black/50 dark:hover:bg-black text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 flex items-center gap-1 cursor-pointer"
              >
                Investigar
                <ArrowRight className="h-3 w-3" />
              </Badge>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {widgets.map((id) => {
          const widgetInfo = WIDGETS_DATA.find((w) => w.id === id)!
          const WidgetComponent = widgetInfo.component

          return (
            <div
              key={id}
              draggable
              onDragStart={(e) => handleDragStart(e, id)}
              onDrop={(e) => handleDrop(e, id)}
              onDragOver={(e) => handleDragOver(e, id)}
              onDragLeave={handleDragLeave}
              className={`col-span-1 ${id === 'trend' ? 'md:col-span-2' : ''} transition-transform duration-200`}
            >
              <Card
                className={`h-full border bg-white dark:bg-slate-950 shadow-sm transition-all hover:shadow-md ${
                  draggedOverId === id
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 opacity-70 scale-[0.99]'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 cursor-grab active:cursor-grabbing border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 rounded-t-xl">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-slate-400" />
                    {widgetInfo.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <WidgetComponent projects={projects} transactions={transactions} />
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
