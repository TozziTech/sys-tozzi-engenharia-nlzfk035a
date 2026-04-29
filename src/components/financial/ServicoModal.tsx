import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClientCombobox } from '@/components/ClientCombobox'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Plus } from 'lucide-react'
import {
  createServico,
  updateServico,
  getNextServicoCode,
  checkServicoCodeExists,
  type ServicoFinanceiro,
} from '@/services/servicos_financeiros'

interface ServicoModalProps {
  servico?: ServicoFinanceiro
  onSuccess?: () => void
}

export function ServicoModal({ servico, onSuccess }: ServicoModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    codigo: '',
    projeto_servico: '',
    cliente: '',
    data_inicio: new Date().toISOString().split('T')[0],
    status: 'Pendente',
    valor_total: '',
    observacoes: '',
  })

  useEffect(() => {
    if (open) {
      if (servico) {
        setFormData({
          codigo: servico.codigo || '',
          projeto_servico: servico.projeto_servico || '',
          cliente: servico.cliente || '',
          data_inicio: servico.data_inicio ? servico.data_inicio.split('T')[0] : '',
          status: servico.status || 'Pendente',
          valor_total: servico.valor_total?.toString() || '',
          observacoes: servico.observacoes || '',
        })
      } else {
        setFormData({
          codigo: '',
          projeto_servico: '',
          cliente: '',
          data_inicio: new Date().toISOString().split('T')[0],
          status: 'Pendente',
          valor_total: '',
          observacoes: '',
        })
        getNextServicoCode()
          .then((code) => setFormData((prev) => ({ ...prev, codigo: code })))
          .catch(console.error)
      }
    }
  }, [open, servico])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)

      const exists = await checkServicoCodeExists(formData.codigo, servico?.id)
      if (exists) {
        toast({
          title: 'Aviso',
          description: 'Código já lançado. Por favor, utilize um código único.',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      const payload = {
        user_id: user.id,
        codigo: formData.codigo,
        projeto_servico: formData.projeto_servico,
        cliente: formData.cliente,
        data_inicio: new Date(formData.data_inicio).toISOString(),
        status: formData.status as any,
        valor_total: parseFloat(formData.valor_total) || 0,
        observacoes: formData.observacoes,
      }

      if (servico) {
        await updateServico(servico.id, payload)
        toast({ title: 'Sucesso', description: 'Serviço atualizado com sucesso.' })
      } else {
        await createServico(payload)
        toast({ title: 'Sucesso', description: 'Serviço criado com sucesso.' })
      }

      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao salvar o serviço.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {servico ? (
          <Button variant="outline" size="sm">
            Editar
          </Button>
        ) : (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lançamento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{servico ? 'Editar Serviço' : 'Novo Lançamento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código do Serviço</Label>
              <Input
                required
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="SER-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input
                type="date"
                required
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Projeto / Serviço</Label>
            <Input
              required
              value={formData.projeto_servico}
              onChange={(e) => setFormData({ ...formData, projeto_servico: e.target.value })}
              placeholder="Ex: Consultoria Financeira, Projeto X"
            />
          </div>

          <div className="space-y-2">
            <Label>Cliente</Label>
            <ClientCombobox
              value={formData.cliente}
              onChange={(val) => setFormData({ ...formData, cliente: val })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Total (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.valor_total}
                onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
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
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Informações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
