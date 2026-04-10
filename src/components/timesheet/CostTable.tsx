import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useState, useEffect } from 'react'
import useProjectStore from '@/stores/useProjectStore'
import { cn } from '@/lib/utils'

export function CostTable() {
  const { projects, timeLogs } = useProjectStore()
  const [dbSpent, setDbSpent] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchApprovedCosts = async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        const { data, error } = await supabase
          .from('time_entries')
          .select('project_id, hours')
          .eq('status', 'Approved')

        if (error) throw error

        if (data) {
          const costs: Record<string, number> = {}
          const HOURLY_RATE = 150
          data.forEach((entry) => {
            costs[entry.project_id] = (costs[entry.project_id] || 0) + entry.hours * HOURLY_RATE
          })
          setDbSpent(costs)
        }
      } catch (err) {
        const costs: Record<string, number> = {}
        const HOURLY_RATE = 150
        timeLogs
          ?.filter((log) => log.status === 'Approved')
          .forEach((log) => {
            costs[log.projectId] = (costs[log.projectId] || 0) + log.hours * HOURLY_RATE
          })
        setDbSpent(costs)
      }
    }

    fetchApprovedCosts()
  }, [timeLogs])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise Financeira</CardTitle>
        <CardDescription>Custo real (horas lançadas) vs. Orçamento estimado.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projeto</TableHead>
              <TableHead className="text-right">Orçamento</TableHead>
              <TableHead className="text-right">Realizado</TableHead>
              <TableHead className="text-right">Diferença</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => {
              const budget = p.budget || 0
              const spent = dbSpent[p.id] !== undefined ? dbSpent[p.id] : p.spent || 0
              const diff = budget - spent
              const isOverBudget = diff < 0
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(budget)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(spent)}</TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium',
                      isOverBudget ? 'text-destructive' : 'text-emerald-500',
                    )}
                  >
                    {isOverBudget ? '-' : '+'}
                    {formatCurrency(Math.abs(diff))}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
