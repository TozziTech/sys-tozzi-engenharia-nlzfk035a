import { useEffect, useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export function RecurringExpensesChart() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const currentYear = new Date().getFullYear()
      const startOfYear = `${currentYear}-01-01 00:00:00`
      const endOfYear = `${currentYear}-12-31 23:59:59`

      const data = await pb.collection('financial_records').getFullList({
        filter: `is_recurring = true && type = 'Saída' && date >= '${startOfYear}' && date <= '${endOfYear}'`,
      })
      setRecords(data)
    } catch (error) {
      console.error('Error fetching recurring expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('financial_records', () => {
    loadData()
  })

  const chartData = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Date.UTC(currentYear, i, 1))
      return {
        month: format(d, 'MMM', { locale: ptBR }),
        total: 0,
      }
    })

    records.forEach((record) => {
      if (!record.date) return
      const date = new Date(record.date)
      if (date.getUTCFullYear() === currentYear) {
        const monthIndex = date.getUTCMonth()
        months[monthIndex].total += record.amount || 0
      }
    })

    return months.map((m) => ({
      ...m,
      month: m.month.charAt(0).toUpperCase() + m.month.slice(1),
    }))
  }, [records])

  const hasData = chartData.some((d) => d.total > 0)

  const chartConfig = {
    total: {
      label: 'Despesas Recorrentes',
      color: 'hsl(var(--destructive))',
    },
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Despesas Recorrentes ({new Date().getFullYear()})</CardTitle>
        <CardDescription>Comparativo mensal de custos fixos.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {loading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : !hasData ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            Nenhum dado disponível para o período.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => (val >= 1000 ? `R$ ${val / 1000}k` : `R$ ${val}`)}
                width={80}
              />
              <ChartTooltip
                cursor={{ fill: 'var(--muted)' }}
                content={<ChartTooltipContent formatter={(val) => formatCurrency(Number(val))} />}
              />
              <Bar
                dataKey="total"
                fill="var(--color-total)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
