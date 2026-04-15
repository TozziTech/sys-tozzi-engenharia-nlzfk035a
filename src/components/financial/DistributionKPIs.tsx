import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, Calendar, Activity } from 'lucide-react'
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

    const initKpi = () => ({ total: 0, samuel: 0, tozzi: 0 })

    const mensal = initKpi()
    const anual = initKpi()
    const acumulado = initKpi()
    const media12m = initKpi()

    const twelveMonthsAgo = new Date(now)
    twelveMonthsAgo.setMonth(now.getMonth() - 12)

    history.forEach((h) => {
      const d = new Date(h.date)
      const amount = h.net_value || 0
      const samuel = h.samuel_amount || 0
      const tozzi = h.tozzi_amount || 0

      acumulado.total += amount
      acumulado.samuel += samuel
      acumulado.tozzi += tozzi

      if (d.getFullYear() === currentYear) {
        anual.total += amount
        anual.samuel += samuel
        anual.tozzi += tozzi

        if (d.getMonth() === currentMonth) {
          mensal.total += amount
          mensal.samuel += samuel
          mensal.tozzi += tozzi
        }
      }

      if (d >= twelveMonthsAgo && d <= now) {
        media12m.total += amount
        media12m.samuel += samuel
        media12m.tozzi += tozzi
      }
    })

    media12m.total /= 12
    media12m.samuel /= 12
    media12m.tozzi /= 12

    return { mensal, anual, acumulado, media12m }
  }, [history])

  const renderKpiContent = (data: { total: number; samuel: number; tozzi: number }) => (
    <div className="flex flex-col gap-1.5 mt-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-emerald-600 dark:text-emerald-500 font-medium">Samuel:</span>
        <span className="font-semibold">{formatCurrency(data.samuel)}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-blue-600 dark:text-blue-500 font-medium">Tozzi:</span>
        <span className="font-semibold">{formatCurrency(data.tozzi)}</span>
      </div>
      <div className="flex justify-between items-center mt-1 pt-2 border-t border-border/50">
        <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
          Total
        </span>
        <span className="font-bold text-lg">{formatCurrency(data.total)}</span>
      </div>
    </div>
  )

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 animate-fade-in-up">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Mensal</CardTitle>
          <Calendar className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>{renderKpiContent(kpis.mensal)}</CardContent>
      </Card>
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Anual</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>{renderKpiContent(kpis.anual)}</CardContent>
      </Card>
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Acumulado
          </CardTitle>
          <DollarSign className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>{renderKpiContent(kpis.acumulado)}</CardContent>
      </Card>
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Média Mensal (12m)
          </CardTitle>
          <Activity className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>{renderKpiContent(kpis.media12m)}</CardContent>
      </Card>
    </div>
  )
}
