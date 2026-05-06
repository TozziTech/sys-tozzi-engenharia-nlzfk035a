import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  Clock,
  UploadCloud,
  Download,
  Trash,
  Plus,
  Play,
  Save,
  ExternalLink,
  Edit,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { exportMeetingMinutesPDF } from '@/lib/exportPdf'
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
  updateMeeting,
  deleteMeeting,
  getMeetingMinutesVersions,
  createMeetingMinutesVersion,
} from '@/services/meetings'
import { useRealtime } from '@/hooks/use-realtime'

export default function MeetingDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const [meeting, setMeeting] = useState<any>(null)
  const [agenda, setAgenda] = useState<any[]>([])
  const [docs, setDocs] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  const [minutesVersions, setMinutesVersions] = useState<any[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string>('latest')
  const [minutesContent, setMinutesContent] = useState<string>('')

  const [topicOpen, setTopicOpen] = useState(false)
  const [newTopic, setNewTopic] = useState({ topic: '', estimated_time: '15', responsible: '' })

  const [editOpen, setEditOpen] = useState(false)
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    date_time: '',
    duration: '60',
  })

  useEffect(() => {
    if (id) loadAll()
  }, [id])

  useRealtime('meetings', () => {
    if (id) loadAll()
  })
  useRealtime('meeting_agenda_items', () => {
    if (id) loadAll()
  })
  useRealtime('meeting_documents', () => {
    if (id) loadAll()
  })
  useRealtime('meeting_minutes_versions', () => {
    if (id) loadAll()
  })
  useRealtime('meeting_actions', () => {
    if (id) loadAll()
  })

  const loadAll = async () => {
    try {
      const [m, a, d, u, mv] = await Promise.all([
        getMeeting(id!),
        getMeetingAgenda(id!),
        getMeetingDocuments(id!),
        pb.collection('users').getFullList(),
        getMeetingMinutesVersions(id!),
      ])
      setMeeting(m)
      setAgenda(a)
      setDocs(d)
      setUsers(u)
      setMinutesVersions(mv)
      setMinutesContent(m.minutes || '')
      setEditData({
        title: m.title,
        description: m.description || '',
        date_time: format(new Date(m.date_time), "yyyy-MM-dd'T'HH:mm"),
        duration: m.duration.toString(),
      })
    } catch (e) {
      toast.error('Erro ao carregar reunião')
      navigate('/admin/reunioes')
    }
  }

  const handleSaveMinutes = async () => {
    try {
      const nextVersionNumber = minutesVersions.length + 1
      const newVersionLabel = `v${nextVersionNumber}`

      await createMeetingMinutesVersion({
        meeting: id,
        content: minutesContent,
        version_label: newVersionLabel,
        author: user?.id,
      })

      await updateMeeting(id!, { minutes: minutesContent })

      toast.success('Ata atualizada com sucesso e nova versão salva')
      loadAll()
    } catch (e) {
      toast.error('Erro ao salvar ata')
    }
  }

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateMeeting(id!, {
        title: editData.title,
        description: editData.description,
        date_time: new Date(editData.date_time).toISOString(),
        duration: Number(editData.duration),
      })
      toast.success('Reunião atualizada')
      setEditOpen(false)
      loadAll()
    } catch (err) {
      toast.error('Erro ao atualizar reunião')
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

  const handleDeleteMeeting = async () => {
    if (
      !confirm(
        'Deseja realmente excluir esta reunião? Todos os dados vinculados também serão excluídos.',
      )
    )
      return
    try {
      await deleteMeeting(id!)
      toast.success('Reunião excluída com sucesso')
      navigate('/admin/reunioes')
    } catch (e) {
      toast.error('Erro ao excluir reunião')
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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{meeting.title}</h1>
            {meeting.status === 'Pendente' && (
              <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteMeeting}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
          {meeting.description && (
            <p className="text-sm mt-2 text-zinc-600 max-w-2xl">{meeting.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-zinc-500 text-sm">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {format(new Date(meeting.date_time), "dd 'de' MMMM 'de' yyyy, HH:mm", {
                locale: ptBR,
              })}
              ({meeting.duration} min)
            </span>
            {meeting.meet_link && (
              <a
                href={meeting.meet_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded-md transition-colors"
              >
                <ExternalLink className="h-4 w-4" /> Google Meet
              </a>
            )}
          </div>
          {meeting.expand?.project && (
            <Badge variant="outline" className="mt-2">
              {meeting.expand.project.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
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
          {meeting.status === 'Pendente' && (
            <Button
              onClick={async () => {
                try {
                  await updateMeeting(meeting.id, { status: 'Em Andamento' })
                  navigate(`/admin/reunioes/${meeting.id}/in-progress`)
                } catch (e) {
                  toast.error('Erro ao iniciar')
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <Play className="mr-2 h-4 w-4" /> Iniciar Reunião
            </Button>
          )}
          {meeting.status === 'Em Andamento' && (
            <Button
              onClick={() => navigate(`/admin/reunioes/${meeting.id}/in-progress`)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Clock className="mr-2 h-4 w-4" /> Painel Ao Vivo
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="pauta" className="w-full">
        <TabsList>
          <TabsTrigger value="pauta">Pauta (Agenda)</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          {meeting.status === 'Realizada' && <TabsTrigger value="ata">Ata da Reunião</TabsTrigger>}
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
        {meeting.status === 'Realizada' && (
          <TabsContent value="ata" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                  <div className="space-y-1 flex-1 max-w-sm">
                    <Label>Versão</Label>
                    <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a versão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="latest">Atual (Editável)</SelectItem>
                        {minutesVersions.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.version_label} - {format(new Date(v.created), 'dd/MM/yyyy HH:mm')} -{' '}
                            {v.expand?.author?.name || 'Sistema'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const content =
                        selectedVersion === 'latest'
                          ? minutesContent
                          : minutesVersions.find((v) => v.id === selectedVersion)?.content || ''
                      exportMeetingMinutesPDF(meeting, content, user?.name || 'Sistema')
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" /> Gerar PDF
                  </Button>
                </div>

                {selectedVersion === 'latest' ? (
                  <div className="space-y-4">
                    <div className="border rounded-md min-h-[300px] p-2 bg-white flex flex-col">
                      <textarea
                        className="w-full flex-1 min-h-[300px] p-2 outline-none resize-y"
                        value={minutesContent}
                        onChange={(e) => setMinutesContent(e.target.value)}
                        placeholder="Digite a ata da reunião aqui..."
                      />
                    </div>
                    <Button
                      onClick={handleSaveMinutes}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" /> Salvar Alterações
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border rounded-md min-h-[300px] p-4 bg-zinc-50 prose max-w-none whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: minutesVersions.find((v) => v.id === selectedVersion)?.content || '',
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Reunião</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateDetails} className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                required
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data e Hora</Label>
                <Input
                  type="datetime-local"
                  required
                  value={editData.date_time}
                  onChange={(e) => setEditData({ ...editData, date_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Duração (minutos)</Label>
                <Input
                  type="number"
                  required
                  value={editData.duration}
                  onChange={(e) => setEditData({ ...editData, duration: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
