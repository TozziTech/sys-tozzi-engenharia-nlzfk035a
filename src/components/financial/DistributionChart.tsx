import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { format } from 'date-fns'

const chartConfig = {
  samuel: { label: 'Samuel (R$)', color: 'hsl(var(--chart-1))' },
  tozzi: { label: 'Tozzi (R$)', color: 'hsl(var(--chart-2))' },
}

export function DistributionChart({ data }: { data: any[] }) {
  const chartData = useMemo(() => {
    const monthly = data.reduce(
      (acc, curr) => {
        const d = new Date(curr.date || curr.created)
        const monthYear = format(d, 'MM/yyyy')
        if (!acc[monthYear]) {
          acc[monthYear] = {
            name: monthYear,
            samuel: 0,
            tozzi: 0,
            sort: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
          }
        }
        acc[monthYear].samuel += curr.samuel_amount || 0
        acc[monthYear].tozzi += curr.tozzi_amount || 0
        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(monthly).sort((a: any, b: any) => a.sort - b.sort)
  }, [data])

  if (data.length === 0) return null

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Evolução de Distribuição</CardTitle>
        <CardDescription>Comparativo mensal de valores distribuídos aos sócios</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              className="text-xs text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) =>
                new Intl.NumberFormat('pt-BR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(v)
              }
              className="text-xs text-muted-foreground"
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="samuel" fill="var(--color-samuel)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="tozzi" fill="var(--color-tozzi)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
