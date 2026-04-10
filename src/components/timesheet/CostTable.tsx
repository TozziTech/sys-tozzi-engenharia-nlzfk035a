import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import useProjectStore from '@/stores/useProjectStore'
import { cn } from '@/lib/utils'

export function CostTable() {
  const { projects } = useProjectStore()

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
              const spent = p.spent || 0
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
