import { useState, useEffect, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Repeat } from 'lucide-react'

export function RecurringExpensesCard() {
  const [records, setRecords] = useState<any[]>([])

  const loadData = async () => {
    try {
      const data = await pb.collection('financial_records').getFullList({
        filter: 'is_recurring = true && type = "Saída"',
      })
      setRecords(data)
    } catch (error) {
      console.error('Error loading recurring expenses:', error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('financial_records', () => {
    loadData()
  })

  const totalMonthly = useMemo(() => {
    return records.reduce((acc, record) => {
      const amount = record.amount || 0
      const freq = record.frequency
      let monthlyAmount = 0

      if (freq === 'Mensal') {
        monthlyAmount = amount
      } else if (freq === 'Semanal') {
        monthlyAmount = amount * 4
      } else if (freq === 'Anual') {
        monthlyAmount = amount / 12
      }

      return acc + monthlyAmount
    }, 0)
  }, [records])

  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(totalMonthly)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Total Gastos Recorrentes (Mensal)</CardTitle>
        <Repeat className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-rose-600">{formattedTotal}</div>
      </CardContent>
    </Card>
  )
}
