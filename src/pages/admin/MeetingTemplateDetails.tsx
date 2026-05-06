import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { useRealtime } from '@/hooks/use-realtime'

export default function MeetingTemplateDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [template, setTemplate] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [minutes, setMinutes] = useState('')

  const [topic, setTopic] = useState('')
  const [estimatedTime, setEstimatedTime] = useState('')

  const loadData = async () => {
    if (!id) return
    try {
      const t = await pb.collection('meeting_templates').getOne(id)
      setTemplate(t)
      setName(t.name)
      setDescription(t.description || '')
      setMinutes(t.default_minutes || '')

      const i = await pb
        .collection('meeting_template_agenda_items')
        .getFullList({ filter: `template = '${id}'`, sort: 'order' })
      setItems(i)
    } catch (e) {
      toast.error('Erro ao carregar dados do template')
      navigate('/admin/reunioes/templates')
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  useRealtime('meeting_template_agenda_items', loadData)

  const handleSaveInfo = async () => {
    try {
      await pb.collection('meeting_templates').update(id!, {
        name,
        description,
        default_minutes: minutes,
      })
      toast.success('Informações do template salvas com sucesso!')
    } catch (err) {
      toast.error('Erro ao salvar informações')
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await pb.collection('meeting_template_agenda_items').create({
        template: id,
        topic,
        estimated_time: Number(estimatedTime) || 0,
        order: items.length + 1,
      })
      setTopic('')
      setEstimatedTime('')
      toast.success('Item da pauta adicionado')
      loadData()
    } catch (err) {
      toast.error('Erro ao adicionar item')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await pb.collection('meeting_template_agenda_items').delete(itemId)
      toast.success('Item da pauta removido')
      loadData()
    } catch (err) {
      toast.error('Erro ao remover item')
    }
  }

  if (!template) return null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/reunioes/templates')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Editar Template: {template.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Template</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Minuta Padrão (HTML/Rich Text)</Label>
              <textarea
                className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="Conteúdo inicial que será carregado na minuta..."
              />
            </div>
            <Button onClick={handleSaveInfo}>Salvar Informações</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Itens da Pauta Padrão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleAddItem} className="flex gap-2 items-end">
              <div className="space-y-2 flex-1">
                <Label>Tópico</Label>
                <Input
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex: Status Report"
                />
              </div>
              <div className="space-y-2 w-24">
                <Label>Minutos</Label>
                <Input
                  type="number"
                  required
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="15"
                />
              </div>
              <Button type="submit">
                <Plus className="h-4 w-4" />
              </Button>
            </form>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-md bg-muted/20"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {idx + 1}. {item.topic}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tempo estimado: {item.estimated_time} min
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum item adicionado à pauta deste template.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
