import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trash2, History, Edit, FileText, Download } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { exportDistributionCSV } from '@/lib/export'
import { exportDistributionPDF } from '@/lib/exportPdf'
import { useAuth } from '@/hooks/use-auth'

interface Props {
  history: any[]
  onDelete: (id: string) => void
  onEdit: (record: any) => void
}

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function DistributionHistoryTable({ history, onDelete, onEdit }: Props) {
  const { user } = useAuth()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')

  const availableYears = useMemo(() => {
    const years = new Set(history.map((item) => new Date(item.date).getFullYear()))
    return Array.from(years).sort((a, b) => b - a)
  }, [history])

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const date = new Date(item.date)
      const monthMatch = selectedMonth === 'all' || date.getMonth().toString() === selectedMonth
      const yearMatch = selectedYear === 'all' || date.getFullYear().toString() === selectedYear
      return monthMatch && yearMatch
    })
  }, [history, selectedMonth, selectedYear])

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const handleExportCSV = () => {
    exportDistributionCSV(filteredHistory)
  }

  const handleExportPDF = () => {
    exportDistributionPDF(filteredHistory, user?.name || user?.email || 'Usuário')
  }

  return (
    <>
      <Card className="border-border/50 shadow-sm mt-6 w-full animate-fade-in-up">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-primary" />
              Histórico de Lançamentos
            </CardTitle>
            <CardDescription>
              Listagem de todas as distribuições calculadas e salvas.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {MONTHS.map((month, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px] bg-background">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-10">
                  <Download className="h-4 w-4" />
                  Exportar Relatório
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  Exportar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
                  <TableHead className="w-[100px] text-center whitespace-nowrap sticky right-0 bg-muted/50 backdrop-blur-md z-10 shadow-[-1px_0_0_hsl(var(--border)/0.5)]">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                      Nenhum histórico de distribuição encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((item) => {
                    const cgAmount = item.total_amount * ((item.working_capital_pct || 0) / 100)

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
                        <TableCell className="sticky right-0 bg-background/95 backdrop-blur-md group-hover:bg-muted/50 transition-colors z-10 shadow-[-1px_0_0_hsl(var(--border)/0.5)]">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(item)}
                              className="h-8 w-8 text-primary hover:bg-primary/10 transition-all"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(item.id)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-all"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId)
                  setDeleteId(null)
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
