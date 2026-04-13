import { useEffect, useState, useMemo } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getPendingReconciliations, type FinancialRecord } from '@/services/reconciliation'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { ArrowDownRight, ArrowUpRight, Download, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportFinancialCSV } from '@/lib/export'
import { exportFinancialPDF } from '@/lib/exportPdf'
import { useAuth } from '@/hooks/use-auth'
import { format } from 'date-fns'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: any
}

export function PendingReconciliationAudit({ open, onOpenChange, settings }: Props) {
  const [transactions, setTransactions] = useState<FinancialRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const loadTransactions = async () => {
    setIsLoading(true)
    try {
      const data = await getPendingReconciliations()
      setTransactions(data)
    } catch (error) {
      toast({ title: 'Erro ao carregar transações pendentes', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) loadTransactions()
  }, [open])

  useRealtime('financial_records', () => {
    if (open) loadTransactions()
  })

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const groupedData = useMemo(() => {
    const groups: Record<string, { transactions: FinancialRecord[]; total: number }> = {}
    transactions.forEach((tx) => {
      const monthYear = format(new Date(tx.date || tx.created), 'MM/yyyy')
      if (!groups[monthYear]) groups[monthYear] = { transactions: [], total: 0 }
      groups[monthYear].transactions.push(tx)
      const amt =
        tx.type === 'Saída' || tx.type === 'Despesa' || tx.amount < 0
          ? -Math.abs(tx.amount)
          : tx.amount
      groups[monthYear].total += amt
    })

    return Object.keys(groups)
      .sort((a, b) => {
        const [mA, yA] = a.split('/')
        const [mB, yB] = b.split('/')
        return (
          new Date(Number(yB), Number(mB) - 1).getTime() -
          new Date(Number(yA), Number(mA) - 1).getTime()
        )
      })
      .map((k) => ({ label: k, ...groups[k] }))
  }, [transactions])

  const totalPending = transactions.length

  const handleExportCSV = () => {
    exportFinancialCSV(transactions, 'Auditoria de Pendências (Todas as Contas)')
  }

  const handleExportPDF = () => {
    const totals = transactions.reduce(
      (acc, tx) => {
        const val = Math.abs(tx.amount)
        if (tx.type === 'Entrada') acc.revenue += val
        else acc.expenses += val
        acc.balance = acc.revenue - acc.expenses
        return acc
      },
      { revenue: 0, expenses: 0, balance: 0 },
    )
    exportFinancialPDF(
      transactions,
      totals,
      'Auditoria de Pendências de Conciliação',
      user?.name || 'Usuário',
      settings,
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-hidden flex flex-col p-0">
        <div className="p-6 pb-4 border-b bg-amber-50/30 dark:bg-amber-950/10">
          <SheetHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <SheetTitle className="text-2xl flex items-center gap-2 text-amber-700 dark:text-amber-500">
                  <AlertCircle className="h-6 w-6" />
                  Auditoria de Pendências
                  <Badge variant="outline" className="ml-2 font-mono bg-background">
                    {totalPending} registros
                  </Badge>
                </SheetTitle>
                <SheetDescription className="mt-1">
                  Transações não conciliadas em todas as contas bancárias agrupadas por mês.
                </SheetDescription>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="bg-background"
                >
                  <Download className="mr-2 h-4 w-4" /> CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  className="bg-background"
                >
                  <FileText className="mr-2 h-4 w-4" /> PDF
                </Button>
              </div>
            </div>
          </SheetHeader>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 pt-0 space-y-8 mt-6">
            {isLoading && transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Carregando dados...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <AlertCircle className="h-10 w-10 mx-auto mb-4 text-muted-foreground/50" />
                Excelente! Não há transações pendentes de conciliação.
              </div>
            ) : (
              groupedData.map((group) => (
                <div key={group.label} className="border rounded-lg overflow-hidden bg-card">
                  <div className="flex items-center justify-between p-4 bg-muted/50 border-b">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      Mês: {group.label}
                      <Badge variant="secondary">{group.transactions.length} registros</Badge>
                    </h3>
                    <div className="text-sm font-medium">
                      Subtotal:{' '}
                      <span className={group.total >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {formatCurrency(group.total)}
                      </span>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[100px]">Data</TableHead>
                        <TableHead>Conta</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-center">Tipo</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.transactions.map((tx) => {
                        const accName =
                          (tx as any).expand?.bank_account?.name || tx.bank_account || '-'
                        const accCode = (tx as any).expand?.bank_account?.code
                          ? `${(tx as any).expand.bank_account.code} - `
                          : ''
                        return (
                          <TableRow key={tx.id}>
                            <TableCell className="whitespace-nowrap">
                              {tx.date
                                ? new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">{accCode}</span>
                              <span className="font-medium">{accName}</span>
                            </TableCell>
                            <TableCell>{tx.description}</TableCell>
                            <TableCell className="text-center">
                              {tx.type === 'Entrada' ? (
                                <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center text-sm font-medium">
                                  <ArrowUpRight className="mr-1 h-3 w-3" /> Entrada
                                </span>
                              ) : (
                                <span className="text-rose-600 dark:text-rose-400 inline-flex items-center text-sm font-medium">
                                  <ArrowDownRight className="mr-1 h-3 w-3" /> Saída
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(tx.amount)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
