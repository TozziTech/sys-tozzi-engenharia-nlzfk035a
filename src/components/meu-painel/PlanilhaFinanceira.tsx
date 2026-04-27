import { useState, useEffect, Fragment } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
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
} from 'lucide-react'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { ExpandedPaymentRow } from './ExpandedPaymentRow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { exportServicosFinanceirosCSV } from '@/lib/export'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { usePermissions } from '@/hooks/use-permissions'
import { AccessRestricted } from '@/components/auth/AccessRestricted'

export function PlanilhaFinanceira() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { canAccess, canWrite } = usePermissions()

  const canWritePlanilha = canWrite('planilha_financeira') || user?.role === 'Administrador'
  const [servicos, setServicos] = useState<any[]>([])
  const [pagamentos, setPagamentos] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [statusFilter, setStatusFilter] = useState<string>('Todos')
  const [paymentFilter, setPaymentFilter] = useState<string>('Todos')
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const [pagamentosPorServico, setPagamentosPorServico] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const [records, pgs] = await Promise.all([
        pb.collection('servicos_financeiros').getFullList({
          filter: `user_id = "${user.id}"`,
          sort: '-created',
        }),
        pb.collection('pagamentos_servicos').getFullList({
          filter: `servico_id.user_id = "${user.id}"`,
        }),
      ])

      const pagamentosMap: Record<string, number> = {}
      pgs.forEach((p: any) => {
        pagamentosMap[p.servico_id] = (pagamentosMap[p.servico_id] || 0) + (p.valor || 0)
      })

      setServicos(records)
      setPagamentos(pgs)
      setPagamentosPorServico(pagamentosMap)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('servicos_financeiros', loadData)
  useRealtime('pagamentos_servicos', loadData)

  const handleSave = async () => {
    try {
      const data = { ...formData, user_id: user?.id, valor_total: Number(formData.valor_total) }
      if (formData.id) {
        await pb.collection('servicos_financeiros').update(formData.id, data)
        toast({ title: 'Serviço atualizado com sucesso!' })
      } else {
        await pb.collection('servicos_financeiros').create(data)
        toast({ title: 'Serviço registrado com sucesso!' })
      }
      setIsOpen(false)
    } catch (e) {
      toast({ title: 'Erro ao salvar o serviço', variant: 'destructive' })
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

  const openForm = (item?: any) => {
    setFormData(
      item || { status: 'Pendente', data_inicio: new Date().toISOString().substring(0, 10) },
    )
    setIsOpen(true)
  }

  const filteredServicos = servicos.filter((s) => {
    const statusMatch = statusFilter === 'Todos' || s.status === statusFilter
    const totalPago = pagamentosPorServico[s.id] || 0
    const isFullyPaid = totalPago >= (s.valor_total || 0) && (s.valor_total || 0) > 0

    let paymentMatch = true
    if (paymentFilter === 'Pagos') paymentMatch = isFullyPaid
    if (paymentFilter === 'Pendentes') paymentMatch = !isFullyPaid

    return statusMatch && paymentMatch
  })

  const filteredServicosIds = new Set(filteredServicos.map((s) => s.id))
  const filteredPagamentos = pagamentos.filter((p) => filteredServicosIds.has(p.servico_id))

  const currentMonthPrefix = format(new Date(), 'yyyy-MM')
  const prevMonthPrefix = format(subMonths(new Date(), 1), 'yyyy-MM')

  const totalCurrentMonth = filteredPagamentos
    .filter((p) => p.data_pagamento?.startsWith(currentMonthPrefix))
    .reduce((acc, p) => acc + (p.valor || 0), 0)

  const totalPrevMonth = filteredPagamentos
    .filter((p) => p.data_pagamento?.startsWith(prevMonthPrefix))
    .reduce((acc, p) => acc + (p.valor || 0), 0)

  const growthPercent =
    totalPrevMonth === 0
      ? totalCurrentMonth > 0
        ? 100
        : 0
      : ((totalCurrentMonth - totalPrevMonth) / totalPrevMonth) * 100

  const totalAReceber = filteredServicos
    .filter((s) => s.status !== 'Cancelado')
    .reduce((acc, s) => {
      const totalPago = pagamentosPorServico[s.id] || 0
      const restante = (s.valor_total || 0) - totalPago
      return acc + (restante > 0 ? restante : 0)
    }, 0)

  const totalGeral = filteredServicos
    .filter((s) => s.status !== 'Cancelado')
    .reduce((acc, s) => acc + (s.valor_total || 0), 0)

  const now = new Date()
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(now, 5 - i)
    return {
      month: format(d, 'yyyy-MM'),
      label: format(d, 'MMM/yy', { locale: ptBR }),
      total: 0,
    }
  })

  filteredPagamentos.forEach((p) => {
    if (!p.data_pagamento) return
    const month = p.data_pagamento.substring(0, 7)
    const monthData = last6Months.find((m) => m.month === month)
    if (monthData) {
      monthData.total += p.valor || 0
    }
  })

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

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
              onClick={() => exportServicosFinanceirosCSV(filteredServicos, pagamentosPorServico)}
              disabled={filteredServicos.length === 0}
              className="flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4 mr-2" /> Exportar para CSV
            </Button>
            {canWritePlanilha && (
              <Button onClick={() => openForm()} className="flex-1 sm:flex-none">
                <Plus className="w-4 h-4 mr-2" /> Novo Lançamento
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Recebido (Mês Atual)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(totalCurrentMonth)}
            </div>
            <div className="text-xs mt-1 flex items-center gap-1.5">
              {growthPercent > 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : growthPercent < 0 ? (
                <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              )}
              <span
                className={`font-medium ${growthPercent > 0 ? 'text-emerald-600 dark:text-emerald-400' : growthPercent < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}
              >
                {growthPercent > 0 ? '+' : ''}
                {growthPercent.toFixed(1)}%
              </span>
              <span className="text-emerald-600/80 dark:text-emerald-400/80">
                em relação ao mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-300">
              A Receber
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {formatCurrency(totalAReceber)}
            </div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
              Saldo pendente de serviços ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total em Serviços</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalGeral)}</div>
            <p className="text-xs text-muted-foreground mt-1">Valor global (exclui cancelados)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Evolução de Recebimentos (Últimos 6 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ total: { label: 'Recebido', color: 'hsl(var(--primary))' } }}
            className="h-[300px] w-full"
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
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

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
                  Nenhum serviço financeiro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredServicos.map((s) => {
                const totalPago = pagamentosPorServico[s.id] || 0
                const isFullyPaid = totalPago >= (s.valor_total || 0) && (s.valor_total || 0) > 0

                return (
                  <Fragment key={s.id}>
                    <TableRow
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
                        {s.projeto_servico}
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
                    </TableRow>
                    {expandedRows[s.id] && (
                      <TableRow className="bg-muted/10 hover:bg-muted/10">
                        <TableCell colSpan={9} className="p-0 border-b">
                          <ExpandedPaymentRow servico={s} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
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
              <Input
                value={formData.cliente || ''}
                onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                placeholder="Nome do cliente (opcional)"
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
