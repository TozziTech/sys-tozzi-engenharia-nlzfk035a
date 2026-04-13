import { useState, useMemo } from 'react'
import { FilterX, ArrowUpRight, ArrowDownRight, Repeat } from 'lucide-react'
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
import useProjectStore from '@/stores/useProjectStore'
import { useFinancialCategories } from '@/hooks/use-financial-categories'

export function FinancialTransactions() {
  const { projects, transactions } = useProjectStore()
  const { categories } = useFinancialCategories()

  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (selectedProject !== 'all' && tx.projectId !== selectedProject) return false
        if (selectedType !== 'all' && tx.type !== selectedType) return false
        return true
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, selectedProject, selectedType])

  const clearFilters = () => {
    setSelectedProject('all')
    setSelectedType('all')
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
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
          className="w-full sm:w-auto bg-white dark:bg-slate-950"
          disabled={selectedProject === 'all' && selectedType === 'all'}
        >
          <FilterX className="h-4 w-4 mr-2" /> Limpar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operações e Histórico</CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Lista de todas as transações de acordo com os filtros.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      Nenhuma transação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => {
                    const cat = categories.find((c) => c.id === tx.categoryId)
                    const projName =
                      tx.projectId === 'tozzi_interno'
                        ? 'TOZZI (Interno)'
                        : projects.find((p) => p.id === tx.projectId)?.name || 'TOZZI (Interno)'
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
                          {tx.type === 'Saída' && cat ? (
                            <Badge
                              variant="outline"
                              style={{ borderColor: cat.color, color: cat.color }}
                            >
                              {cat.name}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {tx.type === 'Entrada' ? (
                            <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                              <ArrowUpRight className="mr-1 h-4 w-4" /> Entrada
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-rose-600 dark:text-rose-400 font-medium">
                              <ArrowDownRight className="mr-1 h-4 w-4" /> Saída
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(tx.value)}</TableCell>
                        <TableCell>{formatDate(tx.date)}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300">
                          {projName}
                        </TableCell>
                        <TableCell>
                          {tx.status === 'Pago' ? (
                            <Badge
                              variant="default"
                              className="bg-emerald-500 hover:bg-emerald-600 border-transparent text-white"
                            >
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
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
