import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { useRealtime } from '@/hooks/use-realtime'

export default function MeetingTemplates() {
  const [templates, setTemplates] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const loadData = async () => {
    try {
      const res = await pb.collection('meeting_templates').getFullList({ sort: '-created' })
      setTemplates(res)
    } catch (e) {
      toast.error('Erro ao carregar templates')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('meeting_templates', loadData)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await pb.collection('meeting_templates').create({ name, description })
      toast.success('Template criado com sucesso!')
      setOpen(false)
      setName('')
      setDescription('')
    } catch (err) {
      toast.error('Erro ao criar template')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este template?')) return
    try {
      await pb.collection('meeting_templates').delete(id)
      toast.success('Template excluído!')
    } catch (err) {
      toast.error('Erro ao excluir template')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Templates de Reunião</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/reunioes">Voltar para Reuniões</Link>
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Template
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modelos Disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.description || '-'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/admin/reunioes/templates/${t.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => handleDelete(t.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {templates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                    Nenhum template encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Template</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Template</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Daily Scrum"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (Opcional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Objetivo da reunião"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
