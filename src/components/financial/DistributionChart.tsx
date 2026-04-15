import { useMemo } from 'react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChartColorPicker } from '@/components/ui/chart-color-picker'
import { useChartColors } from '@/hooks/use-chart-colors'

interface Props {
  data: any[]
}

export function DistributionChart({ data }: Props) {
  const { colors: ac, updateColor: updateAnnual } = useChartColors('distribution_annual', {
    samuel: '#3b82f6',
    tozzi: '#10b981',
  })

  const { colors: mc, updateColor: updateMonthly } = useChartColors('distribution_monthly', {
    samuel: '#3b82f6',
    tozzi: '#10b981',
  })

  const annualData = useMemo(() => {
    const grouped = data.reduce((acc: any, curr) => {
      const year = new Date(curr.date || curr.created).getFullYear().toString()
      if (!acc[year]) acc[year] = { year, samuel: 0, tozzi: 0, net: 0 }
      acc[year].samuel += curr.samuel_amount || 0
      acc[year].tozzi += curr.tozzi_amount || 0
      acc[year].net += curr.net_value || 0
      return acc
    }, {})
    return Object.values(grouped).sort((a: any, b: any) => a.year.localeCompare(b.year))
  }, [data])

  const monthlyData = useMemo(() => {
    const grouped = data.reduce((acc: any, curr) => {
      const date = new Date(curr.date || curr.created)
      const key = format(date, 'yyyy-MM')
      if (!acc[key])
        acc[key] = {
          key,
          label: format(date, 'MMM/yy', { locale: ptBR }),
          samuel: 0,
          tozzi: 0,
          net: 0,
          ts: date.getTime(),
        }
      acc[key].samuel += curr.samuel_amount || 0
      acc[key].tozzi += curr.tozzi_amount || 0
      acc[key].net += curr.net_value || 0
      return acc
    }, {})
    return Object.values(grouped)
      .sort((a: any, b: any) => a.ts - b.ts)
      .slice(-12)
  }, [data])

  return (
    <div className="space-y-6 h-full flex flex-col">
      <Card
        className="flex-1 flex flex-col border-border/50 shadow-sm animate-fade-in-up"
        style={{ animationDelay: '100ms' }}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg">Distribuição Anual</CardTitle>
            <CardDescription>Visão geral de distribuição por ano</CardDescription>
          </div>
          <ChartColorPicker
            config={[
              { id: 'samuel', label: 'Cor Samuel', color: ac.samuel },
              { id: 'tozzi', label: 'Cor Tozzi', color: ac.tozzi },
            ]}
            onChange={updateAnnual}
          />
        </CardHeader>
        <CardContent className="flex-1 min-h-[300px]">
          <ChartContainer
            config={{
              samuel: { label: 'Samuel', color: ac.samuel },
              tozzi: { label: 'Tozzi', color: ac.tozzi },
            }}
            className="h-full w-full"
          >
            <BarChart data={annualData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis
                tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="samuel"
                name="Samuel"
                fill="var(--color-samuel)"
                radius={[4, 4, 0, 0]}
              />
              <Bar dataKey="tozzi" name="Tozzi" fill="var(--color-tozzi)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card
        className="flex-1 flex flex-col border-border/50 shadow-sm animate-fade-in-up"
        style={{ animationDelay: '200ms' }}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg">Distribuição Mensal</CardTitle>
            <CardDescription>Evolução mês a mês (últimos 12 meses)</CardDescription>
          </div>
          <ChartColorPicker
            config={[
              { id: 'samuel', label: 'Cor Samuel', color: mc.samuel },
              { id: 'tozzi', label: 'Cor Tozzi', color: mc.tozzi },
            ]}
            onChange={updateMonthly}
          />
        </CardHeader>
        <CardContent className="flex-1 min-h-[300px]">
          <ChartContainer
            config={{
              samuel: { label: 'Samuel', color: mc.samuel },
              tozzi: { label: 'Tozzi', color: mc.tozzi },
            }}
            className="h-full w-full"
          >
            <BarChart data={monthlyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis
                tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="samuel"
                name="Samuel"
                fill="var(--color-samuel)"
                radius={[4, 4, 0, 0]}
              />
              <Bar dataKey="tozzi" name="Tozzi" fill="var(--color-tozzi)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
