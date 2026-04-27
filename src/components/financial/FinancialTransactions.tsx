import { useState, useMemo, useEffect } from 'react'
import { FilterX, Download, FileText, CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import useProjectStore from '@/stores/useProjectStore'
import { useFinancialCategories } from '@/hooks/use-financial-categories'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { exportFinancialCSV } from '@/lib/export'
import { exportFinancialPDF } from '@/lib/exportPdf'
import { EditTransactionModal } from './EditTransactionModal'
import { FinancialOverview } from './FinancialOverview'
import { TransactionTable } from './TransactionTable'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'

export function FinancialTransactions() {
  const { projects, transactions } = useProjectStore()
  const { categories } = useFinancialCategories()
  const { user } = useAuth()
  const { canWrite } = usePermissions()
  const canWriteFinance = canWrite('lancamentos_financeiros') || user?.role === 'Administrador'

  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedRecurrence, setSelectedRecurrence] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [editTx, setEditTx] = useState<any>(null)
  const [deleteTx, setDeleteTx] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    pb.collection('users').getFullList({ sort: 'name' }).then(setUsers).catch(console.error)
  }, [])

  const filteredTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return []
    return transactions
      .filter((tx) => {
        const pId = tx.projectId || (tx as any).project_id
        if (selectedProject !== 'all' && pId !== selectedProject) return false
        if (selectedType !== 'all' && tx.type !== selectedType) return false
        if (selectedStatus !== 'all' && tx.status !== selectedStatus) return false

        if (selectedRecurrence === 'recurring' && !tx.is_recurring) return false
        if (selectedRecurrence === 'one-off' && tx.is_recurring) return false

        if (dateRange?.from) {
          const txDate = new Date(tx.date)
          txDate.setHours(0, 0, 0, 0)
          const fromDate = new Date(dateRange.from)
          fromDate.setHours(0, 0, 0, 0)
          if (txDate < fromDate) return false
        }
        if (dateRange?.to) {
          const txDate = new Date(tx.date)
          txDate.setHours(0, 0, 0, 0)
          const toDate = new Date(dateRange.to)
          toDate.setHours(23, 59, 59, 999)
          if (txDate > toDate) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, selectedProject, selectedType, selectedStatus, selectedRecurrence, dateRange])

  const clearFilters = () => {
    setSelectedProject('all')
    setSelectedType('all')
    setSelectedStatus('all')
    setSelectedRecurrence('all')
    setDateRange(undefined)
  }

  const handleDelete = async () => {
    if (!deleteTx) return
    try {
      await pb.collection('financial_records').delete(deleteTx.id)
      setDeleteTx(null)
    } catch (err) {
      console.error(err)
    }
  }

  const exportCSV = () => exportFinancialCSV(filteredTransactions, 'Filtrado')
  const exportPDF = () => {
    const totals = filteredTransactions.reduce(
      (acc, tx) => {
        const val = tx.value || (tx as any).amount || 0
        if (tx.type === 'Entrada') acc.revenue += val
        else acc.expenses += val
        acc.balance = acc.revenue - acc.expenses
        return acc
      },
      { revenue: 0, expenses: 0, balance: 0 },
    )
    exportFinancialPDF(filteredTransactions, totals, 'Filtrado', user?.name || 'Usuário')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <FinancialOverview transactions={filteredTransactions} categories={categories} />

      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap gap-4 w-full xl:w-auto items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full sm:w-[260px] justify-start text-left font-normal bg-white dark:bg-slate-950',
                  !dateRange && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
                    </>
                  ) : (
                    format(dateRange.from, 'dd/MM/yyyy')
                  )
                ) : (
                  <span>Filtrar por data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full sm:w-[200px] bg-white dark:bg-slate-950">
              <SelectValue placeholder="Projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Projetos</SelectItem>
              <SelectItem value="tozzi_interno">TOZZI (Interno)</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-[160px] bg-white dark:bg-slate-950">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="Entrada">Entrada</SelectItem>
              <SelectItem value="Saída">Saída</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[160px] bg-white dark:bg-slate-950">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Pago">Pago</SelectItem>
              <SelectItem value="Atrasado">Atrasado</SelectItem>
              <SelectItem value="Cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedRecurrence} onValueChange={setSelectedRecurrence}>
            <SelectTrigger className="w-full sm:w-[160px] bg-white dark:bg-slate-950">
              <SelectValue placeholder="Recorrência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="recurring">Recorrentes</SelectItem>
              <SelectItem value="one-off">Eventuais</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            onClick={clearFilters}
            disabled={
              selectedProject === 'all' &&
              selectedType === 'all' &&
              selectedStatus === 'all' &&
              selectedRecurrence === 'all' &&
              !dateRange
            }
            className="text-slate-500"
          >
            <FilterX className="h-4 w-4 mr-2" /> Limpar
          </Button>
        </div>
        <div className="flex gap-2 w-full xl:w-auto">
          <Button variant="outline" onClick={exportCSV} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
          <Button variant="outline" onClick={exportPDF} className="w-full sm:w-auto">
            <FileText className="h-4 w-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operações e Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={filteredTransactions}
            categories={categories}
            projects={projects}
            users={users}
            onEdit={(tx) => canWriteFinance && setEditTx(tx)}
            onDelete={(tx) => canWriteFinance && setDeleteTx(tx)}
          />
        </CardContent>
      </Card>

      {canWriteFinance && (
        <EditTransactionModal
          transaction={editTx}
          open={!!editTx}
          onOpenChange={(o) => !o && setEditTx(null)}
        />
      )}

      <AlertDialog open={!!deleteTx} onOpenChange={(o) => !o && setDeleteTx(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
