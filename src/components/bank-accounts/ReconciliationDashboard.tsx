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
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  getAccountTransactions,
  toggleReconciledStatus,
  type FinancialRecord,
} from '@/services/reconciliation'
import { type BankAccount } from '@/services/bank_accounts'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { ArrowDownRight, ArrowUpRight, Download, FileText } from 'lucide-react'
import { exportFinancialCSV } from '@/lib/export'
import { exportFinancialPDF } from '@/lib/exportPdf'
import { useAuth } from '@/hooks/use-auth'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: BankAccount
  settings?: any
}

export function ReconciliationDashboard({ open, onOpenChange, account, settings }: Props) {
  const [transactions, setTransactions] = useState<FinancialRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending'>('all')
  const { toast } = useToast()
  const { user } = useAuth()

  const loadTransactions = async () => {
    if (!account.id) return
    setIsLoading(true)
    try {
      const data = await getAccountTransactions(account.id)
      setTransactions(data)
    } catch (error) {
      toast({ title: 'Erro ao carregar transações', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadTransactions()
    }
  }, [open, account.id])

  useRealtime('financial_records', () => {
    if (open) loadTransactions()
  })

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, reconciled: !currentStatus } : t)),
      )
      await toggleReconciledStatus(id, !currentStatus)
    } catch (error) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, reconciled: currentStatus } : t)),
      )
      toast({ title: 'Erro ao atualizar status.', variant: 'destructive' })
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const { reconciledBalance, totalReconciled, totalTransactions } = useMemo(() => {
    let balance = 0
    let count = 0
    transactions.forEach((t) => {
      if (t.reconciled) {
        count++
        if (t.type === 'Entrada') balance += t.amount
        else balance -= t.amount
      }
    })
    return {
      reconciledBalance: balance,
      totalReconciled: count,
      totalTransactions: transactions.length,
    }
  }, [transactions])

  const discrepancy = account.balance - reconciledBalance

  const filteredTransactions = useMemo(() => {
    if (filter === 'pending') return transactions.filter((t) => !t.reconciled)
    return transactions
  }, [transactions, filter])

  const handleExportCSV = () => {
    const label = filter === 'pending' ? 'Pendentes' : 'Todas'
    exportFinancialCSV(filteredTransactions, `Conciliação_${account.name}_${label}`)
  }

  const handleExportPDF = () => {
    const label = filter === 'pending' ? 'Pendentes' : 'Todas'
    const totals = filteredTransactions.reduce(
      (acc, tx) => {
        if (tx.type === 'Entrada') acc.revenue += tx.amount
        else acc.expenses += tx.amount
        acc.balance = acc.revenue - acc.expenses
        return acc
      },
      { revenue: 0, expenses: 0, balance: 0 },
    )
    exportFinancialPDF(
      filteredTransactions,
      totals,
      `Conciliação ${account.name} - ${label}`,
      user?.name || 'Usuário',
      settings,
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-hidden flex flex-col p-0">
        <div className="p-6 pb-4 border-b">
          <SheetHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <SheetTitle className="text-2xl flex items-center gap-2">
                  Conciliação Bancária
                  {account.code && (
                    <Badge variant="outline" className="ml-2 font-mono">
                      {account.code}
                    </Badge>
                  )}
                </SheetTitle>
                <SheetDescription>
                  Acompanhe e concilie todas as transações da conta <strong>{account.name}</strong>{' '}
                  ({account.bank_name}).
                </SheetDescription>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="mr-2 h-4 w-4" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <FileText className="mr-2 h-4 w-4" /> PDF
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-lg border bg-card">
              <div className="text-sm font-medium text-muted-foreground mb-1">Saldo no Sistema</div>
              <div className="text-2xl font-bold">{formatCurrency(account.balance)}</div>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center justify-between">
                Saldo Conciliado
                <span className="text-xs font-normal bg-muted px-2 py-0.5 rounded-full">
                  {totalReconciled} de {totalTransactions}
                </span>
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                {formatCurrency(reconciledBalance)}
              </div>
            </div>
            <div
              className={`p-4 rounded-lg border ${Math.abs(discrepancy) > 0.01 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50' : 'bg-card'}`}
            >
              <div className="text-sm font-medium text-muted-foreground mb-1">Diferença</div>
              <div
                className={`text-2xl font-bold ${Math.abs(discrepancy) > 0.01 ? 'text-amber-600 dark:text-amber-500' : 'text-muted-foreground'}`}
              >
                {formatCurrency(discrepancy)}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pb-0 flex justify-between items-center border-b">
          <Tabs
            defaultValue="all"
            value={filter}
            onValueChange={(v) => setFilter(v as 'all' | 'pending')}
            className="w-full max-w-sm mb-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 pt-4">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[100px]">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[120px] text-center">Conciliado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Carregando transações...
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma transação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => (
                    <TableRow key={tx.id} className={tx.reconciled ? 'bg-muted/30' : ''}>
                      <TableCell className="whitespace-nowrap">
                        {tx.date
                          ? new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                          : '-'}
                      </TableCell>
                      <TableCell className="font-medium">{tx.description}</TableCell>
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
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Switch
                            checked={tx.reconciled}
                            onCheckedChange={() => handleToggle(tx.id, tx.reconciled)}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
