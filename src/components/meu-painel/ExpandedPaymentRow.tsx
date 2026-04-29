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
import { Trash2, Plus, Pencil } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function ExpandedPaymentRow({ servico }: { servico: any }) {
  const { toast } = useToast()
  const [pagamentos, setPagamentos] = useState<any[]>([])

  // Create form state
  const [novoPagamento, setNovoPagamento] = useState({
    descricao: '',
    valor: '',
    data_pagamento: new Date().toISOString().substring(0, 10),
  })

  // Edit form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    descricao: '',
    valor: '',
    data_pagamento: '',
  })

  const loadPagamentos = async () => {
    try {
      const records = await pb.collection('pagamentos_servicos').getFullList({
        filter: `servico_id = "${servico.id}"`,
        sort: 'data_pagamento',
      })
      setPagamentos(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadPagamentos()
  }, [servico.id])

  useRealtime('pagamentos_servicos', (e) => {
    if (e.record?.servico_id === servico.id) {
      loadPagamentos()
    }
  })

  const handleAdd = async () => {
    if (!novoPagamento.valor || !novoPagamento.data_pagamento) {
      toast({ title: 'Preencha valor e data', variant: 'destructive' })
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
        data_pagamento: novoPagamento.data_pagamento,
        descricao: novoPagamento.descricao,
      })
      setNovoPagamento({
        descricao: '',
        valor: '',
        data_pagamento: new Date().toISOString().substring(0, 10),
      })
      toast({ title: 'Pagamento registrado com sucesso!' })
    } catch (e) {
      toast({ title: 'Erro ao registrar pagamento', variant: 'destructive' })
    }
  }

  const startEdit = (p: any) => {
    setEditingId(p.id)
    setEditForm({
      descricao: p.descricao || '',
      valor: p.valor.toString(),
      data_pagamento: p.data_pagamento.substring(0, 10),
    })
  }

  const handleUpdate = async () => {
    if (!editForm.valor || !editForm.data_pagamento) {
      toast({ title: 'Preencha valor e data', variant: 'destructive' })
      return
    }

    if (Number(editForm.valor) <= 0) {
      toast({ title: 'O valor deve ser maior que zero', variant: 'destructive' })
      return
    }

    try {
      await pb.collection('pagamentos_servicos').update(editingId!, {
        valor: Number(editForm.valor),
        data_pagamento: editForm.data_pagamento,
        descricao: editForm.descricao,
      })
      setEditingId(null)
      toast({ title: 'Pagamento atualizado com sucesso!' })
    } catch (e) {
      toast({ title: 'Erro ao atualizar pagamento', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este pagamento?')) return
    try {
      await pb.collection('pagamentos_servicos').delete(id)
      toast({ title: 'Pagamento excluído!' })
    } catch (e) {
      toast({ title: 'Erro ao excluir pagamento', variant: 'destructive' })
    }
  }

  const totalPago = pagamentos.reduce((acc, p) => acc + (p.valor || 0), 0)
  const valorRestante = (servico.valor_total || 0) - totalPago

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return dateString.substring(0, 10).split('-').reverse().join('/')
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

      <div className="grid grid-cols-1 md:grid-cols-[1fr_150px_150px_auto] gap-3 mb-6 items-end bg-background p-4 rounded-md border">
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
          <label className="text-xs font-medium text-muted-foreground">Data</label>
          <Input
            type="date"
            className="h-9"
            value={novoPagamento.data_pagamento}
            onChange={(e) => setNovoPagamento({ ...novoPagamento, data_pagamento: e.target.value })}
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
        <Button size="sm" onClick={handleAdd} className="h-9 w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Registrar
        </Button>
      </div>

      {pagamentos.length > 0 ? (
        <div className="border rounded-md bg-background overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[120px]">Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagamentos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{formatDate(p.data_pagamento)}</TableCell>
                  <TableCell className="text-muted-foreground">{p.descricao || '-'}</TableCell>
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
                        title="Editar pagamento"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        onClick={() => handleDelete(p.id)}
                        title="Excluir pagamento"
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
            Nenhum pagamento registrado para este serviço.
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pagamento</DialogTitle>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                value={editForm.data_pagamento}
                onChange={(e) => setEditForm({ ...editForm, data_pagamento: e.target.value })}
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
