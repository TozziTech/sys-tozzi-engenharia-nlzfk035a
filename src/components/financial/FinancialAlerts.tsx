import { useState, useEffect } from 'react'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { isBefore, startOfToday, addDays, isWithinInterval, parseISO } from 'date-fns'

export function FinancialAlerts() {
  const [records, setRecords] = useState<any[]>([])

  const loadData = async () => {
    try {
      const data = await pb.collection('financial_records').getFullList({
        filter: "status = 'Pendente' || status = ''",
      })
      setRecords(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('financial_records', () => {
    loadData()
  })

  const today = startOfToday()
  const next3Days = addDays(today, 3)

  let overdue = 0
  let upcoming = 0

  records.forEach((record) => {
    if (!record.date) return
    const dateStr = String(record.date).split('T')[0].split(' ')[0]
    const date = parseISO(dateStr)
    if (isBefore(date, today)) {
      overdue++
    } else if (isWithinInterval(date, { start: today, end: next3Days })) {
      upcoming++
    }
  })

  if (overdue === 0 && upcoming === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {overdue > 0 && (
        <Alert
          variant="destructive"
          className="bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-200 border-red-200 dark:border-red-900 animate-fade-in"
        >
          <AlertCircle className="h-5 w-5 !text-red-600 dark:!text-red-400" />
          <AlertTitle className="font-semibold text-red-800 dark:text-red-300">
            Atenção: Vencimentos Atrasados
          </AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-400 mt-1">
            Você tem <strong>{overdue}</strong> lançamento{overdue > 1 ? 's' : ''} pendente
            {overdue > 1 ? 's' : ''} e atrasado{overdue > 1 ? 's' : ''}.
          </AlertDescription>
        </Alert>
      )}

      {upcoming > 0 && (
        <Alert className="bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-900 animate-fade-in">
          <AlertTriangle className="h-5 w-5 !text-amber-600 dark:!text-amber-400" />
          <AlertTitle className="font-semibold text-amber-800 dark:text-amber-300">
            Próximos Vencimentos
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400 mt-1">
            Você tem <strong>{upcoming}</strong> lançamento{upcoming > 1 ? 's' : ''} pendente
            {upcoming > 1 ? 's' : ''} vencendo nos próximos 3 dias.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
