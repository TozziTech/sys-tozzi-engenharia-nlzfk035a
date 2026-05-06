import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Clock, UploadCloud, Download, Trash, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import {
  getMeeting,
  getMeetingAgenda,
  getMeetingDocuments,
  createAgendaItem,
  deleteAgendaItem,
  createMeetingDocument,
  deleteMeetingDocument,
} from '@/services/meetings'

export default function MeetingDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [meeting, setMeeting] = useState<any>(null)
  const [agenda, setAgenda] = useState<any[]>([])
  const [docs, setDocs] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  const [topicOpen, setTopicOpen] = useState(false)
  const [newTopic, setNewTopic] = useState({ topic: '', estimated_time: '15', responsible: '' })

  useEffect(() => {
    if (id) loadAll()
  }, [id])

  const loadAll = async () => {
    try {
      const [m, a, d, u] = await Promise.all([
        getMeeting(id!),
        getMeetingAgenda(id!),
        getMeetingDocuments(id!),
        pb.collection('users').getFullList(),
      ])
      setMeeting(m)
      setAgenda(a)
      setDocs(d)
      setUsers(u)
    } catch (e) {
      toast.error('Erro ao carregar reunião')
      navigate('/admin/reunioes')
    }
  }

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createAgendaItem({
        meeting: id,
        topic: newTopic.topic,
        estimated_time: Number(newTopic.estimated_time),
        responsible: newTopic.responsible || null,
        order: agenda.length + 1,
      })
      toast.success('Tópico adicionado')
      setTopicOpen(false)
      setNewTopic({ topic: '', estimated_time: '15', responsible: '' })
      loadAll()
    } catch (e) {
      toast.error('Erro ao adicionar tópico')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append('meeting', id!)
    formData.append('name', file.name)
    formData.append('file', file)
    try {
      await createMeetingDocument(formData)
      toast.success('Documento anexado')
      loadAll()
    } catch (e) {
      toast.error('Erro no upload')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Excluir documento?')) return
    try {
      await deleteMeetingDocument(docId)
      toast.success('Excluído')
      loadAll()
    } catch (e) {
      toast.error('Erro ao excluir')
    }
  }

  if (!meeting) return null

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/admin/reunioes')}
        className="-ml-4 text-zinc-500"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{meeting.title}</h1>
          <p className="text-zinc-500 mt-1 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {format(new Date(meeting.date_time), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
            ({meeting.duration} min)
          </p>
          {meeting.expand?.project && (
            <Badge variant="outline" className="mt-2">
              {meeting.expand.project.name}
            </Badge>
          )}
        </div>
        <Badge
          variant={
            meeting.status === 'Realizada'
              ? 'default'
              : meeting.status === 'Cancelada'
                ? 'destructive'
                : 'secondary'
          }
          className="text-sm"
        >
          {meeting.status}
        </Badge>
      </div>

      <Tabs defaultValue="pauta" className="w-full">
        <TabsList>
          <TabsTrigger value="pauta">Pauta (Agenda)</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>
        <TabsContent value="pauta" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tópico</TableHead>
                    <TableHead>Tempo Estimado</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agenda.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        Nenhum tópico na pauta.
                      </TableCell>
                    </TableRow>
                  )}
                  {agenda.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.topic}</TableCell>
                      <TableCell>{a.estimated_time} min</TableCell>
                      <TableCell>{a.expand?.responsible?.name || '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (confirm('Excluir?')) {
                              await deleteAgendaItem(a.id)
                              loadAll()
                            }
                          }}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 border-t">
                <Button variant="outline" onClick={() => setTopicOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Tópico
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="mt-4 space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-zinc-500 hover:bg-zinc-50 hover:border-zinc-300 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="h-10 w-10 mb-2 text-zinc-400" />
            <p className="font-medium">Clique para anexar documento</p>
            <p className="text-sm">Suporta PDF, DOC, Imagens</p>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          </div>

          {docs.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {docs.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell className="text-right space-x-2">
                          {d.file && (
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={pb.files.getUrl(d, d.file)}
                                target="_blank"
                                download
                                rel="noreferrer"
                              >
                                <Download className="h-4 w-4 mr-2" /> Baixar
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteDoc(d.id)}>
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={topicOpen} onOpenChange={setTopicOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Tópico</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTopic} className="space-y-4">
            <div className="space-y-2">
              <Label>Tópico</Label>
              <Input
                required
                value={newTopic.topic}
                onChange={(e) => setNewTopic({ ...newTopic, topic: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tempo Estimado (min)</Label>
              <Input
                type="number"
                required
                value={newTopic.estimated_time}
                onChange={(e) => setNewTopic({ ...newTopic, estimated_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Responsável (Opcional)</Label>
              <Select
                value={newTopic.responsible}
                onValueChange={(v) => setNewTopic({ ...newTopic, responsible: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
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
            <DialogFooter>
              <Button type="submit">Salvar Tópico</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
