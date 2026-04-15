import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createProjectPayment, updateProjectPayment } from '@/services/client_dashboard'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2 } from 'lucide-react'

export function PaymentFormModal({
  projectId,
  payment,
  trigger,
}: {
  projectId: string
  payment?: any
  trigger?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')
  const [status, setStatus] = useState('Pendente')
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      setDescricao(payment?.descricao || '')
      setValor(payment?.valor?.toString() || '')
      setDataVencimento(payment?.data_vencimento ? payment.data_vencimento.substring(0, 10) : '')
      setStatus(payment?.status || 'Pendente')
    }
  }, [isOpen, payment])

  const handleSave = async () => {
    if (!descricao || !valor || !dataVencimento) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }
    setLoading(true)
    try {
      const data = {
        projeto_id: projectId,
        descricao,
        valor: Number(valor),
        data_vencimento: new Date(dataVencimento).toISOString(),
        status,
      }
      if (payment?.id) {
        await updateProjectPayment(payment.id, data)
        toast({ title: 'Sucesso', description: 'Pagamento atualizado.' })
      } else {
        await createProjectPayment(data)
        toast({ title: 'Sucesso', description: 'Pagamento adicionado.' })
      }
      setIsOpen(false)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Adicionar Pagamento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{payment ? 'Editar Pagamento' : 'Novo Pagamento'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>
              Descrição <span className="text-destructive">*</span>
            </Label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Parcela 1"
            />
          </div>
          <div className="grid gap-2">
            <Label>
              Valor (R$) <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>
              Data de Vencimento <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Pago">Pago</SelectItem>
                <SelectItem value="Atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
