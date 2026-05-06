import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Trash, ExternalLink } from 'lucide-react'
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
import pb from '@/lib/pocketbase/client'
import { getMeetings, createMeeting } from '@/services/meetings'
import { toast } from 'sonner'

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

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [m, u, p] = await Promise.all([
        getMeetings(),
        pb.collection('users').getFullList(),
        pb.collection('projects').getFullList({ filter: "status != 'Concluído'" }),
      ])
      setMeetings(m)
      setUsers(u)
      setProjects(p)
    } catch (e) {
      toast.error('Erro ao carregar dados')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createMeeting({
        title,
        description,
        project: projectId === 'none' ? null : projectId,
        date_time: new Date(dateTime).toISOString(),
        duration: Number(duration),
        participants,
        status: 'Pendente',
      })
      toast.success('Reunião agendada com sucesso!')
      setOpen(false)
      loadData()
      setTitle('')
      setDescription('')
      setProjectId('none')
      setDateTime('')
      setDuration('60')
      setParticipants([])
    } catch (err) {
      toast.error('Erro ao salvar reunião')
    }
  }

  const meetingDates = meetings.map((m) => new Date(m.date_time))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Reuniões</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Agendar Reunião
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="multiple"
              selected={meetingDates}
              className="rounded-md border shadow"
            />
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
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((m) => (
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
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/reunioes/${m.id}`}>Detalhes</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {meetings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Nenhuma reunião agendada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agendar Reunião</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Projeto</Label>{' '}
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
    </div>
  )
}
