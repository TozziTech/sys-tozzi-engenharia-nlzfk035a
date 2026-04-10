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

const chartConfig = {
  plannedHours: {
    label: 'Horas Planejadas',
    color: 'hsl(var(--primary))',
  },
  realHours: {
    label: 'Horas Reais',
    color: 'hsl(var(--chart-2))',
  },
}

export function HoursChart() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Horas Planejadas vs. Reais</CardTitle>
        <CardDescription>Comparativo de horas estimadas e executadas por projeto.</CardDescription>
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
