import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useBlocker } from 'react-router-dom'
import { Clock, Save, Plus, StopCircle, FastForward, CheckSquare } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { RichTextEditor } from '@/components/RichTextEditor'
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
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'
import {
  getMeeting,
  getMeetingAgenda,
  updateMeeting,
  createMeetingAction,
  getMeetingTemplates,
} from '@/services/meetings'
import { useRealtime } from '@/hooks/use-realtime'

export default function MeetingInProgress() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [meeting, setMeeting] = useState<any>(null)
  const [agenda, setAgenda] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])

  const [minutes, setMinutes] = useState('')
  const [originalMinutes, setOriginalMinutes] = useState('')
  const [attendance, setAttendance] = useState<string[]>([])
  const [originalAttendance, setOriginalAttendance] = useState<string[]>([])
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const isDirty =
    minutes !== originalMinutes || JSON.stringify(attendance) !== JSON.stringify(originalAttendance)

  const [currentTopicIndex, setCurrentTopicIndex] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const [actionModal, setActionModal] = useState(false)
  const [newAction, setNewAction] = useState({ description: '', responsible: '', due_date: '' })

  const minutesRef = useRef(minutes)
  const attendanceRef = useRef(attendance)

  useEffect(() => {
    minutesRef.current = minutes
  }, [minutes])
  useEffect(() => {
    attendanceRef.current = attendance
  }, [attendance])

  useEffect(() => {
    if (id) loadData()
  }, [id])

  useRealtime('meetings', (e) => {
    if (e.action === 'delete' && e.record.id === id) {
      navigate('/admin/reunioes')
      return
    }
    if (id) loadData()
  })
  useRealtime('meeting_agenda_items', () => {
    if (id) loadData()
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const loadData = async () => {
    try {
      const m = await getMeeting(id!)
      if (m.status !== 'Em Andamento') {
        toast.error('Reunião não está em andamento.')
        navigate(`/admin/reunioes/${id}`)
        return
      }
      const a = await getMeetingAgenda(id!)

      let pUsers: any[] = []
      if (m.participants && Array.isArray(m.participants) && m.participants.length > 0) {
        const filterStr = m.participants.map((pid: string) => `id='${pid}'`).join(' || ')
        pUsers = await pb.collection('users').getFullList({ filter: filterStr })
      }

      const allU = await pb.collection('users').getFullList()
      const t = await getMeetingTemplates()

      setMeeting(m)
      setTemplates(t)
      setAgenda(a)
      setMinutes(m.minutes || '')
      setOriginalMinutes(m.minutes || '')
      setAttendance(m.attendance || [])
      setOriginalAttendance(m.attendance || [])
      setParticipants(pUsers)
      setAllUsers(allU)
    } catch (e: any) {
      if (e?.status === 404) {
        toast.error('Reunião não encontrada ou foi excluída.')
      } else {
        toast.error('Erro ao carregar reunião')
      }
      navigate('/admin/reunioes')
    }
  }

  const handleManualSave = async () => {
    if (!meeting) return
    try {
      await updateMeeting(meeting.id, {
        minutes: minutesRef.current,
        attendance: attendanceRef.current,
      })
      setOriginalMinutes(minutesRef.current)
      setOriginalAttendance(attendanceRef.current)
      setLastSaved(new Date())
      toast.success('Reunião atualizada com sucesso')
    } catch (err) {
      console.error('Save failed', err)
      toast.error('Erro ao salvar alterações.')
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleManualSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [meeting])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  useBlocker(({ currentLocation, nextLocation }) => {
    if (isDirty && currentLocation.pathname !== nextLocation.pathname) {
      return !window.confirm('Você tem alterações não salvas. Deseja realmente sair?')
    }
    return false
  })

  const toggleAttendance = (userId: string) => {
    setAttendance((prev) => {
      if (prev.includes(userId)) return prev.filter((i) => i !== userId)
      return [...prev, userId]
    })
  }

  const nextTopic = () => {
    if (currentTopicIndex < agenda.length - 1) {
      setCurrentTopicIndex((i) => i + 1)
      setElapsedSeconds(0)
    } else {
      toast.info('Último tópico atingido.')
    }
  }

  const finishMeeting = async () => {
    if (!confirm('Deseja encerrar a reunião e salvar a ata final?')) return
    try {
      await updateMeeting(meeting.id, {
        status: 'Realizada',
        minutes: minutesRef.current,
        attendance: attendanceRef.current,
      })
      toast.success('Reunião encerrada')
      navigate(`/admin/reunioes/${meeting.id}`)
    } catch (e) {
      toast.error('Erro ao encerrar reunião')
    }
  }

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createMeetingAction({
        meeting: id,
        description: newAction.description,
        responsible: newAction.responsible,
        due_date: newAction.due_date || null,
        status: 'Pendente',
      })
      toast.success('Action item criado')
      setActionModal(false)
      setNewAction({ description: '', responsible: '', due_date: '' })
    } catch (err) {
      toast.error('Erro ao criar action item')
    }
  }

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60)
      .toString()
      .padStart(2, '0')
    const s = (totalSecs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const applyTemplate = (templateId: string) => {
    if (templateId === 'none') return
    const t = templates.find((x) => x.id === templateId)
    if (!t) return

    let content = t.default_minutes || ''

    const title = meeting.title || ''
    const projectName = meeting.expand?.project?.name || ''
    const dateStr = format(new Date(meeting.date_time), 'dd/MM/yyyy')
    const timeStr = format(new Date(meeting.date_time), 'HH:mm')
    const parts = participants.map((p) => p.name || p.email).join(', ')

    content = content.replace(/{{meeting_title}}/g, title)
    content = content.replace(/{{project_name}}/g, projectName)
    content = content.replace(/{{meeting_date}}/g, dateStr)
    content = content.replace(/{{meeting_time}}/g, timeStr)
    content = content.replace(/{{participants}}/g, parts)

    setMinutes((prev) => prev + (prev ? '<br><br>' : '') + content)
    toast.success('Template aplicado com sucesso!')
  }

  if (!meeting) return null

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col space-y-4">
      <div className="flex justify-between items-center bg-white dark:bg-zinc-950 p-4 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            {meeting.title}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Ao vivo - {format(new Date(), 'dd/MM/yyyy')}</p>
        </div>
        <div className="space-x-3 flex items-center">
          {isDirty && (
            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-300">
              Pendente de salvamento
            </Badge>
          )}
          <Button variant="secondary" onClick={handleManualSave}>
            <Save className="h-4 w-4 mr-2" /> Salvar Alterações
          </Button>
          <Button variant="outline" onClick={() => setActionModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> Criar Action Item
          </Button>
          <Button variant="destructive" onClick={finishMeeting}>
            <StopCircle className="h-4 w-4 mr-2" /> Encerrar Reunião
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="col-span-1 flex flex-col space-y-6 overflow-y-auto pr-2">
          <Card className="flex-1">
            <CardHeader className="pb-4">
              <CardTitle>Pauta da Reunião</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {agenda.length > 0 ? (
                agenda.map((a, i) => {
                  const isActive = i === currentTopicIndex
                  const isPast = i < currentTopicIndex
                  return (
                    <div
                      key={a.id}
                      className={cn(
                        'p-4 rounded-lg border transition-all',
                        isActive
                          ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900 shadow-sm'
                          : isPast
                            ? 'bg-zinc-50 opacity-60 border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800'
                            : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800',
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-sm">
                          {isPast && <CheckSquare className="inline h-4 w-4 mr-2 text-green-500" />}
                          {a.topic}
                        </div>
                        <span className="text-xs text-zinc-500 font-medium bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                          {a.estimated_time} min
                        </span>
                      </div>

                      {isActive && (
                        <div className="mt-4 pt-4 border-t flex items-center justify-between">
                          <div className="flex items-center text-2xl font-mono tracking-tight text-blue-600 dark:text-blue-400">
                            <Clock className="h-5 w-5 mr-2 opacity-50" />
                            {formatTime(elapsedSeconds)}
                          </div>
                          <Button
                            onClick={nextTopic}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Próximo <FastForward className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-zinc-500 text-center py-8">Nenhuma pauta definida.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2 flex flex-col space-y-6 min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="py-3 flex flex-row items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/20 border-b">
              <div className="flex items-center gap-4">
                <CardTitle className="text-base font-semibold">Ata (Minutos)</CardTitle>
                <Select onValueChange={applyTemplate}>
                  <SelectTrigger className="h-8 w-[200px] text-xs bg-white dark:bg-zinc-950">
                    <SelectValue placeholder="Carregar Template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione...</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs font-medium text-zinc-500 flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                <Save className="h-3.5 w-3.5" />
                {lastSaved
                  ? `Último salvamento: ${format(lastSaved, 'HH:mm:ss')}`
                  : 'Ainda não salvo'}
              </div>
            </CardHeader>
            <CardContent
              className={cn(
                'flex-1 flex flex-col p-0 rounded-b-lg transition-colors border-2',
                isDirty ? 'border-amber-300' : 'border-transparent',
              )}
            >
              <div className="flex-1 min-h-0 flex flex-col relative">
                <RichTextEditor
                  className="flex-1 border-0 focus-visible:ring-0 rounded-none rounded-b-lg text-base leading-relaxed"
                  value={minutes}
                  onChange={setMinutes}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-base font-semibold">Lista de Presença</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center space-x-3 p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <Checkbox
                      id={`p-${p.id}`}
                      checked={attendance.includes(p.id)}
                      onCheckedChange={() => toggleAttendance(p.id)}
                    />
                    <Label htmlFor={`p-${p.id}`} className="cursor-pointer text-sm font-medium">
                      {p.name || p.email}
                    </Label>
                  </div>
                ))}
                {participants.length === 0 && (
                  <p className="text-sm text-zinc-500 col-span-full">
                    Nenhum participante registrado para esta reunião.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={actionModal} onOpenChange={setActionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Action Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAction} className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição da Ação</Label>
              <Textarea
                required
                value={newAction.description}
                onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                placeholder="O que precisa ser feito..."
              />
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select
                required
                value={newAction.responsible}
                onValueChange={(v) => setNewAction({ ...newAction, responsible: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Input
                type="date"
                required
                value={newAction.due_date}
                onChange={(e) => setNewAction({ ...newAction, due_date: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Criar Ação</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
