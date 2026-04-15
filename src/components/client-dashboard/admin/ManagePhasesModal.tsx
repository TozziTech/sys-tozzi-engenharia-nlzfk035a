import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  createProjectPhase,
  updateProjectPhase,
  deleteProjectPhase,
} from '@/services/client_dashboard'
import { useToast } from '@/hooks/use-toast'
import { Settings2, Plus, Edit2, Trash2, ArrowLeft, Loader2 } from 'lucide-react'

export function ManagePhasesModal({ projectId, phases }: { projectId: string; phases: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<'list' | 'form'>('list')
  const [selected, setSelected] = useState<any>(null)
  const { toast } = useToast()

  const [nome, setNome] = useState('')
  const [ordem, setOrdem] = useState('')
  const [status, setStatus] = useState('Pendente')
  const [progresso, setProgresso] = useState('0')
  const [dataEstimada, setDataEstimada] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setView('list')
    }
  }, [isOpen])

  const handleEdit = (phase: any) => {
    setSelected(phase)
    setNome(phase.nome_fase || '')
    setOrdem(phase.ordem?.toString() || '')
    setStatus(phase.status || 'Pendente')
    setProgresso(phase.progresso?.toString() || '0')
    setDataEstimada(
      phase.data_conclusao_estimada ? phase.data_conclusao_estimada.substring(0, 10) : '',
    )
    setView('form')
  }

  const handleNew = () => {
    setSelected(null)
    setNome('')
    setOrdem((phases.length + 1).toString())
    setStatus('Pendente')
    setProgresso('0')
    setDataEstimada('')
    setView('form')
  }

  const handleSave = async () => {
    if (!nome || !ordem) {
      toast({ title: 'Atenção', description: 'Preencha nome e ordem.', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const data = {
        projeto_id: projectId,
        nome_fase: nome,
        ordem: Number(ordem),
        status,
        progresso: Number(progresso),
        data_conclusao_estimada: dataEstimada ? new Date(dataEstimada).toISOString() : null,
        icone: 'FileText',
      }
      if (selected?.id) {
        await updateProjectPhase(selected.id, data)
        toast({ title: 'Sucesso', description: 'Fase atualizada.' })
      } else {
        await createProjectPhase(data)
        toast({ title: 'Sucesso', description: 'Fase criada.' })
      }
      setView('list')
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta fase?')) return
    try {
      await deleteProjectPhase(id)
      toast({ title: 'Sucesso', description: 'Fase excluída.' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="w-4 h-4" /> Gerenciar Fases
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {view === 'form' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView('list')}
                className="-ml-2 h-8 w-8"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            {view === 'list' ? 'Gerenciar Fases' : selected ? 'Editar Fase' : 'Nova Fase'}
          </DialogTitle>
        </DialogHeader>

        {view === 'list' ? (
          <div className="space-y-4">
            <Button onClick={handleNew} className="w-full gap-2">
              <Plus className="w-4 h-4" /> Adicionar Fase
            </Button>
            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
              {phases.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-4">
                  Nenhuma fase cadastrada.
                </p>
              ) : (
                phases.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate">
                        {p.ordem}. {p.nome_fase}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.status} • {p.progresso}%
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 grid gap-2">
                <Label>
                  Nome da Fase <span className="text-destructive">*</span>
                </Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>
                  Ordem <span className="text-destructive">*</span>
                </Label>
                <Input type="number" value={ordem} onChange={(e) => setOrdem(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Progresso (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={progresso}
                  onChange={(e) => setProgresso(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Data Conclusão Estimada</Label>
              <Input
                type="date"
                value={dataEstimada}
                onChange={(e) => setDataEstimada(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setView('list')} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
