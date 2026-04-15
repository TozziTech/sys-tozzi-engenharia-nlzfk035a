import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  getDistributionCalculations,
  createDistributionCalculation,
  deleteDistributionCalculation,
  type DistributionCalculation,
} from '@/services/distribution_calculations'
import { useRealtime } from '@/hooks/use-realtime'
import { Trash2, Calculator, Edit2, FileText, Download, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { DistributionChart } from './DistributionChart'
import { EditDistributionDialog } from './EditDistributionDialog'
import { exportDistributionCSV } from '@/lib/export'
import { exportDistributionPDF } from '@/lib/exportPdf'
import { useAuth } from '@/hooks/use-auth'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { useMemo } from 'react'

export function DistributionCalculator() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [allHistory, setAllHistory] = useState<DistributionCalculation[]>([])
  const [editingRecord, setEditingRecord] = useState<DistributionCalculation | null>(null)
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null)

  const [filterYear, setFilterYear] = useState<string>('all')
  const [filterMonth, setFilterMonth] = useState<string>('all')

  const [description, setDescription] = useState('')
  const [totalAmount, setTotalAmount] = useState<number | ''>('')
  const [workingCapitalPct, setWorkingCapitalPct] = useState<number | ''>(10)
  const [expenses, setExpenses] = useState<number | ''>(0)
  const [samuelPct, setSamuelPct] = useState<number | ''>(50)
  const [tozziPct, setTozziPct] = useState<number | ''>(50)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadHistory = async () => {
    try {
      const data = await getDistributionCalculations()
      setAllHistory(data)
    } catch (error) {
      console.error('Failed to load calculations history:', error)
    }
  }

  const history = useMemo(() => {
    return allHistory.filter((record) => {
      if (filterYear === 'all') return true
      const date = new Date(record.date || record.created)
      const recordYear = date.getFullYear().toString()
      const recordMonth = (date.getMonth() + 1).toString()

      if (filterYear !== recordYear) return false
      if (filterMonth !== 'all' && filterMonth !== recordMonth) return false
      return true
    })
  }, [allHistory, filterYear, filterMonth])

  useEffect(() => {
    loadHistory()
  }, [])

  useRealtime('distribution_calculations', () => {
    loadHistory()
  })

  const safeTotal = Number(totalAmount) || 0
  const safeCapitalPct = Number(workingCapitalPct) || 0
  const safeExpenses = Number(expenses) || 0
  const safeSamuelPct = Number(samuelPct) || 0
  const safeTozziPct = Number(tozziPct) || 0

  const netValue = safeTotal - safeTotal * (safeCapitalPct / 100) - safeExpenses
  const samuelAmount = netValue * (safeSamuelPct / 100)
  const tozziAmount = netValue * (safeTozziPct / 100)

  const handleSave = async () => {
    if (!description || safeTotal <= 0) {
      toast({
        title: 'Erro de Validação',
        description: 'Preencha a descrição e um valor total maior que zero.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)
      await createDistributionCalculation({
        description,
        total_amount: safeTotal,
        working_capital_pct: safeCapitalPct,
        expenses: safeExpenses,
        samuel_pct: safeSamuelPct,
        tozzi_pct: safeTozziPct,
        net_value: netValue,
        samuel_amount: samuelAmount,
        tozzi_amount: tozziAmount,
        date: new Date().toISOString(),
      })

      toast({
        title: 'Cálculo Registrado',
        description: 'A distribuição foi salva no histórico com sucesso.',
      })
      setDescription('')
      setTotalAmount('')
      setExpenses(0)
    } catch (error) {
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar o cálculo de distribuição.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!recordToDelete) return
    try {
      await deleteDistributionCalculation(recordToDelete)
      toast({ title: 'Registro excluído com sucesso.' })
      // Update local state to remove the item immediately
      setAllHistory((prev) => prev.filter((r) => r.id !== recordToDelete))
    } catch (error) {
      toast({
        title: 'Erro ao excluir registro. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setRecordToDelete(null)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Calculadora
            </CardTitle>
            <CardDescription>
              Insira os valores para calcular a distribuição líquida de lucros.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Descrição</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Lucro Projeto ABC"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Total Bruto (R$)</Label>
                <Input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Capital de Giro (%)</Label>
                <Input
                  type="number"
                  value={workingCapitalPct}
                  onChange={(e) =>
                    setWorkingCapitalPct(e.target.value ? Number(e.target.value) : '')
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Despesas Dedutíveis (R$)</Label>
                <Input
                  type="number"
                  value={expenses}
                  onChange={(e) => setExpenses(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Participação Samuel (%)</Label>
                <Input
                  type="number"
                  value={samuelPct}
                  onChange={(e) => setSamuelPct(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
              <div className="space-y-2">
                <Label>Participação Tozzi (%)</Label>
                <Input
                  type="number"
                  value={tozziPct}
                  onChange={(e) => setTozziPct(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/20">
          <CardHeader className="bg-primary/5 pb-4">
            <CardTitle>Resumo da Distribuição</CardTitle>
            <CardDescription>Resultado calculado em tempo real</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">Valor Líquido Partilhável</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(netValue)}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50">
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  Samuel ({safeSamuelPct}%)
                </span>
                <span className="font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(samuelAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                <span className="font-medium text-emerald-900 dark:text-emerald-100">
                  Tozzi ({safeTozziPct}%)
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(tozziAmount)}
                </span>
              </div>
            </div>
            <Button className="w-full mt-4" size="lg" onClick={handleSave} disabled={isSubmitting}>
              Registrar Lançamento
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-muted/30 p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm text-muted-foreground">Filtrar Período:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={filterYear}
            onValueChange={(val) => {
              setFilterYear(val)
              if (val === 'all') setFilterMonth('all')
            }}
          >
            <SelectTrigger className="w-[130px] bg-background">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Anos</SelectItem>
              {Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString()).map(
                (y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          <Select
            value={filterMonth}
            onValueChange={setFilterMonth}
            disabled={filterYear === 'all'}
          >
            <SelectTrigger className="w-[150px] bg-background">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Meses</SelectItem>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date(2000, i, 1)
                return {
                  value: (i + 1).toString(),
                  label: date.toLocaleString('pt-BR', { month: 'long' }),
                }
              }).map((m) => (
                <SelectItem key={m.value} value={m.value} className="capitalize">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(filterYear !== 'all' || filterMonth !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterYear('all')
                setFilterMonth('all')
              }}
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      <DistributionChart data={history} />

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Histórico de Cálculos</CardTitle>
            <CardDescription>
              Registro de todas as distribuições e partilhas realizadas
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportDistributionCSV(history)}>
              <FileText className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportDistributionPDF(history, user?.name || 'Usuário')}
            >
              <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="whitespace-nowrap">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Valor Bruto</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Valor Líquido</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Samuel (R$)</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Tozzi (R$)</TableHead>
                  <TableHead className="text-right whitespace-nowrap w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum dado encontrado para este período.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(record.date || record.created), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">{record.description}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatCurrency(record.total_amount)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatCurrency(record.net_value)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600 dark:text-blue-400 font-semibold whitespace-nowrap">
                        {formatCurrency(record.samuel_amount)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                        {formatCurrency(record.tozzi_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingRecord(record)}
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4 opacity-70 hover:opacity-100" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRecordToDelete(record.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-destructive opacity-70 hover:opacity-100" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EditDistributionDialog
        record={editingRecord}
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        onSaved={loadHistory}
      />

      <AlertDialog
        open={!!recordToDelete}
        onOpenChange={(open) => !open && setRecordToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
