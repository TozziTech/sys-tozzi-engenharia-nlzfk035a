import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
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
import { useQuery, queryClient } from '@/hooks/use-query'

export function ExpandedPaymentRow({ servico }: { servico: any }) {
  const { toast } = useToast()

  // Create form state
  const [novoPagamento, setNovoPagamento] = useState({
    descricao: '',
    valor: '',
    data_vencimento: new Date().toISOString().substring(0, 10),
    status: 'Pendente',
  })

  // Edit form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    descricao: '',
    valor: '',
    data_vencimento: '',
    data_pagamento: '',
    status: 'Pendente',
  })

  const { data: pagamentos = [], refetch } = useQuery(
    `pagamentos_servico_${servico.id}`,
    () =>
      pb.collection('pagamentos_servicos').getFullList({
        filter: `servico_id = "${servico.id}"`,
        sort: 'data_vencimento',
      }),
    { enabled: !!servico.id },
  )

  useRealtime('pagamentos_servicos', (e) => {
    if (e.record?.servico_id === servico.id) {
      refetch()
    }
  })

  const handleAdd = async () => {
    if (!novoPagamento.valor || !novoPagamento.data_vencimento) {
      toast({ title: 'Preencha valor e vencimento', variant: 'destructive' })
      return
    }

    if (Number(novoPagamento.valor) <= 0) {
      toast({ title: 'O valor deve ser maior que zero', variant: 'destructive' })
      return
    }

    try {
      await pb.collection('pagamentos_servicos').create({
        servico_id: servico.id,
        valor: Number(novoPagamento.valor),
        data_vencimento: novoPagamento.data_vencimento,
        data_pagamento: novoPagamento.status === 'Pago' ? new Date().toISOString() : null,
        status: novoPagamento.status,
        descricao: novoPagamento.descricao,
      })
      setNovoPagamento({
        descricao: '',
        valor: '',
        data_vencimento: new Date().toISOString().substring(0, 10),
        status: 'Pendente',
      })
      queryClient().invalidateQueries(`pagamentos_servico_${servico.id}`)
      queryClient().invalidateQueries(`pagamentos_user_all_`)
      toast({ title: 'Parcela registrada com sucesso!' })
    } catch (e) {
      toast({ title: 'Erro ao registrar parcela', variant: 'destructive' })
    }
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

  const handleUpdate = async () => {
    if (!editForm.valor || !editForm.data_vencimento) {
      toast({ title: 'Preencha valor e vencimento', variant: 'destructive' })
      return
    }

    if (Number(editForm.valor) <= 0) {
      toast({ title: 'O valor deve ser maior que zero', variant: 'destructive' })
      return
    }

    try {
      await pb.collection('pagamentos_servicos').update(editingId!, {
        valor: Number(editForm.valor),
        data_vencimento: editForm.data_vencimento,
        data_pagamento:
          editForm.status === 'Pago' ? editForm.data_pagamento || new Date().toISOString() : null,
        status: editForm.status,
        descricao: editForm.descricao,
      })
      setEditingId(null)
      queryClient().invalidateQueries(`pagamentos_servico_${servico.id}`)
      queryClient().invalidateQueries(`pagamentos_user_all_`)
      toast({ title: 'Parcela atualizada com sucesso!' })
    } catch (e) {
      toast({ title: 'Erro ao atualizar parcela', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta parcela?')) return
    try {
      await pb.collection('pagamentos_servicos').delete(id)
      queryClient().invalidateQueries(`pagamentos_servico_${servico.id}`)
      queryClient().invalidateQueries(`pagamentos_user_all_`)
      toast({ title: 'Parcela excluída!' })
    } catch (e) {
      toast({ title: 'Erro ao excluir parcela', variant: 'destructive' })
    }
  }

  const totalPago = pagamentos
    .filter((p) => p.status === 'Pago')
    .reduce((acc, p) => acc + (p.valor || 0), 0)
  const valorRestante = (servico.valor_total || 0) - totalPago

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return dateString.substring(0, 10).split('-').reverse().join('/')
  }

  const getStatusBadge = (p: any) => {
    if (p.status === 'Pago') {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Pago
        </Badge>
      )
    }

    const today = startOfDay(new Date())
    const venc = p.data_vencimento ? startOfDay(new Date(p.data_vencimento)) : today
    const in3Days = addDays(today, 3)

    if (isBefore(venc, today)) {
      return (
        <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20">
          <AlertCircle className="w-3 h-3 mr-1" /> Atrasado
        </Badge>
      )
    } else if (isBefore(venc, in3Days) || venc.getTime() === in3Days.getTime()) {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20">
          <Clock className="w-3 h-3 mr-1" /> Vencendo
        </Badge>
      )
    }

    return (
      <Badge className="bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 border-slate-500/20">
        Pendente
      </Badge>
    )
  }

  return (
    <div className="px-4 sm:px-8 py-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-b shadow-inner">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">Parcelas</span>
          Histórico de Pagamentos
        </h4>
        <div className="flex gap-6 text-sm bg-background px-4 py-2 rounded-md border shadow-sm w-full sm:w-auto">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Pago
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-500">
              {formatCurrency(totalPago)}
            </span>
          </div>
          <div className="w-px bg-border"></div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Restante</span>
            <span className="font-bold text-amber-600 dark:text-amber-500">
              {formatCurrency(valorRestante)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_130px_130px_130px_auto] gap-3 mb-6 items-end bg-background p-4 rounded-md border">
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
            min="0.01"
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

      {pagamentos.length > 0 ? (
        <div className="border rounded-md bg-background overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[120px]">Vencimento</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagamentos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{formatDate(p.data_vencimento)}</TableCell>
                  <TableCell className="text-muted-foreground">{p.descricao || '-'}</TableCell>
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
            Nenhuma parcela registrada para este serviço.
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
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
                  min="0.01"
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
                <div className="space-y-2 animate-fade-in">
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
