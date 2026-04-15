import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const chartConfig = {
  samuel: { label: 'Samuel', color: 'hsl(var(--chart-1))' },
  tozzi: { label: 'Tozzi', color: 'hsl(var(--chart-2))' },
}

export function DistributionChart({ data }: { data: any[] }) {
  const currentYear = new Date().getFullYear()

  const { monthlyData, annualData, hasData } = useMemo(() => {
    const currentYearData = data.filter((item) => {
      const d = new Date(item.date || item.created)
      return d.getFullYear() === currentYear
    })

    const monthly = currentYearData.reduce(
      (acc, curr) => {
        const d = new Date(curr.date || curr.created)
        const month = format(d, 'MMM', { locale: ptBR })
        const monthKey = month.charAt(0).toUpperCase() + month.slice(1)
        if (!acc[monthKey]) {
          acc[monthKey] = {
            name: monthKey,
            samuel: 0,
            tozzi: 0,
            sort: d.getMonth(),
          }
        }
        acc[monthKey].samuel += curr.samuel_amount || 0
        acc[monthKey].tozzi += curr.tozzi_amount || 0
        return acc
      },
      {} as Record<string, any>,
    )

    const monthlyArray = Object.values(monthly).sort((a: any, b: any) => a.sort - b.sort)

    let totalSamuel = 0
    let totalTozzi = 0
    currentYearData.forEach((curr) => {
      totalSamuel += curr.samuel_amount || 0
      totalTozzi += curr.tozzi_amount || 0
    })

    const annualArray = [
      { name: 'Samuel', valor: totalSamuel, fill: 'var(--color-samuel)' },
      { name: 'Tozzi', valor: totalTozzi, fill: 'var(--color-tozzi)' },
    ]

    return {
      monthlyData: monthlyArray,
      annualData: annualArray,
      hasData: currentYearData.length > 0,
    }
  }, [data, currentYear])

  return (
    <Card className="shadow-sm border-border/50 flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Distribuição {currentYear}</CardTitle>
        <CardDescription>Visão comparativa dos valores distribuídos</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <Tabs defaultValue="mensal" className="w-full flex flex-col">
          <TabsList className="grid w-full max-w-sm grid-cols-2 mb-4">
            <TabsTrigger value="mensal">Mensal</TabsTrigger>
            <TabsTrigger value="anual">Anual</TabsTrigger>
          </TabsList>

          <TabsContent value="mensal" className="mt-0 outline-none">
            {!hasData ? (
              <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
                <p>Nenhum dado de distribuição encontrado para este período.</p>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <ChartTooltip
                    cursor={{ fill: 'var(--muted)' }}
                    content={<ChartTooltipContent indicator="dashed" />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="samuel" fill="var(--color-samuel)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tozzi" fill="var(--color-tozzi)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </TabsContent>

          <TabsContent value="anual" className="mt-0 outline-none">
            {!hasData ? (
              <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
                <p>Nenhum dado de distribuição encontrado para este período.</p>
              </div>
            ) : (
              <ChartContainer
                config={{
                  valor: { label: 'Valor (R$)' },
                  samuel: { color: 'hsl(var(--chart-1))' },
                  tozzi: { color: 'hsl(var(--chart-2))' },
                }}
                className="h-[250px] w-full"
              >
                <BarChart data={annualData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
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
                  <ChartTooltip
                    cursor={{ fill: 'var(--muted)' }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                    {annualData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
