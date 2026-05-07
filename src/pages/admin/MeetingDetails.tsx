import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useBlocker } from 'react-router-dom'
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
  CheckSquare,
  CheckCircle,
  FileText,
  Copy,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { exportMeetingMinutesPDF } from '@/lib/exportPdf'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/RichTextEditor'
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
import { Textarea } from '@/components/ui/textarea'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  createMeetingAction,
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
  const [originalMinutesContent, setOriginalMinutesContent] = useState<string>('')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [meetingActions, setMeetingActions] = useState<any[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [summaryText, setSummaryText] = useState('')

  const isMinutesDirty = minutesContent !== originalMinutesContent

  const [topicOpen, setTopicOpen] = useState(false)
  const [newTopic, setNewTopic] = useState({ topic: '', estimated_time: '15', responsible: '' })

  const [editOpen, setEditOpen] = useState(false)
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    date_time: '',
    duration: '60',
  })

  const isDetailsDirty = meeting
    ? editData.title !== meeting.title ||
      editData.description !== (meeting.description || '') ||
      editData.date_time !== format(new Date(meeting.date_time), "yyyy-MM-dd'T'HH:mm") ||
      editData.duration !== meeting.duration.toString()
    : false

  const [deleteMeetingOpen, setDeleteMeetingOpen] = useState(false)
  const [extractModalOpen, setExtractModalOpen] = useState(false)
  const [extractedActions, setExtractedActions] = useState<any[]>([])

  useEffect(() => {
    if (id) loadAll()
  }, [id])

  useRealtime('meetings', (e) => {
    if (e.action === 'delete' && e.record.id === id) {
      navigate('/admin/reunioes')
      return
    }
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
      const [m, a, d, u, mv, acts] = await Promise.all([
        getMeeting(id!),
        getMeetingAgenda(id!),
        getMeetingDocuments(id!),
        pb.collection('users').getFullList(),
        getMeetingMinutesVersions(id!),
        pb
          .collection('meeting_actions')
          .getFullList({ filter: `meeting = '${id}'`, expand: 'responsible,task' }),
      ])
      setMeeting(m)
      setAgenda(a)
      setDocs(d)
      setUsers(u)
      setMinutesVersions(mv)
      setMeetingActions(acts)
      setMinutesContent(m.minutes || '')
      setOriginalMinutesContent(m.minutes || '')
      setEditData({
        title: m.title,
        description: m.description || '',
        date_time: format(new Date(m.date_time), "yyyy-MM-dd'T'HH:mm"),
        duration: m.duration.toString(),
      })
    } catch (e: any) {
      if (e?.status === 404) {
        toast.error('Reunião não encontrada ou foi excluída.')
      } else {
        toast.error('Erro ao carregar reunião')
      }
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

      setOriginalMinutesContent(minutesContent)
      setLastSaved(new Date())

      toast.success('Reunião atualizada com sucesso')
      loadAll()
    } catch (e) {
      toast.error('Erro ao salvar ata')
    }
  }

  const handleUpdateDetails = async (e?: React.FormEvent | Event) => {
    if (e) e.preventDefault()
    try {
      await updateMeeting(id!, {
        title: editData.title,
        description: editData.description,
        date_time: new Date(editData.date_time).toISOString(),
        duration: Number(editData.duration),
      })
      toast.success('Reunião atualizada com sucesso')
      setEditOpen(false)
      loadAll()
    } catch (err) {
      toast.error('Erro ao atualizar reunião')
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (editOpen && isDetailsDirty) {
          e.preventDefault()
          handleUpdateDetails(e as any)
          return
        }
        if (meeting?.status === 'Realizada' && selectedVersion === 'latest' && isMinutesDirty) {
          e.preventDefault()
          handleSaveMinutes()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    meeting,
    selectedVersion,
    minutesContent,
    minutesVersions,
    editOpen,
    isDetailsDirty,
    editData,
    isMinutesDirty,
  ])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if ((isMinutesDirty && selectedVersion === 'latest') || (editOpen && isDetailsDirty)) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isMinutesDirty, selectedVersion, editOpen, isDetailsDirty])

  useBlocker(({ currentLocation, nextLocation }) => {
    if (
      ((isMinutesDirty && selectedVersion === 'latest') || (editOpen && isDetailsDirty)) &&
      currentLocation.pathname !== nextLocation.pathname
    ) {
      return !window.confirm('Você tem alterações não salvas. Deseja realmente sair?')
    }
    return false
  })

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
    try {
      await deleteMeeting(id!)
      toast.success('Reunião excluída com sucesso.')
      navigate('/admin/reunioes')
    } catch (e) {
      toast.error('Erro ao excluir reunião')
    }
  }

  const handleFinalizeAta = async () => {
    if (!confirm('Deseja finalizar a ata e enviar por e-mail para todos os participantes?')) return

    const participantsWithNoEmail: string[] = []
    for (const pId of meeting.participants || []) {
      const u = users.find((u) => u.id === pId)
      if (u && !u.email) participantsWithNoEmail.push(u.name || 'Desconhecido')
    }

    try {
      await updateMeeting(meeting.id, { status: 'Realizada' })
      toast.success('Ata finalizada! O envio de e-mails foi agendado.')
      if (participantsWithNoEmail.length > 0) {
        toast.warning(`Participantes sem e-mail: ${participantsWithNoEmail.join(', ')}`)
      }
      loadAll()
    } catch (err) {
      toast.error('Erro ao finalizar ata')
    }
  }

  const handleExtractActions = () => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = minutesContent
    tempDiv.style.position = 'absolute'
    tempDiv.style.visibility = 'hidden'
    tempDiv.style.whiteSpace = 'pre-wrap'
    document.body.appendChild(tempDiv)
    const text = tempDiv.innerText || ''
    document.body.removeChild(tempDiv)

    const lines = text.split('\n')
    const actions = lines
      .map((l) => l.trim())
      .filter((l) => l.startsWith('[ ]'))
      .map((l, i) => {
        let text = l.replace('[ ]', '').trim()
        let prio = 'Média'
        const prioMatch = text.match(/^\[(.*?)\]/)
        if (
          prioMatch &&
          ['alta', 'media', 'média', 'baixa', 'urgente'].includes(prioMatch[1].toLowerCase())
        ) {
          prio = prioMatch[1].charAt(0).toUpperCase() + prioMatch[1].slice(1).toLowerCase()
          if (prio === 'Media') prio = 'Média'
          text = text.replace(prioMatch[0], '').trim()
        }
        return {
          id: i,
          description: text,
          responsible: 'none',
          due_date: '',
          priority: prio,
        }
      })

    if (actions.length === 0) {
      toast.info('Nenhuma ação encontrada com o formato "[ ]". Insira [ ] no início da linha.')
      return
    }
    setExtractedActions(actions)
    setExtractModalOpen(true)
  }

  const confirmExtractedActions = async () => {
    try {
      for (const action of extractedActions) {
        if (!action.description) continue

        let taskId = null
        if (action.responsible !== 'none') {
          const taskData = {
            title: action.description,
            due_date: action.due_date ? new Date(action.due_date + 'T12:00:00Z').toISOString() : '',
            responsible: action.responsible,
            project: meeting.project || null,
            status: 'Pendente',
            priority: action.priority || 'Média',
          }
          const createdTask = await pb.collection('tasks').create(taskData)
          taskId = createdTask.id
        }

        await createMeetingAction({
          meeting: id,
          description: action.description,
          responsible: action.responsible !== 'none' ? action.responsible : null,
          due_date: action.due_date ? new Date(action.due_date + 'T12:00:00Z').toISOString() : null,
          status: 'Pendente',
          task: taskId,
        })
      }
      toast.success(`${extractedActions.length} ações geradas com sucesso!`)
      setExtractModalOpen(false)
      loadAll()
    } catch (err) {
      toast.error('Erro ao gerar ações')
    }
  }

  const doExportPDF = async (contentToExport: string) => {
    setIsExporting(true)
    try {
      const participants = users.filter((u) => (meeting.participants || []).includes(u.id))
      const settingsList = await pb.collection('company_settings').getFullList()
      const companySettings = settingsList[0] || null
      exportMeetingMinutesPDF(
        meeting,
        contentToExport,
        user?.name || 'Sistema',
        companySettings,
        participants,
        meetingActions,
      )
    } catch (e) {
      toast.error('Erro ao exportar PDF')
    } finally {
      setIsExporting(false)
    }
  }

  const handleGenerateSummary = () => {
    let text = `Resumo da Reunião: ${meeting.title}\n`
    text += `Data: ${format(new Date(meeting.date_time), 'dd/MM/yyyy HH:mm')}\n`
    text += `Projeto: ${meeting.expand?.project?.name || 'N/A'}\n\n`

    text += `PARTICIPANTES\n`
    const attendance = meeting.attendance || []
    const present = users
      .filter((u) => (meeting.participants || []).includes(u.id) && attendance.includes(u.id))
      .map((p) => p.name || p.email)
    const absent = users
      .filter((u) => (meeting.participants || []).includes(u.id) && !attendance.includes(u.id))
      .map((p) => p.name || p.email)
    text += `Presentes: ${present.length > 0 ? present.join(', ') : 'Nenhum'}\n`
    text += `Ausentes: ${absent.length > 0 ? absent.join(', ') : 'Nenhum'}\n\n`

    text += `PAUTA\n`
    if (agenda.length > 0) {
      agenda.forEach((a) => {
        text += `- ${a.topic} (${a.estimated_time} min)\n`
      })
    } else {
      text += `Nenhum tópico de pauta.\n`
    }
    text += `\n`

    text += `NOTAS (ATA)\n`
    const contentToParse =
      selectedVersion === 'latest'
        ? minutesContent
        : minutesVersions.find((v) => v.id === selectedVersion)?.content || ''
    const strippedMinutes = contentToParse
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim()
    text += `${strippedMinutes || 'Nenhuma nota registrada.'}\n\n`

    text += `AÇÕES PENDENTES\n`
    if (meetingActions.length > 0) {
      meetingActions.forEach((a) => {
        const resp = a.expand?.responsible?.name || 'Sem responsável'
        const due = a.due_date ? format(new Date(a.due_date), 'dd/MM/yyyy') : 'Sem prazo'
        text += `- [ ] ${a.description} (Resp: ${resp} | Prazo: ${due})\n`
      })
    } else {
      text += `Nenhuma ação registrada.\n`
    }

    setSummaryText(text)
    setSummaryOpen(true)
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
              onClick={() => setDeleteMeetingOpen(true)}
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
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={handleGenerateSummary} size="sm">
            <FileText className="h-4 w-4 mr-2" /> Gerar Resumo
          </Button>
          <Button
            variant="outline"
            disabled={isExporting}
            onClick={() => {
              const content =
                selectedVersion === 'latest'
                  ? minutesContent
                  : minutesVersions.find((v) => v.id === selectedVersion)?.content || ''
              doExportPDF(content)
            }}
            size="sm"
          >
            {isExporting ? (
              <div className="h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}{' '}
            Exportar PDF
          </Button>
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
          {(meeting.status === 'Pendente' || meeting.status === 'Em Andamento') && (
            <Button
              onClick={handleFinalizeAta}
              variant="outline"
              className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950"
              size="sm"
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Finalizar Ata
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
                  <div className="flex items-center gap-2">
                    {selectedVersion === 'latest' && (
                      <Button variant="secondary" onClick={handleExtractActions}>
                        <CheckSquare className="h-4 w-4 mr-2" /> Gerar Ações
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      disabled={isExporting}
                      onClick={() => {
                        const content =
                          selectedVersion === 'latest'
                            ? minutesContent
                            : minutesVersions.find((v) => v.id === selectedVersion)?.content || ''
                        doExportPDF(content)
                      }}
                    >
                      {isExporting ? (
                        <div className="h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Gerar PDF
                    </Button>
                  </div>
                </div>

                {selectedVersion === 'latest' ? (
                  <div className="space-y-4">
                    <div
                      className={cn(
                        'border-2 rounded-md min-h-[300px] bg-white flex flex-col transition-colors',
                        isMinutesDirty ? 'border-amber-300' : 'border-border',
                      )}
                    >
                      <RichTextEditor
                        className="flex-1 border-0"
                        value={minutesContent}
                        onChange={setMinutesContent}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleSaveMinutes}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-2" /> Salvar Alterações
                      </Button>
                      {isMinutesDirty && (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-600 border-amber-300"
                        >
                          Pendente de salvamento
                        </Badge>
                      )}
                      {lastSaved && !isMinutesDirty && (
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <CheckSquare className="h-3 w-3" />
                          Último salvamento: {format(lastSaved, 'HH:mm:ss')}
                        </span>
                      )}
                    </div>
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
            <DialogFooter className="sm:justify-between items-center">
              <div>
                {isDetailsDirty && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-300">
                    Pendente de salvamento
                  </Badge>
                )}
              </div>
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

      <AlertDialog open={deleteMeetingOpen} onOpenChange={setDeleteMeetingOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a reunião '{meeting.title}'? Esta ação é permanente e
              removerá todos os itens de agenda e documentos vinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMeeting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={extractModalOpen} onOpenChange={setExtractModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerar Ações a partir da Ata</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {extractedActions.map((action, idx) => (
              <div
                key={action.id}
                className="flex flex-col md:flex-row gap-3 p-3 border rounded-md items-start md:items-center bg-zinc-50 dark:bg-zinc-900"
              >
                <Input
                  className="flex-1 bg-white dark:bg-zinc-950"
                  value={action.description}
                  onChange={(e) => {
                    const newActs = [...extractedActions]
                    newActs[idx].description = e.target.value
                    setExtractedActions(newActs)
                  }}
                  placeholder="Descrição da ação..."
                />
                <Select
                  value={action.responsible}
                  onValueChange={(val) => {
                    const newActs = [...extractedActions]
                    newActs[idx].responsible = val
                    setExtractedActions(newActs)
                  }}
                >
                  <SelectTrigger className="w-[180px] bg-white dark:bg-zinc-950">
                    <SelectValue placeholder="Responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem Responsável</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  className="w-[150px] bg-white dark:bg-zinc-950"
                  value={action.due_date}
                  onChange={(e) => {
                    const newActs = [...extractedActions]
                    newActs[idx].due_date = e.target.value
                    setExtractedActions(newActs)
                  }}
                />
                <Select
                  value={action.priority}
                  onValueChange={(val) => {
                    const newActs = [...extractedActions]
                    newActs[idx].priority = val
                    setExtractedActions(newActs)
                  }}
                >
                  <SelectTrigger className="w-[120px] bg-white dark:bg-zinc-950">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500"
                  onClick={() => {
                    setExtractedActions(extractedActions.filter((_, i) => i !== idx))
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {extractedActions.length === 0 && (
              <p className="text-sm text-zinc-500">Nenhuma ação na lista.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtractModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmExtractedActions} disabled={extractedActions.length === 0}>
              Criar {extractedActions.length} Ações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Resumo da Reunião</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Textarea
              className="min-h-[50vh] font-mono text-sm leading-relaxed"
              value={summaryText}
              readOnly
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSummaryOpen(false)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(summaryText)
                toast.success('Resumo copiado para a área de transferência!')
              }}
            >
              <Copy className="h-4 w-4 mr-2" /> Copiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
