import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2, History } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

interface Props {
  history: any[]
  onDelete: (id: string) => void
}

export function DistributionHistoryTable({ history, onDelete }: Props) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <Card className="border-border/50 shadow-sm mt-6 w-full animate-fade-in-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Histórico de Lançamentos
        </CardTitle>
        <CardDescription>Listagem de todas as distribuições calculadas e salvas.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        <div className="rounded-md border border-border/50 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px] whitespace-nowrap">Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right whitespace-nowrap">Total Bruto</TableHead>
                <TableHead className="text-right whitespace-nowrap">NF (R$)</TableHead>
                <TableHead className="text-right whitespace-nowrap">ART (R$)</TableHead>
                <TableHead className="text-right whitespace-nowrap">Despesas</TableHead>
                <TableHead className="text-right whitespace-nowrap">Cap. Giro</TableHead>
                <TableHead className="text-right whitespace-nowrap">Líquido</TableHead>
                <TableHead className="text-right text-emerald-600 dark:text-emerald-500 whitespace-nowrap">
                  Samuel
                </TableHead>
                <TableHead className="text-right text-blue-600 dark:text-blue-500 whitespace-nowrap">
                  Tozzi
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                    Nenhum histórico de distribuição encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((item) => {
                  const grossProfit =
                    item.total_amount -
                    (item.expenses || 0) -
                    (item.art_amount || 0) -
                    (item.nf_amount || 0)
                  const cgAmount =
                    grossProfit > 0 ? grossProfit * ((item.working_capital_pct || 0) / 100) : 0

                  return (
                    <TableRow key={item.id} className="group transition-colors">
                      <TableCell className="whitespace-nowrap font-medium text-muted-foreground">
                        {format(new Date(item.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell
                        className="font-medium max-w-[200px] truncate"
                        title={item.description}
                      >
                        {item.description}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                        {formatCurrency(item.total_amount)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                        {formatCurrency(item.nf_amount || 0)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                        {formatCurrency(item.art_amount || 0)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                        {formatCurrency(item.expenses || 0)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                        {formatCurrency(cgAmount)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap font-medium">
                        {formatCurrency(item.net_value)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-emerald-600 dark:text-emerald-500 font-semibold">
                        {formatCurrency(item.samuel_amount)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-blue-600 dark:text-blue-500 font-semibold">
                        {formatCurrency(item.tozzi_amount)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
