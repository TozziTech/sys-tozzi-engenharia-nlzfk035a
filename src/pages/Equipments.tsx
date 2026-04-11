import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

export default function Equipments() {
  const [equipments, setEquipments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    category: '',
    status: 'Disponível',
    condition: 'Bom',
    responsible: '',
    return_date: '',
    last_maintenance: '',
    next_maintenance: '',
    usage_notes: '',
  })

  const loadData = async () => {
    try {
      const records = await pb.collection('equipments').getFullList({ sort: '-created' })
      setEquipments(records)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('equipments', () => {
    loadData()
  })

  const handleSave = async () => {
    try {
      if (editingId) {
        await pb.collection('equipments').update(editingId, form)
        toast({ title: 'Equipamento atualizado' })
      } else {
        await pb.collection('equipments').create(form)
        toast({ title: 'Equipamento adicionado' })
      }
      setModalOpen(false)
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      try {
        await pb.collection('equipments').delete(id)
        toast({ title: 'Equipamento excluído' })
      } catch (e) {
        toast({ title: 'Erro ao excluir', variant: 'destructive' })
      }
    }
  }

  const openModal = (eq?: any) => {
    if (eq) {
      setEditingId(eq.id)
      setForm({
        name: eq.name || '',
        category: eq.category || '',
        status: eq.status || 'Disponível',
        condition: eq.condition || 'Bom',
        responsible: eq.responsible || '',
        return_date: eq.return_date ? eq.return_date.substring(0, 10) : '',
        last_maintenance: eq.last_maintenance ? eq.last_maintenance.substring(0, 10) : '',
        next_maintenance: eq.next_maintenance ? eq.next_maintenance.substring(0, 10) : '',
        usage_notes: eq.usage_notes || '',
      })
    } else {
      setEditingId(null)
      setForm({
        name: '',
        category: '',
        status: 'Disponível',
        condition: 'Bom',
        responsible: '',
        return_date: '',
        last_maintenance: '',
        next_maintenance: '',
        usage_notes: '',
      })
    }
    setModalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Disponível':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Disponível</Badge>
      case 'Em Uso':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Em Uso</Badge>
      case 'Manutenção':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Manutenção</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'Novo':
        return (
          <Badge variant="outline" className="border-emerald-500 text-emerald-600">
            Novo
          </Badge>
        )
      case 'Bom':
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-600">
            Bom
          </Badge>
        )
      case 'Necessita Reparo':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
            Necessita Reparo
          </Badge>
        )
      case 'Em Manutenção':
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-600">
            Em Manutenção
          </Badge>
        )
      default:
        return <Badge variant="outline">{condition || '-'}</Badge>
    }
  }

  const isMaintenanceOverdue = (dateStr: string) => {
    if (!dateStr) return false
    return new Date(dateStr) < new Date()
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Equipamentos</h2>
          <p className="text-muted-foreground">
            Gerencie o inventário e as manutenções dos equipamentos.
          </p>
        </div>
        <Button onClick={() => openModal()} className="w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Novo Equipamento
        </Button>
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Condição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Próx. Manutenção</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : equipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32">
                  Nenhum equipamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              equipments.map((eq) => (
                <TableRow key={eq.id}>
                  <TableCell className="font-medium">
                    <div>{eq.name}</div>
                    {eq.responsible && (
                      <div className="text-xs text-muted-foreground">Resp: {eq.responsible}</div>
                    )}
                  </TableCell>
                  <TableCell>{eq.category || '-'}</TableCell>
                  <TableCell>{getConditionBadge(eq.condition)}</TableCell>
                  <TableCell>{getStatusBadge(eq.status)}</TableCell>
                  <TableCell>
                    {eq.next_maintenance ? (
                      <span
                        className={
                          isMaintenanceOverdue(eq.next_maintenance)
                            ? 'text-destructive font-semibold flex items-center'
                            : ''
                        }
                      >
                        {eq.next_maintenance.substring(0, 10).split('-').reverse().join('/')}
                        {isMaintenanceOverdue(eq.next_maintenance) && (
                          <span className="ml-2 text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                            Atrasada
                          </span>
                        )}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openModal(eq)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(eq.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Estação Total Leica"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ex: Topografia"
              />
            </div>
            <div className="space-y-2">
              <Label>Status Atual</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Disponível">Disponível</SelectItem>
                  <SelectItem value="Em Uso">Em Uso</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Condição Física</Label>
              <Select
                value={form.condition}
                onValueChange={(v) => setForm({ ...form, condition: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Novo">Novo</SelectItem>
                  <SelectItem value="Bom">Bom</SelectItem>
                  <SelectItem value="Necessita Reparo">Necessita Reparo</SelectItem>
                  <SelectItem value="Em Manutenção">Em Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input
                value={form.responsible}
                onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                placeholder="Nome do colaborador"
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Devolução</Label>
              <Input
                type="date"
                value={form.return_date}
                onChange={(e) => setForm({ ...form, return_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Última Manutenção</Label>
              <Input
                type="date"
                value={form.last_maintenance}
                onChange={(e) => setForm({ ...form, last_maintenance: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Próxima Manutenção</Label>
              <Input
                type="date"
                value={form.next_maintenance}
                onChange={(e) => setForm({ ...form, next_maintenance: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Histórico / Observações de Uso</Label>
              <Textarea
                value={form.usage_notes}
                onChange={(e) => setForm({ ...form, usage_notes: e.target.value })}
                placeholder="Anotações sobre avarias, consertos ou detalhes de uso contínuo..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
