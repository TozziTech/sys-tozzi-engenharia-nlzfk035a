import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { mockProductivity } from '@/data/mockTimesheetData'
import { cn } from '@/lib/utils'
import { ChartColorPicker } from '@/components/ui/chart-color-picker'
import { useChartColors } from '@/hooks/use-chart-colors'

export function ProductivityChart() {
  const { colors, updateColor } = useChartColors('timesheet_productivity', {
    low: '#ef4444',
    medium: '#f59e0b',
    high: '#10b981',
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Produtividade da Equipe</CardTitle>
          <CardDescription>Horas produtivas vs. Horas totais no mês atual.</CardDescription>
        </div>
        <ChartColorPicker
          config={[
            { id: 'low', label: 'Baixa (<70%)', color: colors.low },
            { id: 'medium', label: 'Média', color: colors.medium },
            { id: 'high', label: 'Alta (>90%)', color: colors.high },
          ]}
          onChange={updateColor}
        />
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {mockProductivity.map((eng) => {
          let progressColor = colors.medium
          if (eng.productivity < 70) progressColor = colors.low
          else if (eng.productivity > 90) progressColor = colors.high

          return (
            <div key={eng.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{eng.name}</span>
                <span className="text-muted-foreground">
                  {eng.productivity.toFixed(1)}%{' '}
                  <span className="text-xs">
                    ({eng.taskHours}h / {eng.totalHours}h)
                  </span>
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full w-full flex-1 transition-all duration-500 ease-in-out"
                  style={{
                    transform: `translateX(-${100 - Math.min(100, Math.max(0, eng.productivity))}%)`,
                    backgroundColor: progressColor,
                  }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
