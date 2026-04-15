import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { mockProjectMetrics } from '@/data/mockTimesheetData'
import { ChartColorPicker } from '@/components/ui/chart-color-picker'
import { useChartColors } from '@/hooks/use-chart-colors'
import { useMemo } from 'react'

export function HoursChart() {
  const { colors, updateColor } = useChartColors('timesheet_hours', {
    plannedHours: '#3b82f6',
    realHours: '#10b981',
  })

  const chartConfig = useMemo(
    () => ({
      plannedHours: {
        label: 'Horas Planejadas',
        color: colors.plannedHours,
      },
      realHours: {
        label: 'Horas Reais',
        color: colors.realHours,
      },
    }),
    [colors],
  )

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Horas Planejadas vs. Reais</CardTitle>
          <CardDescription>
            Comparativo de horas estimadas e executadas por projeto.
          </CardDescription>
        </div>
        <ChartColorPicker
          config={[
            { id: 'plannedHours', label: 'Horas Planejadas', color: colors.plannedHours },
            { id: 'realHours', label: 'Horas Reais', color: colors.realHours },
          ]}
          onChange={updateColor}
        />
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={mockProjectMetrics} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              className="text-xs"
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={10} className="text-xs" />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="plannedHours" fill="var(--color-plannedHours)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="realHours" fill="var(--color-realHours)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
