import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockProjectMetrics } from '@/data/mockTimesheetData'
import { cn } from '@/lib/utils'

export function CostTable() {
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
              <TableHead className="text-right">Estimado</TableHead>
              <TableHead className="text-right">Realizado</TableHead>
              <TableHead className="text-right">Diferença</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockProjectMetrics.map((p) => {
              const diff = p.estimatedCost - p.realCost
              const isOverBudget = diff < 0
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.estimatedCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.realCost)}</TableCell>
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
