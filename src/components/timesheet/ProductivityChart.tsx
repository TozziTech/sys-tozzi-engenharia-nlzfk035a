import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { mockProductivity } from '@/data/mockTimesheetData'
import { cn } from '@/lib/utils'

export function ProductivityChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtividade da Equipe</CardTitle>
        <CardDescription>Horas produtivas vs. Horas totais no mês atual.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {mockProductivity.map((eng) => {
          // Set color based on productivity thresholds
          let progressColor = 'bg-primary'
          if (eng.productivity < 70) progressColor = 'bg-destructive'
          else if (eng.productivity > 90) progressColor = 'bg-emerald-500'

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
              <Progress
                value={eng.productivity}
                className="h-2"
                indicatorClassName={progressColor}
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
