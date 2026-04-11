import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Wrench, HandPlatter, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
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
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [loanModalOpen, setLoanModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [loanForm, setLoanForm] = useState({
    equipment_id: '',
    user_id: '',
    return_date: '',
  })

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
      const [records, userRecords] = await Promise.all([
        pb.collection('equipments').getFullList({ sort: '-created' }),
        pb.collection('users').getFullList(),
      ])
      setEquipments(records)
      setUsers(userRecords)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('equipments', () => loadData())
  useRealtime('equipment_loans', () => loadData())

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

  const openLoanModal = (eq: any) => {
    setLoanForm({
      equipment_id: eq.id,
      user_id: '',
      return_date: '',
    })
    setLoanModalOpen(true)
  }

  const handleLoan = async () => {
    if (!loanForm.user_id) {
      toast({ title: 'Selecione um usuário', variant: 'destructive' })
      return
    }

    try {
      const selectedUser = users.find((u) => u.id === loanForm.user_id)

      await pb.collection('equipment_loans').create({
        equipment_id: loanForm.equipment_id,
        user_id: loanForm.user_id,
        loan_date: new Date().toISOString(),
        return_date: loanForm.return_date ? new Date(loanForm.return_date).toISOString() : '',
        status: 'Ativo',
      })

      await pb.collection('equipments').update(loanForm.equipment_id, {
        status: 'Emprestado',
        responsible: selectedUser?.name || selectedUser?.email,
      })

      toast({ title: 'Equipamento emprestado com sucesso' })
      setLoanModalOpen(false)
    } catch (e) {
      toast({ title: 'Erro ao emprestar', variant: 'destructive' })
    }
  }

  const handleReturn = async (eq: any) => {
    try {
      const activeLoans = await pb.collection('equipment_loans').getFullList({
        filter: `equipment_id = '${eq.id}' && status = 'Ativo'`,
      })

      for (const loan of activeLoans) {
        await pb.collection('equipment_loans').update(loan.id, {
          status: 'Devolvido',
          return_date: new Date().toISOString(),
        })
      }

      await pb.collection('equipments').update(eq.id, {
        status: 'Disponível',
        responsible: '',
      })

      toast({ title: 'Equipamento devolvido com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao devolver equipamento', variant: 'destructive' })
    }
  }

  const handleQuickMaintenance = async (eq: any) => {
    try {
      const today = new Date()
      const next = new Date()
      next.setMonth(next.getMonth() + 6)

      await pb.collection('equipments').update(eq.id, {
        last_maintenance: today.toISOString().split('T')[0],
        next_maintenance: next.toISOString().split('T')[0],
        condition: 'Bom',
      })

      toast({ title: 'Manutenção finalizada com sucesso!' })
    } catch (e) {
      toast({ title: 'Erro ao finalizar manutenção', variant: 'destructive' })
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
      case 'Emprestado':
        return <Badge className="bg-purple-500 hover:bg-purple-600">Emprestado</Badge>
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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Equipamentos</h2>
          <p className="text-muted-foreground">
            Gerencie o inventário e os empréstimos dos equipamentos.
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
                    {eq.responsible && eq.status === 'Emprestado' && (
                      <div className="text-xs text-purple-600 font-semibold mt-0.5">
                        Com: {eq.responsible}
                      </div>
                    )}
                    {eq.responsible && eq.status !== 'Emprestado' && (
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
                          new Date(eq.next_maintenance) < new Date()
                            ? 'text-destructive font-semibold flex items-center'
                            : ''
                        }
                      >
                        {eq.next_maintenance.substring(0, 10).split('-').reverse().join('/')}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {eq.status === 'Disponível' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openLoanModal(eq)}
                        title="Emprestar"
                        className="text-purple-600 hover:bg-purple-100"
                      >
                        <HandPlatter className="w-4 h-4" />
                      </Button>
                    )}
                    {eq.status === 'Emprestado' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReturn(eq)}
                        title="Devolver"
                        className="text-emerald-600 hover:bg-emerald-100"
                      >
                        <Undo2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQuickMaintenance(eq)}
                      title="Finalizar Manutenção"
                      className="text-blue-600 hover:bg-blue-100"
                    >
                      <Wrench className="w-4 h-4" />
                    </Button>
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

      <Dialog open={loanModalOpen} onOpenChange={setLoanModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emprestar Equipamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Projetista / Usuário</Label>
              <Select
                value={loanForm.user_id}
                onValueChange={(v) => setLoanForm({ ...loanForm, user_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione quem vai retirar" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Devolução (Opcional)</Label>
              <Input
                type="date"
                value={loanForm.return_date}
                onChange={(e) => setLoanForm({ ...loanForm, return_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoanModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLoan}>Confirmar Empréstimo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <SelectItem value="Emprestado">Emprestado</SelectItem>
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
              <Label>Responsável Fixo (Opcional)</Label>
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
              <Label>Observações</Label>
              <Textarea
                value={form.usage_notes}
                onChange={(e) => setForm({ ...form, usage_notes: e.target.value })}
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
