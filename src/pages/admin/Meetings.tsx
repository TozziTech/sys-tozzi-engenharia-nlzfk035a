import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Trash, ExternalLink, Pencil, Check, CheckCircle, ChevronsUpDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar } from '@/components/ui/calendar'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import pb from '@/lib/pocketbase/client'
import { getMeetings, createMeeting, updateMeeting, deleteMeeting } from '@/services/meetings'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function Meetings() {
  const [meetings, setMeetings] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState('none')
  const [dateTime, setDateTime] = useState('')
  const [duration, setDuration] = useState('60')
  const [participants, setParticipants] = useState<{ user_id: string; is_mandatory: boolean }[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('none')
  const [templates, setTemplates] = useState<any[]>([])

  const [editOpen, setEditOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [meetingToDelete, setMeetingToDelete] = useState<any | null>(null)

  const [popoverOpen, setPopoverOpen] = useState(false)
  const [searchTitle, setSearchTitle] = useState('')
  const [filterProject, setFilterProject] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [editPopoverOpen, setEditPopoverOpen] = useState(false)

  const loadData = async () => {
    try {
      const [m, u, p, t] = await Promise.all([
        getMeetings(),
        pb.collection('users').getFullList(),
        pb.collection('projects').getFullList({ filter: "status != 'Concluído'" }),
        pb.collection('meeting_templates').getFullList(),
      ])
      setMeetings(m)
      setUsers(u)
      setProjects(p)
      setTemplates(t)
    } catch (e) {
      toast.error('Erro ao carregar dados')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('meetings', loadData)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let minutesContent = ''
      if (selectedTemplate !== 'none') {
        const tmpl = templates.find((t) => t.id === selectedTemplate)
        if (tmpl && tmpl.default_minutes) {
          minutesContent = tmpl.default_minutes
        }
      }

      const newMeeting = await createMeeting({
        title,
        description,
        project: projectId === 'none' ? null : projectId,
        date_time: new Date(dateTime).toISOString(),
        duration: Number(duration),
        participants,
        status: 'Pendente',
        minutes: minutesContent,
      })

      if (selectedTemplate !== 'none') {
        const agendaItems = await pb
          .collection('meeting_template_agenda_items')
          .getFullList({ filter: `template = '${selectedTemplate}'` })
        for (const item of agendaItems) {
          await pb.collection('meeting_agenda_items').create({
            meeting: newMeeting.id,
            topic: item.topic,
            estimated_time: item.estimated_time,
            order: item.order,
          })
        }
      }

      toast.success('Reunião agendada com sucesso!')
      setOpen(false)
      loadData()
      setTitle('')
      setDescription('')
      setProjectId('none')
      setDateTime('')
      setDuration('60')
      setParticipants([])
      setSelectedTemplate('none')
    } catch (err) {
      toast.error('Erro ao salvar reunião')
    }
  }

  const toLocalDatetime = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const tzOffset = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
  }

  const handleEditClick = (meeting: any) => {
    setEditData({
      id: meeting.id,
      title: meeting.title || '',
      description: meeting.description || '',
      project: meeting.project || 'none',
      date_time: meeting.date_time ? toLocalDatetime(meeting.date_time) : '',
      duration: meeting.duration?.toString() || '60',
      status: meeting.status || 'Pendente',
    })
    setEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateMeeting(editData.id, {
        title: editData.title,
        description: editData.description,
        project: editData.project === 'none' ? null : editData.project,
        date_time: new Date(editData.date_time).toISOString(),
        duration: Number(editData.duration),
        status: editData.status,
      })
      toast.success('Reunião atualizada com sucesso!')
      setEditOpen(false)
      loadData()
    } catch (err) {
      toast.error('Erro ao atualizar reunião')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!meetingToDelete) return
    try {
      await deleteMeeting(meetingToDelete.id)
      toast.success('Reunião excluída com sucesso.')
      setDeleteOpen(false)
      setMeetingToDelete(null)
      loadData()
    } catch (err) {
      toast.error('Erro ao excluir reunião')
    }
  }

  const handleFinalize = async (meeting: any) => {
    if (
      !confirm(
        `Finalizar a reunião '${meeting.title}' e enviar a ata por e-mail para os participantes?`,
      )
    )
      return

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
      loadData()
    } catch (err) {
      toast.error('Erro ao finalizar ata')
    }
  }

  const meetingDates = meetings.map((m) => new Date(m.date_time))

  const filteredMeetings = meetings.filter((m) => {
    const matchTitle = m.title.toLowerCase().includes(searchTitle.toLowerCase())
    const matchProject = filterProject === 'all' || m.project === filterProject
    const matchStatus = filterStatus === 'all' || m.status === filterStatus
    return matchTitle && matchProject && matchStatus
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Reuniões</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/reunioes/templates">Gerenciar Templates</Link>
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Agendar Reunião
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Filtros e Calendário</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Buscar por Título</Label>
                <Input
                  placeholder="Ex: Reunião de Alinhamento..."
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Projeto</Label>
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os projetos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os projetos</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Realizada">Realizada</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center border-t pt-6">
              <Calendar
                mode="multiple"
                selected={meetingDates}
                className="rounded-md border shadow"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Próximas Reuniões</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Link (Meet)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMeetings.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.title}</TableCell>
                    <TableCell>{m.expand?.project?.name || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(m.date_time), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{m.participants?.length || 0} convidados</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          m.status === 'Realizada'
                            ? 'default'
                            : m.status === 'Cancelada'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {m.meet_link ? (
                        <a
                          href={m.meet_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                        >
                          <ExternalLink className="h-3 w-3" /> Entrar
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {(m.status === 'Pendente' || m.status === 'Em Andamento') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-green-600"
                          title="Finalizar Ata e Enviar Email"
                          onClick={() => handleFinalize(m)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(m)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => {
                          setMeetingToDelete(m)
                          setDeleteOpen(true)
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/reunioes/${m.id}`}>Detalhes</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMeetings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Nenhuma reunião encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agendar Reunião</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Template (Opcional)</Label>
              <Select
                value={selectedTemplate}
                onValueChange={(v) => {
                  setSelectedTemplate(v)
                  if (v !== 'none') {
                    const tmpl = templates.find((t) => t.id === v)
                    if (tmpl) {
                      if (!title) setTitle(tmpl.name)
                      if (!description) setDescription(tmpl.description || '')
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <Label>Projeto</Label>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                      <span className="truncate">
                        {projectId !== 'none'
                          ? projects.find((p) => p.id === projectId)?.name
                          : 'Nenhum'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar projeto..." />
                      <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setProjectId('none')
                              setPopoverOpen(false)
                            }}
                          >
                            Nenhum
                          </CommandItem>
                          {projects.map((p) => (
                            <CommandItem
                              key={p.id}
                              onSelect={() => {
                                setProjectId(p.id)
                                setPopoverOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  projectId === p.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              {p.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Data e Hora</Label>
                <Input
                  type="datetime-local"
                  required
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Duração (minutos)</Label>
                <Input
                  type="number"
                  required
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Descrição</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adicionar Participante</Label>
              <Select
                onValueChange={(v) => {
                  if (!participants.find((p) => p.user_id === v)) {
                    setParticipants([...participants, { user_id: v, is_mandatory: true }])
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
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

            {participants.length > 0 && (
              <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {participants.map((p) => (
                  <div key={p.user_id} className="flex items-center justify-between text-sm">
                    <span>{users.find((u) => u.id === p.user_id)?.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={p.is_mandatory}
                          onCheckedChange={(c) =>
                            setParticipants(
                              participants.map((x) =>
                                x.user_id === p.user_id ? { ...x, is_mandatory: c } : x,
                              ),
                            )
                          }
                        />
                        <span className="text-xs">Obrigatório</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() =>
                          setParticipants(participants.filter((x) => x.user_id !== p.user_id))
                        }
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button type="submit">Agendar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Reunião</DialogTitle>
          </DialogHeader>
          {editData && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    required
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2 flex flex-col justify-end">
                  <Label>Projeto</Label>
                  <Popover open={editPopoverOpen} onOpenChange={setEditPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between">
                        <span className="truncate">
                          {editData.project !== 'none'
                            ? projects.find((p) => p.id === editData.project)?.name
                            : 'Nenhum'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar projeto..." />
                        <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => {
                                setEditData({ ...editData, project: 'none' })
                                setEditPopoverOpen(false)
                              }}
                            >
                              Nenhum
                            </CommandItem>
                            {projects.map((p) => (
                              <CommandItem
                                key={p.id}
                                onSelect={() => {
                                  setEditData({ ...editData, project: p.id })
                                  setEditPopoverOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    editData.project === p.id ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                {p.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
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
                <div className="space-y-2 col-span-2">
                  <Label>Status</Label>
                  <Select
                    value={editData.status}
                    onValueChange={(v) => setEditData({ ...editData, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Realizada">Realizada</SelectItem>
                      <SelectItem value="Cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Descrição</Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a reunião '{meetingToDelete?.title}'? Esta ação é
              permanente e removerá todos os itens de agenda e documentos vinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMeetingToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDeleteConfirm}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
