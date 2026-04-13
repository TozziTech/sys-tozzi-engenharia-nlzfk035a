import { useState, useMemo } from 'react'
import {
  FilterX,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  MoreHorizontal,
  Pencil,
  Trash2,
  Download,
  FileText,
  Paperclip,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import useProjectStore from '@/stores/useProjectStore'
import { useFinancialCategories } from '@/hooks/use-financial-categories'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { exportFinancialCSV } from '@/lib/export'
import { exportFinancialPDF } from '@/lib/exportPdf'
import { EditTransactionModal } from './EditTransactionModal'

export function FinancialTransactions() {
  const { projects, transactions } = useProjectStore()
  const { categories } = useFinancialCategories()
  const { user } = useAuth()

  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [editTx, setEditTx] = useState<any>(null)
  const [deleteTx, setDeleteTx] = useState<any>(null)

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        const pId = tx.projectId || (tx as any).project_id
        if (selectedProject !== 'all' && pId !== selectedProject) return false
        if (selectedType !== 'all' && tx.type !== selectedType) return false
        return true
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, selectedProject, selectedType])

  const clearFilters = () => {
    setSelectedProject('all')
    setSelectedType('all')
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

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full sm:w-[250px] bg-white dark:bg-slate-950">
              <SelectValue placeholder="Filtrar por Projeto" />
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
            <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-slate-950">
              <SelectValue placeholder="Filtrar por Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="Entrada">Entrada</SelectItem>
              <SelectItem value="Saída">Saída</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={selectedProject === 'all' && selectedType === 'all'}
          >
            <FilterX className="h-4 w-4 mr-2" /> Limpar
          </Button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
          <Button variant="outline" onClick={exportPDF}>
            <FileText className="h-4 w-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operações e Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden bg-white dark:bg-slate-950">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor (R$)</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]">Anexo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                      Nenhuma transação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => {
                    const cId = tx.categoryId || (tx as any).category
                    const pId = tx.projectId || (tx as any).project_id
                    const cat = categories.find((c) => c.id === cId || c.name === cId)
                    const projName =
                      pId === 'tozzi_interno'
                        ? 'TOZZI (Interno)'
                        : projects.find((p) => p.id === pId)?.name || 'TOZZI (Interno)'
                    return (
                      <TableRow
                        key={tx.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {tx.description}
                            {(tx as any).is_recurring && (
                              <Repeat className="h-4 w-4 text-slate-400" title="Recorrente" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {cat ? (
                            <Badge
                              variant="outline"
                              style={{ borderColor: cat.color, color: cat.color }}
                            >
                              {cat.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500 border-slate-300">
                              Sem categoria
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {tx.type === 'Entrada' ? (
                            <span className="text-emerald-600 inline-flex items-center font-medium">
                              <ArrowUpRight className="mr-1 h-4 w-4" /> Entrada
                            </span>
                          ) : (
                            <span className="text-rose-600 inline-flex items-center font-medium">
                              <ArrowDownRight className="mr-1 h-4 w-4" /> Saída
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(tx.value || (tx as any).amount || 0)}
                        </TableCell>
                        <TableCell>{new Date(tx.date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">
                          {projName}
                        </TableCell>
                        <TableCell>
                          {tx.status === 'Pago' ? (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
                              Pago
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-amber-600 border-amber-500 dark:text-amber-400"
                            >
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {tx.attachment && (
                            <Button variant="ghost" size="icon" asChild title="Ver Anexo">
                              <a
                                href={pb.files.getURL(
                                  {
                                    id: tx.id,
                                    collectionId: (tx as any).collectionId || 'financial_records',
                                  } as any,
                                  tx.attachment,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Paperclip className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditTx(tx)}>
                                <Pencil className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteTx(tx)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <EditTransactionModal
        transaction={editTx}
        open={!!editTx}
        onOpenChange={(o) => !o && setEditTx(null)}
      />

      <AlertDialog open={!!deleteTx} onOpenChange={(o) => !o && setDeleteTx(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Transação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita e todos
              os relatórios serão atualizados.
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
