import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, Calendar } from 'lucide-react'
import { useMemo } from 'react'

interface Props {
  history: any[]
}

export function DistributionKPIs({ history }: Props) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const kpis = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let mensal = 0
    let anual = 0
    let acumulado = 0

    history.forEach((h) => {
      const d = new Date(h.date)
      const amount = h.total_amount || 0

      acumulado += amount
      if (d.getFullYear() === currentYear) {
        anual += amount
        if (d.getMonth() === currentMonth) {
          mensal += amount
        }
      }
    })

    return { mensal, anual, acumulado }
  }, [history])

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6 animate-fade-in-up">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Mensal</CardTitle>
          <Calendar className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(kpis.mensal)}</div>
        </CardContent>
      </Card>
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Anual</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(kpis.anual)}</div>
        </CardContent>
      </Card>
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Acumulado
          </CardTitle>
          <DollarSign className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(kpis.acumulado)}</div>
        </CardContent>
      </Card>
    </div>
  )
}
