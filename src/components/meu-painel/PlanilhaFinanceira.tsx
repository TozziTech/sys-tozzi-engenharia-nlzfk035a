import { useState, useEffect, useMemo } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
// import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Edit2,
  Trash2,
  Plus,
  Download,
  DollarSign,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
} from 'lucide-react'
import { useQuery } from '@/hooks/use-query'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { ExpandedPaymentRow } from './ExpandedPaymentRow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { exportPlanilhaCSV } from '@/lib/export'
import { exportFinancialPlanilhaPDF } from '@/lib/exportPdf'
import { getNextServicoCode, checkServicoCodeExists } from '@/services/servicos_financeiros'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { usePermissions } from '@/hooks/use-permissions'
import { AccessRestricted } from '@/components/auth/AccessRestricted'
import { ClientCombobox } from '@/components/ClientCombobox'

export function PlanilhaFinanceira({ dateRange }: { dateRange?: { from: Date; to: Date } }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { canAccess, canWrite } = usePermissions()

  const canWritePlanilha = canWrite('planilha_financeira') || user?.role === 'Administrador'
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [statusFilter, setStatusFilter] = useState<string>('Todos')
  const [paymentFilter, setPaymentFilter] = useState<string>('Todos')
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const [pagamentosPorServico, setPagamentosPorServico] = useState<Record<string, number>>({})

  const {
    data: servicos = [],
    isLoading: isLoadingServicos,
    refetch: refetchServicos,
  } = useQuery(
    `servicos_${user?.id}`,
    () =>
      pb.collection('servicos_financeiros').getFullList({
        filter: `user_id = "${user?.id}"`,
        sort: '-created',
      }),
    { enabled: !!user },
  )

  const {
    data: pagamentos = [],
    isLoading: isLoadingPagamentos,
    refetch: refetchPagamentos,
  } = useQuery(
    `pagamentos_user_all_${user?.id}`,
    () =>
      pb.collection('pagamentos_servicos').getFullList({
        filter: `servico_id.user_id = "${user?.id}"`,
      }),
    { enabled: !!user },
  )

  const isLoading = isLoadingServicos || isLoadingPagamentos

  // Desativado temporariamente para diagnosticar erro "Maximum update depth exceeded"
  // useRealtime('servicos_financeiros', refetchServicos)
  // useRealtime('pagamentos_servicos', refetchPagamentos)

  const handleSave = async () => {
    if (!formData.codigo || !String(formData.codigo).trim()) {
      toast({ title: 'O código do serviço é obrigatório.', variant: 'destructive' })
      return
    }

    if (!formData.projeto_servico || !String(formData.projeto_servico).trim()) {
      toast({ title: 'A descrição ou projeto do serviço é obrigatória.', variant: 'destructive' })
      return
    }

    if (!formData.data_inicio) {
      toast({ title: 'A data de início é obrigatória.', variant: 'destructive' })
      return
    }

    const valorTotal = Number(formData.valor_total)
    if (
      isNaN(valorTotal) ||
      formData.valor_total === '' ||
      formData.valor_total === undefined ||
      formData.valor_total === null ||
      valorTotal < 0
    ) {
      toast({ title: 'O valor total deve ser um número válido.', variant: 'destructive' })
      return
    }

    try {
      const exists = await checkServicoCodeExists(formData.codigo, formData.id)
      if (exists) {
        toast({
          title: 'Código já utilizado.',
          description: 'Por favor, informe um código único.',
          variant: 'destructive',
        })
        return
      }

      const data = { ...formData, user_id: user?.id, valor_total: valorTotal }
      if (formData.id) {
        await pb.collection('servicos_financeiros').update(formData.id, data)
        toast({ title: 'Serviço atualizado com sucesso!' })
      } else {
        await pb.collection('servicos_financeiros').create(data)
        toast({ title: 'Serviço registrado com sucesso!' })
      }
      setIsOpen(false)
    } catch (e: any) {
      console.error(e)
      toast({
        title: 'Erro ao salvar o serviço',
        description: e?.message || 'Verifique se os dados estão corretos.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        'Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.',
      )
    )
      return
    try {
      await pb.collection('servicos_financeiros').delete(id)
      toast({ title: 'Serviço excluído com sucesso!' })
    } catch (e) {
      toast({ title: 'Erro ao excluir o serviço', variant: 'destructive' })
    }
  }

  const openForm = async (item?: any) => {
    if (item) {
      setFormData(item)
    } else {
      try {
        const nextCode = await getNextServicoCode()
        setFormData({
          codigo: nextCode,
          status: 'Pendente',
          data_inicio: new Date().toISOString().substring(0, 10),
        })
      } catch (error) {
        console.error('Erro ao buscar próximo código:', error)
        setFormData({
          status: 'Pendente',
          data_inicio: new Date().toISOString().substring(0, 10),
        })
        toast({ title: 'Erro ao gerar código automático', variant: 'destructive' })
      }
    }
    setIsOpen(true)
  }

  const pagamentosFiltradosRange = useMemo(() => {
    if (!dateRange) return pagamentos
    return pagamentos.filter((p) => {
      if (!p.data_vencimento) return false
      const d = new Date(p.data_vencimento)
      d.setHours(d.getHours() + 12)
      return d >= dateRange.from && d <= dateRange.to
    })
  }, [pagamentos, dateRange])

  const servicosFiltradosRange = useMemo(() => {
    if (!dateRange) return servicos
    const pgsInRangeIds = new Set(pagamentosFiltradosRange.map((p) => p.servico_id))
    return servicos.filter((s) => {
      if (pgsInRangeIds.has(s.id)) return true
      if (s.data_inicio) {
        const d = new Date(s.data_inicio)
        d.setHours(12)
        return d >= dateRange.from && d <= dateRange.to
      }
      return false
    })
  }, [servicos, dateRange, pagamentosFiltradosRange])

  useEffect(() => {
    const pagamentosMap: Record<string, number> = {}
    pagamentosFiltradosRange.forEach((p: any) => {
      pagamentosMap[p.servico_id] = (pagamentosMap[p.servico_id] || 0) + (p.valor || 0)
    })
    setPagamentosPorServico(pagamentosMap)
  }, [pagamentosFiltradosRange])

  const filteredServicos = servicosFiltradosRange.filter((s) => {
    const statusMatch = statusFilter === 'Todos' || s.status === statusFilter
    const totalPago = pagamentosPorServico[s.id] || 0
    const isFullyPaid = totalPago >= (s.valor_total || 0) && (s.valor_total || 0) > 0

    let paymentMatch = true
    if (paymentFilter === 'Pagos') paymentMatch = isFullyPaid
    if (paymentFilter === 'Pendentes') paymentMatch = !isFullyPaid

    return statusMatch && paymentMatch
  })

  const servicoAlerts = useMemo(() => {
    const alerts: Record<string, { overdue: number; dueSoon: number }> = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const in3Days = new Date(today)
    in3Days.setDate(today.getDate() + 3)

    pagamentos.forEach((p: any) => {
      if (p.status === 'Pendente' && p.data_vencimento) {
        const venc = new Date(p.data_vencimento)
        venc.setHours(12, 0, 0, 0)
        if (!alerts[p.servico_id]) alerts[p.servico_id] = { overdue: 0, dueSoon: 0 }

        if (venc < today) alerts[p.servico_id].overdue++
        else if (venc <= in3Days) alerts[p.servico_id].dueSoon++
      }
    })
    return alerts
  }, [pagamentos])

  const filteredServicosIds = new Set(filteredServicos.map((s) => s.id))
  const filteredPagamentos = pagamentosFiltradosRange.filter((p) =>
    filteredServicosIds.has(p.servico_id),
  )

  const currentMonthPrefix = format(new Date(), 'yyyy-MM')
  const prevMonthPrefix = format(subMonths(new Date(), 1), 'yyyy-MM')

  const totalCurrentMonth = pagamentos
    .filter((p) => p.data_pagamento?.startsWith(currentMonthPrefix))
    .reduce((acc, p) => acc + (p.valor || 0), 0)

  const totalPrevMonth = pagamentos
    .filter((p) => p.data_pagamento?.startsWith(prevMonthPrefix))
    .reduce((acc, p) => acc + (p.valor || 0), 0)

  const growthPercent =
    totalPrevMonth === 0
      ? totalCurrentMonth > 0
        ? 100
        : 0
      : ((totalCurrentMonth - totalPrevMonth) / totalPrevMonth) * 100

  const totalPending = filteredServicos
    .filter((s) => s.status === 'Pendente' || s.status === 'Em Andamento')
    .reduce((acc, s) => acc + (s.valor_total || 0), 0)

  const totalCompleted = filteredServicos
    .filter((s) => s.status === 'Concluído')
    .reduce((acc, s) => acc + (s.valor_total || 0), 0)

  const grandTotal = filteredServicos
    .filter((s) => s.status !== 'Cancelado')
    .reduce((acc, s) => acc + (s.valor_total || 0), 0)

  const clientsMap: Record<string, number> = {}
  filteredServicos.forEach((s) => {
    if (s.status !== 'Cancelado') {
      const clientName = s.cliente || 'Não Informado'
      clientsMap[clientName] = (clientsMap[clientName] || 0) + (s.valor_total || 0)
    }
  })
  const topClients = Object.entries(clientsMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const now = new Date()
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(now, 5 - i)
    return {
      month: format(d, 'yyyy-MM'),
      label: format(d, 'MMM/yy', { locale: ptBR }),
      total: 0,
    }
  })

  pagamentos.forEach((p) => {
    if (!p.data_pagamento) return
    const month = p.data_pagamento.substring(0, 7)
    const monthData = last6Months.find((m) => m.month === month)
    if (monthData) {
      monthData.total += p.valor || 0
    }
  })

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const handleExportCSV = () => {
    exportPlanilhaCSV(filteredServicos, filteredPagamentos)
  }

  const handleExportPDF = async () => {
    let settings = null
    try {
      settings = await pb.collection('company_settings').getFirstListItem('')
    } catch {
      /* intentionally ignored */
    }

    const periodLabel = dateRange
      ? `${format(dateRange.from, 'dd/MM/yyyy')} a ${format(dateRange.to, 'dd/MM/yyyy')}`
      : 'Todos os tempos'
    exportFinancialPlanilhaPDF(
      filteredServicos,
      filteredPagamentos,
      user?.name || '',
      settings,
      periodLabel,
    )
  }

  if (!canAccess('planilha_financeira') && user?.role !== 'Administrador') {
    return <AccessRestricted />
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <h3 className="text-xl font-semibold">Meus Serviços Financeiros</h3>
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full xl:w-auto">
          <Tabs value={paymentFilter} onValueChange={setPaymentFilter} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
              <TabsTrigger value="Todos">Todos</TabsTrigger>
              <TabsTrigger value="Pendentes">Pendentes</TabsTrigger>
              <TabsTrigger value="Pagos">Pagos</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status do Serviço" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Status</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Concluído">Concluído</SelectItem>
              <SelectItem value="Cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex w-full sm:w-auto gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={filteredServicos.length === 0}
              className="flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4 mr-2" /> Exportar CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={filteredServicos.length === 0}
              className="flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4 mr-2" /> Exportar PDF
            </Button>
            {canWritePlanilha && (
              <Button onClick={() => openForm()} className="flex-1 sm:flex-none">
                <Plus className="w-4 h-4 mr-2" /> Novo Lançamento
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Card className="bg-amber-50/50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Total Pendente
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {formatCurrency(totalPending)}
            </div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
              Serviços Pendentes ou Em Andamento no período
            </p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Total Recebido / Concluído
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(totalCompleted)}
            </div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
              Serviços com status Concluído no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(grandTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Soma de todos os serviços filtrados (exclui cancelados)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Evolução de Recebimentos (Últimos 6 meses globais)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ total: { label: 'Recebido', color: 'hsl(var(--primary))' } }}
              className="h-[250px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last6Months} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={10} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `R$ ${value}`}
                    width={80}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" />}
                  />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Top Clientes por Volume no Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin">
              {topClients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum dado disponível.
                </p>
              ) : (
                topClients.map((client, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {i + 1}
                      </div>
                      <span className="font-medium text-sm truncate max-w-[150px] sm:max-w-[200px]">
                        {client.name}
                      </span>
                    </div>
                    <span className="font-bold text-sm text-primary">
                      {formatCurrency(client.total)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-md bg-card overflow-x-auto shadow-sm w-full">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="whitespace-nowrap">ID</TableHead>
              <TableHead className="whitespace-nowrap">Projeto/Serviço</TableHead>
              <TableHead className="whitespace-nowrap w-full min-w-[300px]">Observações</TableHead>
              <TableHead className="whitespace-nowrap">Cliente</TableHead>
              <TableHead className="whitespace-nowrap">Data Início</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="text-right whitespace-nowrap">Valor Total</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Carregando serviços financeiros...
                </TableCell>
              </TableRow>
            ) : filteredServicos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado para este período.
                </TableCell>
              </TableRow>
            ) : (
              filteredServicos.flatMap((s) => {
                const totalPago = pagamentosPorServico[s.id] || 0
                const isFullyPaid = totalPago >= (s.valor_total || 0) && (s.valor_total || 0) > 0

                const rows = [
                  <TableRow
                    key={s.id}
                    className={
                      isFullyPaid
                        ? 'bg-emerald-50/40 hover:bg-emerald-50/60 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30'
                        : ''
                    }
                  >
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleRow(s.id)}
                        className="h-8 w-8"
                      >
                        {expandedRows[s.id] ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap text-primary">
                      {s.codigo}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{s.projeto_servico}</span>
                        {(servicoAlerts[s.id]?.overdue || 0) > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                            title={`${servicoAlerts[s.id].overdue} parcela(s) em atraso`}
                          >
                            <AlertCircle className="w-3 h-3 mr-1" /> Atrasado
                          </Badge>
                        )}
                        {(servicoAlerts[s.id]?.dueSoon || 0) > 0 &&
                          (servicoAlerts[s.id]?.overdue || 0) === 0 && (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20"
                              title={`${servicoAlerts[s.id].dueSoon} parcela(s) vencendo`}
                            >
                              <Clock className="w-3 h-3 mr-1" /> Vencendo
                            </Badge>
                          )}
                      </div>
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground min-w-[300px] w-full"
                      title={s.observacoes}
                    >
                      {s.observacoes || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{s.cliente || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {s.data_inicio ? format(new Date(s.data_inicio), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.status === 'Concluído'
                            ? 'default'
                            : s.status === 'Cancelado'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {isFullyPaid && (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Pago
                          </Badge>
                        )}
                        <span>{formatCurrency(s.valor_total || 0)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {canWritePlanilha && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openForm(s)}
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                            onClick={() => handleDelete(s.id)}
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>,
                ]

                if (expandedRows[s.id]) {
                  rows.push(
                    <TableRow key={`${s.id}-expanded`} className="bg-muted/10 hover:bg-muted/10">
                      <TableCell colSpan={9} className="p-0 border-b">
                        <ExpandedPaymentRow servico={s} />
                      </TableCell>
                    </TableRow>,
                  )
                }

                return rows
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{formData.id ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Código do Serviço</Label>
              <Input
                value={formData.codigo || ''}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ex: SER-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Projeto ou Descrição do Serviço</Label>
              <Input
                value={formData.projeto_servico || ''}
                onChange={(e) => setFormData({ ...formData, projeto_servico: e.target.value })}
                placeholder="Nome do projeto ou tipo de serviço"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Cliente</Label>
              <ClientCombobox
                value={formData.cliente || ''}
                onChange={(val) => setFormData({ ...formData, cliente: val })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input
                type="date"
                value={formData.data_inicio?.substring(0, 10) || ''}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Total (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_total || ''}
                onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes || ''}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Detalhes adicionais sobre o escopo ou pagamento"
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
