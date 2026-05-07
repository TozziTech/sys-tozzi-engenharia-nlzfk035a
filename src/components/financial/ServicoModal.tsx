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
import { Plus, Check, ChevronsUpDown, Trash2 } from 'lucide-react'
import {
  createServico,
  updateServico,
  getNextServicoCode,
  checkServicoCodeExists,
  type ServicoFinanceiro,
} from '@/services/servicos_financeiros'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'

interface ServicoModalProps {
  servico?: ServicoFinanceiro
  onSuccess?: () => void
}

export function ServicoModal({ servico, onSuccess }: ServicoModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const [projects, setProjects] = useState<any[]>([])
  const [openProjectCombo, setOpenProjectCombo] = useState(false)

  const [formData, setFormData] = useState({
    codigo: '',
    projeto_servico: '',
    project_ref: '',
    cliente: '',
    data_inicio: new Date().toISOString().split('T')[0],
    status: 'Pendente',
    valor_total: '',
    observacoes: '',
  })
  const [parcelas, setParcelas] = useState<any[]>([])

  useEffect(() => {
    if (open && user) {
      pb.collection('projects')
        .getFullList({
          sort: '-created',
          fields: 'id,name',
          filter: 'status != "Concluído" && status != "Cancelado"',
        })
        .then(setProjects)
        .catch(console.error)
    }
  }, [open, user])

  useEffect(() => {
    if (open) {
      if (servico) {
        setFormData({
          codigo: servico.codigo || '',
          projeto_servico: servico.projeto_servico || '',
          project_ref: servico.project_ref || '',
          cliente: servico.cliente || '',
          data_inicio: servico.data_inicio ? servico.data_inicio.split('T')[0] : '',
          status: servico.status || 'Pendente',
          valor_total: servico.valor_total?.toString() || '',
          observacoes: servico.observacoes || '',
        })
        setParcelas(servico.parcelas || [])
      } else {
        setFormData({
          codigo: '',
          projeto_servico: '',
          project_ref: '',
          cliente: '',
          data_inicio: new Date().toISOString().split('T')[0],
          status: 'Pendente',
          valor_total: '',
          observacoes: '',
        })
        setParcelas([])
        getNextServicoCode()
          .then((code) => setFormData((prev) => ({ ...prev, codigo: code })))
          .catch(console.error)
      }
    }
  }, [open, servico])

  const handleAddParcela = () => {
    setParcelas([
      ...parcelas,
      {
        id: Math.random().toString(36).substring(2),
        descricao: `Parcela ${parcelas.length + 1}`,
        valor: 0,
        data_vencimento: new Date().toISOString().substring(0, 10),
        status: 'Pendente',
      },
    ])
  }

  const handleUpdateParcela = (id: string, field: string, value: any) => {
    setParcelas(parcelas.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const handleRemoveParcela = (id: string) => {
    setParcelas(parcelas.filter((p) => p.id !== id))
  }

  const sumParcelas = parcelas.reduce((acc, p) => acc + Number(p.valor), 0)
  const numericValueForm = parseFloat(formData.valor_total) || 0
  const showMismatchWarning = parcelas.length > 0 && Math.abs(sumParcelas - numericValueForm) > 0.01

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!formData.codigo.trim()) {
      toast({
        title: 'Erro',
        description: 'O código do serviço não pode ficar em branco.',
        variant: 'destructive',
      })
      return
    }

    if (!formData.project_ref && !formData.projeto_servico.trim()) {
      toast({
        title: 'Erro',
        description:
          'É necessário selecionar um projeto ou informar um nome manual para o serviço.',
        variant: 'destructive',
      })
      return
    }

    const numericValue = parseFloat(formData.valor_total)
    if (isNaN(numericValue) || numericValue <= 0) {
      toast({
        title: 'Erro',
        description: 'Informe um valor total válido e maior que zero.',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)

      const exists = await checkServicoCodeExists(formData.codigo, servico?.id)
      if (exists) {
        toast({
          title: 'Aviso',
          description: 'Este código já está em uso. Por favor, utilize um código único.',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      const finalParcelas = parcelas.map((p) => ({
        ...p,
        valor: Number(p.valor),
        data_pagamento:
          p.status === 'Pago' && !p.data_pagamento ? new Date().toISOString() : p.data_pagamento,
      }))

      const payload = {
        user_id: user.id,
        codigo: formData.codigo,
        projeto_servico: formData.projeto_servico,
        project_ref: formData.project_ref || '',
        cliente: formData.cliente,
        data_inicio: new Date(formData.data_inicio).toISOString(),
        status: formData.status as any,
        valor_total: numericValue,
        observacoes: formData.observacoes,
        parcelas: finalParcelas,
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

          <div className="space-y-2 flex flex-col">
            <Label>Projeto / Serviço Vinculado (Opcional)</Label>
            <Popover open={openProjectCombo} onOpenChange={setOpenProjectCombo}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openProjectCombo}
                  className="w-full justify-between font-normal bg-zinc-950/50"
                >
                  {formData.project_ref
                    ? projects.find((p) => p.id === formData.project_ref)?.name
                    : 'Selecione o projeto vinculado...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar projeto..." />
                  <CommandList>
                    <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
                    <CommandGroup>
                      {projects.map((project) => (
                        <CommandItem
                          key={project.id}
                          value={project.name}
                          onSelect={() => {
                            setFormData({
                              ...formData,
                              project_ref: project.id,
                              projeto_servico: project.name,
                            })
                            setOpenProjectCombo(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              formData.project_ref === project.id ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          {project.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {!formData.project_ref && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label>Nome Manual do Serviço</Label>
              <Input
                required={!formData.project_ref}
                value={formData.projeto_servico}
                onChange={(e) => setFormData({ ...formData, projeto_servico: e.target.value })}
                placeholder="Ex: Consultoria Financeira"
              />
            </div>
          )}

          <div className="space-y-2 flex flex-col">
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

          <div className="space-y-4 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Cronograma de Parcelas</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddParcela}>
                <Plus className="w-4 h-4 mr-2" /> Nova Parcela
              </Button>
            </div>

            {showMismatchWarning && (
              <div className="text-amber-500 text-xs bg-amber-500/10 p-2 rounded-md border border-amber-500/20">
                Aviso: A soma das parcelas ({formatCurrency(sumParcelas)}) difere do valor total (
                {formatCurrency(numericValueForm)}).
              </div>
            )}

            {parcelas.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-2">Nenhuma parcela adicionada.</p>
            ) : (
              <div className="space-y-3">
                {parcelas.map((p, index) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-[1fr_120px_130px_110px_auto] gap-2 items-end"
                  >
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-400">Descrição</Label>
                      <Input
                        value={p.descricao}
                        onChange={(e) => handleUpdateParcela(p.id, 'descricao', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-400">Vencimento</Label>
                      <Input
                        type="date"
                        value={p.data_vencimento}
                        onChange={(e) =>
                          handleUpdateParcela(p.id, 'data_vencimento', e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-400">Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={p.valor}
                        onChange={(e) => handleUpdateParcela(p.id, 'valor', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-400">Status</Label>
                      <Select
                        value={p.status}
                        onValueChange={(v) => handleUpdateParcela(p.id, 'status', v)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendente">Pendente</SelectItem>
                          <SelectItem value="Pago">Pago</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => handleRemoveParcela(p.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800">
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
