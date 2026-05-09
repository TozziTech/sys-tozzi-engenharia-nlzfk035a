import { useState, useEffect, Fragment, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { getServicos, deleteServico, type ServicoFinanceiro } from '@/services/servicos_financeiros'
import { ServicoModal } from './ServicoModal'
import { ExpandedPaymentRow } from '@/components/meu-painel/ExpandedPaymentRow'
import { useRealtime } from '@/hooks/use-realtime'
import { Trash2, ChevronDown, ChevronRight, Search, FilterX } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
} from 'date-fns'

export function ServicosList() {
  const [servicos, setServicos] = useState<ServicoFinanceiro[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const { user } = useAuth()

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [periodFilter, setPeriodFilter] = useState('Todos')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadData = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      let fromDate = undefined
      let toDate = undefined
      const now = new Date()

      if (periodFilter === 'Semana') {
        fromDate = format(startOfWeek(now, { weekStartsOn: 0 }), "yyyy-MM-dd 00:00:00.000'Z'")
        toDate = format(endOfWeek(now, { weekStartsOn: 0 }), "yyyy-MM-dd 23:59:59.999'Z'")
      } else if (periodFilter === 'Mês') {
        fromDate = format(startOfMonth(now), "yyyy-MM-dd 00:00:00.000'Z'")
        toDate = format(endOfMonth(now), "yyyy-MM-dd 23:59:59.999'Z'")
      } else if (periodFilter === 'Ano') {
        fromDate = format(startOfYear(now), "yyyy-MM-dd 00:00:00.000'Z'")
        toDate = format(endOfYear(now), "yyyy-MM-dd 23:59:59.999'Z'")
      }

      const data = await getServicos({
        userId: user.id,
        search: debouncedSearch,
        status: statusFilter,
        fromDate,
        toDate,
      })

      setServicos(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, debouncedSearch, statusFilter, periodFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('servicos_financeiros', () => {
    loadData()
  })

  const handleDelete = async (id: string) => {
    try {
      await deleteServico(id)
      toast({ title: 'Sucesso', description: 'Lançamento excluído com sucesso.' })
      setServicos((prev) => prev.filter((s) => s.id !== id))
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao excluir lançamento.', variant: 'destructive' })
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'Em Andamento':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'Cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    }
  }

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('Todos')
    setPeriodFilter('Todos')
  }

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'Todos' || periodFilter !== 'Todos'

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle>Serviços Financeiros</CardTitle>
        <ServicoModal />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente ou serviço..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Status</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Concluído">Concluído</SelectItem>
              <SelectItem value="Cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Tempos</SelectItem>
              <SelectItem value="Semana">Esta Semana</SelectItem>
              <SelectItem value="Mês">Este Mês</SelectItem>
              <SelectItem value="Ano">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              className="px-3 md:px-4"
              onClick={clearFilters}
              title="Limpar Filtros"
            >
              <FilterX className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Limpar</span>
            </Button>
          )}
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Serviço/Projeto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && servicos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : servicos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
                    Nenhum lançamento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                servicos.map((servico) => (
                  <Fragment key={servico.id}>
                    <TableRow className={expandedRows.has(servico.id) ? 'bg-muted/30' : ''}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleRow(servico.id)}
                        >
                          {expandedRows.has(servico.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {servico.codigo}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {servico.expand?.project_ref?.name || servico.projeto_servico || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{servico.cliente || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(servico.data_inicio).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={getStatusColor(servico.status)} variant="outline">
                          {servico.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap font-medium">
                        {formatCurrency(servico.valor_total)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 justify-end">
                          <ServicoModal servico={servico} />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este lançamento? Esta ação não pode
                                  ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(servico.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Confirmar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(servico.id) && (
                      <TableRow>
                        <TableCell colSpan={8} className="p-0 border-b bg-muted/10">
                          <ExpandedPaymentRow servico={servico} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
