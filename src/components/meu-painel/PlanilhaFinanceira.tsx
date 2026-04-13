import { useState, useEffect } from 'react'
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
import { Edit2, Trash2, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

export function PlanilhaFinanceira() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [servicos, setServicos] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState<any>({})

  const loadData = async () => {
    if (!user) return
    try {
      const records = await pb.collection('servicos_financeiros').getFullList({
        filter: `user_id = "${user.id}"`,
        sort: '-created',
      })
      setServicos(records)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])
  useRealtime('servicos_financeiros', loadData)

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

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Meus Serviços Financeiros</h3>
        <Button onClick={() => openForm()}>
          <Plus className="w-4 h-4 mr-2" /> Novo Serviço
        </Button>
      </div>

      <div className="border rounded-md bg-card overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Projeto/Serviço</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servicos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum serviço financeiro registrado. Clique em "Novo Serviço" para adicionar.
                </TableCell>
              </TableRow>
            ) : (
              servicos.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium whitespace-nowrap text-primary">
                    {s.codigo}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{s.projeto_servico}</div>
                    {s.observacoes && (
                      <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                        {s.observacoes}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{s.cliente || '-'}</TableCell>
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
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      s.valor_total || 0,
                    )}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{formData.id ? 'Editar Serviço' : 'Novo Serviço Financeiro'}</DialogTitle>
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
