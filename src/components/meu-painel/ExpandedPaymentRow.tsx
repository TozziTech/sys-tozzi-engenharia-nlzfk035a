import { useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Pencil, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { isBefore, addDays, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'

export function ExpandedPaymentRow({ servico }: { servico: any }) {
  const { toast } = useToast()

  const pagamentos = Array.isArray(servico.parcelas) ? servico.parcelas : []

  const [novoPagamento, setNovoPagamento] = useState({
    descricao: `Parcela ${pagamentos.length + 1}`,
    valor: '',
    data_vencimento: new Date().toISOString().substring(0, 10),
    status: 'Pendente',
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    descricao: '',
    valor: '',
    data_vencimento: '',
    data_pagamento: '',
    status: 'Pendente',
  })

  const updateServicoParcelas = async (newParcelas: any[]) => {
    try {
      await pb.collection('servicos_financeiros').update(servico.id, {
        parcelas: newParcelas,
      })
      toast({ title: 'Parcelas atualizadas com sucesso!' })

      if (!editingId) {
        setNovoPagamento((prev) => ({ ...prev, descricao: `Parcela ${newParcelas.length + 1}` }))
      }
    } catch (e) {
      toast({ title: 'Erro ao atualizar parcelas', variant: 'destructive' })
    }
  }

  const handleAdd = () => {
    if (!novoPagamento.valor || !novoPagamento.data_vencimento) {
      toast({ title: 'Preencha valor e vencimento', variant: 'destructive' })
      return
    }
    const val = Number(novoPagamento.valor)
    if (val < 0) {
      toast({ title: 'O valor não pode ser negativo', variant: 'destructive' })
      return
    }
    if (val === 0) {
      toast({ title: 'O valor deve ser maior que zero', variant: 'destructive' })
      return
    }

    const newParcela = {
      id: Math.random().toString(36).substring(2),
      valor: val,
      data_vencimento: novoPagamento.data_vencimento,
      data_pagamento: novoPagamento.status === 'Pago' ? new Date().toISOString() : null,
      status: novoPagamento.status,
      descricao: novoPagamento.descricao || `Parcela ${pagamentos.length + 1}`,
    }

    updateServicoParcelas([...pagamentos, newParcela])
    setNovoPagamento({
      descricao: `Parcela ${pagamentos.length + 2}`,
      valor: '',
      data_vencimento: new Date().toISOString().substring(0, 10),
      status: 'Pendente',
    })
  }

  const startEdit = (p: any) => {
    setEditingId(p.id)
    setEditForm({
      descricao: p.descricao || '',
      valor: p.valor.toString(),
      data_vencimento: p.data_vencimento ? p.data_vencimento.substring(0, 10) : '',
      data_pagamento: p.data_pagamento ? p.data_pagamento.substring(0, 10) : '',
      status: p.status || 'Pendente',
    })
  }

  const handleUpdate = () => {
    if (!editForm.valor || !editForm.data_vencimento) {
      toast({ title: 'Preencha valor e vencimento', variant: 'destructive' })
      return
    }
    const val = Number(editForm.valor)
    if (val < 0) {
      toast({ title: 'O valor não pode ser negativo', variant: 'destructive' })
      return
    }

    const updatedParcelas = pagamentos.map((p: any) => {
      if (p.id === editingId) {
        return {
          ...p,
          valor: val,
          data_vencimento: editForm.data_vencimento,
          data_pagamento:
            editForm.status === 'Pago' ? editForm.data_pagamento || new Date().toISOString() : null,
          status: editForm.status,
          descricao: editForm.descricao,
        }
      }
      return p
    })

    updateServicoParcelas(updatedParcelas)
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta parcela?')) return
    const updatedParcelas = pagamentos.filter((p: any) => p.id !== id)
    updateServicoParcelas(updatedParcelas)
  }

  const totalValue = servico.valor_total || 0
  const totalScheduled = pagamentos.reduce((acc: number, p: any) => acc + (p.valor || 0), 0)
  const remainingBalance = totalValue - totalScheduled

  const isOverScheduled = totalScheduled > totalValue

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return dateString.substring(0, 10).split('-').reverse().join('/')
  }

  const getStatusBadge = (p: any) => {
    if (p.status === 'Pago') {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Pago
        </Badge>
      )
    }

    const today = startOfDay(new Date())
    const venc = p.data_vencimento ? startOfDay(new Date(p.data_vencimento)) : today
    const in3Days = addDays(today, 3)

    if (isBefore(venc, today)) {
      return (
        <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20 whitespace-nowrap">
          <AlertCircle className="w-3 h-3 mr-1" /> Atrasado
        </Badge>
      )
    } else if (isBefore(venc, in3Days) || venc.getTime() === in3Days.getTime()) {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 whitespace-nowrap">
          <Clock className="w-3 h-3 mr-1" /> Vencendo
        </Badge>
      )
    }

    return (
      <Badge className="bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 border-slate-500/20 whitespace-nowrap">
        Pendente
      </Badge>
    )
  }

  return (
    <div className="px-4 sm:px-6 py-6 bg-transparent">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">Parcelas</span>
          Gestão de Parcelas
        </h4>
        <div className="flex gap-4 sm:gap-6 text-sm bg-background px-4 py-3 rounded-md border shadow-sm w-full sm:w-auto overflow-x-auto">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Valor Total
            </span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
              {formatCurrency(totalValue)}
            </span>
          </div>
          <div className="w-px bg-border shrink-0"></div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Agendado
            </span>
            <span
              className={cn(
                'font-bold whitespace-nowrap',
                isOverScheduled
                  ? 'text-rose-600 dark:text-rose-500'
                  : totalScheduled === totalValue
                    ? 'text-emerald-600 dark:text-emerald-500'
                    : 'text-zinc-900 dark:text-zinc-100',
              )}
            >
              {formatCurrency(totalScheduled)}
            </span>
          </div>
          <div className="w-px bg-border shrink-0"></div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Saldo Restante
            </span>
            <span
              className={cn(
                'font-bold whitespace-nowrap px-1 rounded-sm',
                remainingBalance < 0
                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400'
                  : remainingBalance === 0
                    ? 'text-emerald-600 dark:text-emerald-500'
                    : 'text-amber-600 dark:text-amber-500 bg-amber-500/10',
              )}
            >
              {formatCurrency(remainingBalance)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_130px_130px_130px_auto] gap-3 mb-6 items-end bg-background p-4 rounded-md border shadow-sm">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Descrição</label>
          <Input
            className="h-9"
            value={novoPagamento.descricao}
            onChange={(e) => setNovoPagamento({ ...novoPagamento, descricao: e.target.value })}
            placeholder="Ex: Parcela 01, Sinal..."
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Vencimento</label>
          <Input
            type="date"
            className="h-9"
            value={novoPagamento.data_vencimento}
            onChange={(e) =>
              setNovoPagamento({ ...novoPagamento, data_vencimento: e.target.value })
            }
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Valor (R$)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            className="h-9"
            value={novoPagamento.valor}
            onChange={(e) => setNovoPagamento({ ...novoPagamento, valor: e.target.value })}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select
            value={novoPagamento.status}
            onValueChange={(val) => setNovoPagamento({ ...novoPagamento, status: val })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Pago">Pago</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={handleAdd} className="h-9 w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Adicionar
        </Button>
      </div>

      {isOverScheduled && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Atenção: O total agendado excede o valor total do serviço.</span>
        </div>
      )}

      {pagamentos.length > 0 ? (
        <div className="border rounded-md bg-background overflow-x-auto shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[120px]">Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagamentos.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                    {p.descricao || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(p.data_vencimento)}
                  </TableCell>
                  <TableCell>{getStatusBadge(p)}</TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-500">
                    {formatCurrency(p.valor)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => startEdit(p)}
                        title="Editar parcela"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        onClick={() => handleDelete(p.id)}
                        title="Excluir parcela"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-6 bg-background border rounded-md border-dashed">
          <p className="text-sm text-muted-foreground">
            Nenhuma parcela registrada para este serviço. O saldo restante é{' '}
            <span className="font-semibold text-amber-600">{formatCurrency(remainingBalance)}</span>
            .
          </p>
        </div>
      )}

      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Parcela</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={editForm.descricao}
                onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
                placeholder="Ex: Parcela 01, Sinal..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Vencimento</label>
                <Input
                  type="date"
                  value={editForm.data_vencimento}
                  onChange={(e) => setEditForm({ ...editForm, data_vencimento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.valor}
                  onChange={(e) => setEditForm({ ...editForm, valor: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={editForm.status}
                  onValueChange={(val) => setEditForm({ ...editForm, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editForm.status === 'Pago' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <label className="text-sm font-medium text-emerald-600">Data de Pagamento</label>
                  <Input
                    type="date"
                    value={editForm.data_pagamento}
                    onChange={(e) => setEditForm({ ...editForm, data_pagamento: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
