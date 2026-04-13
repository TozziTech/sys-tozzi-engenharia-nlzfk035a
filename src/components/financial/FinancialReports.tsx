import { useMemo } from 'react'
import { PieChart as PieChartIcon, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import useProjectStore from '@/stores/useProjectStore'
import { useFinancialCategories } from '@/hooks/use-financial-categories'

export function FinancialReports() {
  const { projects, transactions } = useProjectStore()
  const { categories } = useFinancialCategories()

  const expenses = useMemo(() => transactions.filter((t) => t.type === 'Saída'), [transactions])

  const projectCosts = useMemo(() => {
    const costs: Record<string, number> = {}
    expenses.forEach((tx) => {
      const pId = tx.projectId || 'tozzi_interno'
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
      const cId = tx.categoryId
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Custo Total por Projeto
          </CardTitle>
          <CardDescription>
            Comparativo de gastos entre os projetos ativos (incluindo TOZZI)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projectCosts.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
              Nenhum custo registrado.
            </div>
          ) : (
            <ChartContainer
              config={{ total: { label: 'Custo Total (R$)', color: 'hsl(var(--primary))' } }}
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
                <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: 'transparent' }} />
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
          <CardDescription>Distribuição percentual dos custos</CardDescription>
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
    </div>
  )
}
