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
    responsible: '',
    return_date: '',
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
        name: eq.name,
        category: eq.category,
        status: eq.status,
        responsible: eq.responsible,
        return_date: eq.return_date ? eq.return_date.substring(0, 10) : '',
      })
    } else {
      setEditingId(null)
      setForm({ name: '', category: '', status: 'Disponível', responsible: '', return_date: '' })
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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Equipamentos</h2>
          <p className="text-muted-foreground">
            Gerencie o inventário de equipamentos do escritório.
          </p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" /> Novo Equipamento
        </Button>
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Data de Devolução</TableHead>
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
                  <TableCell className="font-medium">{eq.name}</TableCell>
                  <TableCell>{eq.category || '-'}</TableCell>
                  <TableCell>{getStatusBadge(eq.status)}</TableCell>
                  <TableCell>{eq.responsible || '-'}</TableCell>
                  <TableCell>{eq.return_date ? eq.return_date.substring(0, 10) : '-'}</TableCell>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
              <Label>Status</Label>
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
