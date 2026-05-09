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
import { Plus, Check, ChevronsUpDown } from 'lucide-react'
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
        getNextServicoCode()
          .then((code) => setFormData((prev) => ({ ...prev, codigo: code })))
          .catch(console.error)
      }
    }
  }, [open, servico])

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

      const payload: any = {
        user_id: user.id,
        codigo: formData.codigo,
        projeto_servico: formData.projeto_servico,
        project_ref: formData.project_ref || '',
        cliente: formData.cliente,
        data_inicio: new Date(formData.data_inicio).toISOString(),
        status: formData.status as any,
        valor_total: numericValue,
        observacoes: formData.observacoes,
      }

      if (servico) {
        await updateServico(servico.id, payload)
        toast({ title: 'Sucesso', description: 'Serviço atualizado com sucesso.' })
      } else {
        payload.parcelas = [] // Initialize empty on create
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{servico ? 'Editar Serviço' : 'Novo Lançamento'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <form id="servico-form" onSubmit={handleSubmit} className="space-y-4 py-2">
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

            <div className="space-y-2 pt-2 border-t border-border">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais..."
                rows={3}
              />
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-2 pt-4 mt-auto border-t border-border">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="servico-form" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
