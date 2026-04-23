import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  HardHat,
  PlayCircle,
  PauseCircle,
  Loader2,
} from 'lucide-react'
import { format, isAfter, isBefore, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Concluído':
      return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
    case 'Em Andamento':
      return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
    case 'Atrasado':
      return 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
    default:
      return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Concluído':
      return <CheckCircle2 className="w-4 h-4 mr-1" />
    case 'Em Andamento':
      return <PlayCircle className="w-4 h-4 mr-1" />
    case 'Atrasado':
      return <AlertCircle className="w-4 h-4 mr-1" />
    default:
      return <PauseCircle className="w-4 h-4 mr-1" />
  }
}

export default function DesignerPanel() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [dateFilter, setDateFilter] = useState('Todos')
  const { toast } = useToast()

  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [hoursLog, setHoursLog] = useState({
    startTime: '',
    endTime: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })
  const [isHoursDialogOpen, setIsHoursDialogOpen] = useState(false)
  const [selectedProjectForHours, setSelectedProjectForHours] = useState<any>(null)

  const loadData = async () => {
    if (!user) return
    try {
      setLoading(true)
      // Fetch modules where user is responsible or designer
      const records = await pb.collection('project_modules').getFullList({
        filter: `responsible = "${user.id}" || designer = "${user.id}"`,
        expand: 'project',
        sort: '-created',
      })
      setModules(records)
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar suas disciplinas',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('project_modules', loadData)

  const handleLogHours = async () => {
    if (!hoursLog.date || !hoursLog.startTime || !hoursLog.endTime || !hoursLog.description) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    const start = new Date(`2000-01-01T${hoursLog.startTime}`)
    const end = new Date(`2000-01-01T${hoursLog.endTime}`)

    if (end <= start) {
      toast({
        title: 'Horário inválido',
        description: 'O horário de término deve ser posterior ao horário de início.',
        variant: 'destructive',
      })
      return
    }

    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    try {
      if (selectedProjectForHours) {
        await pb.collection('time_logs').create({
          user_id: user.id,
          project_id: selectedProjectForHours.project,
          hours: durationHours,
          date: hoursLog.date + ' 12:00:00.000Z',
          description: hoursLog.description,
        })
      }

      toast({
        title: 'Horas registradas com sucesso!',
        description: `${durationHours.toFixed(1)}h registradas na disciplina.`,
      })
      setIsHoursDialogOpen(false)
      setHoursLog({
        startTime: '',
        endTime: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      })
      setSelectedProjectForHours(null)
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  const filteredModules = useMemo(() => {
    const today = new Date()
    return modules.filter((m) => {
      const projectName = m.expand?.project?.name || ''
      const moduleName = m.name || ''

      const matchesSearch =
        projectName.toLowerCase().includes(search.toLowerCase()) ||
        moduleName.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'Todos' || m.status === statusFilter

      let matchesDate = true
      if (m.deadline) {
        const deadlineDate = new Date(m.deadline)
        if (dateFilter === 'Atrasados') {
          matchesDate = isBefore(deadlineDate, today) && m.status !== 'Concluído'
        } else if (dateFilter === 'Proximos7') {
          matchesDate = isAfter(deadlineDate, today) && isBefore(deadlineDate, addDays(today, 7))
        } else if (dateFilter === 'Proximos30') {
          matchesDate = isAfter(deadlineDate, today) && isBefore(deadlineDate, addDays(today, 30))
        }
      } else if (dateFilter !== 'Todos') {
        matchesDate = false
      }

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [modules, search, statusFilter, dateFilter])

  return (
    <div className="flex-1 space-y-6 p-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <HardHat className="h-6 w-6 text-amber-500" />
            </div>
            Painel do Projetista
          </h2>
          <p className="text-zinc-400 mt-2">
            Bem-vindo, {user?.name || 'Projetista'}. Gerencie suas disciplinas e registre suas
            horas.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center bg-zinc-900/50 backdrop-blur-md p-4 rounded-xl border border-zinc-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Buscar projeto ou disciplina..."
            className="pl-9 bg-zinc-950/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Status</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Concluído">Concluído</SelectItem>
              <SelectItem value="Pausado">Pausado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Prazo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Prazos</SelectItem>
              <SelectItem value="Atrasados">Atrasados</SelectItem>
              <SelectItem value="Proximos7">Próximos 7 dias</SelectItem>
              <SelectItem value="Proximos30">Próximos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredModules.map((mod) => (
            <Card
              key={mod.id}
              className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow border-zinc-800/50"
            >
              <CardHeader className="pb-4 border-b border-zinc-800/50">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 flex-1 pr-2">
                    <CardTitle className="text-lg leading-tight line-clamp-1 text-zinc-100">
                      {mod.name}
                    </CardTitle>
                    <CardDescription className="font-medium text-zinc-400 line-clamp-1">
                      Projeto: {mod.expand?.project?.name || 'Desconhecido'}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(mod.status)} variant="outline">
                    {getStatusIcon(mod.status)}
                    {mod.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="py-5 flex-1 space-y-5">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" /> Prazo
                    </span>
                    <span
                      className={
                        mod.deadline &&
                        new Date(mod.deadline) < new Date() &&
                        mod.status !== 'Concluído'
                          ? 'text-rose-400 font-medium bg-rose-900/20 px-2 py-0.5 rounded-md border border-rose-500/20'
                          : 'font-medium text-zinc-300'
                      }
                    >
                      {mod.deadline
                        ? format(new Date(mod.deadline), "dd 'de' MMM, yyyy", { locale: ptBR })
                        : 'Não definido'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> Última Ativ.
                    </span>
                    <span className="font-medium text-right max-w-[150px] truncate text-zinc-300">
                      {format(new Date(mod.updated), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-zinc-400">Progresso</span>
                    <span className={mod.progress === 100 ? 'text-emerald-400' : 'text-amber-500'}>
                      {mod.progress || 0}%
                    </span>
                  </div>
                  <Progress value={mod.progress || 0} className="h-2" />
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-zinc-800/50 bg-zinc-950/30 flex flex-wrap gap-2">
                <Button asChild variant="default" className="flex-1 min-w-[120px]">
                  <Link to={`/projects/${mod.project}/disciplines/${mod.id}`}>
                    Acessar Disciplina
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 min-w-[120px]"
                  onClick={() => {
                    setSelectedProjectForHours(mod)
                    setIsHoursDialogOpen(true)
                  }}
                >
                  <Clock className="h-4 w-4 mr-2 text-amber-500" />
                  Lançar Horas
                </Button>
              </CardFooter>
            </Card>
          ))}

          {filteredModules.length === 0 && (
            <div className="col-span-full py-16 text-center bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800/50 mb-4">
                <HardHat className="h-8 w-8 text-zinc-500" />
              </div>
              <h3 className="text-lg font-medium text-zinc-100 mb-2">
                Nenhuma disciplina encontrada
              </h3>
              <p className="text-zinc-400 max-w-sm mx-auto">
                Não encontramos nenhuma disciplina atribuída a você ou correspondente aos filtros.
              </p>
            </div>
          )}
        </div>
      )}

      <Dialog open={isHoursDialogOpen} onOpenChange={setIsHoursDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Horas Trabalhadas</DialogTitle>
            <DialogDescription>Insira o tempo dedicado a esta disciplina.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Input
                value={selectedProjectForHours?.name || ''}
                readOnly
                disabled
                className="bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data da Atividade *</Label>
              <Input
                id="date"
                type="date"
                value={hoursLog.date}
                onChange={(e) => setHoursLog({ ...hoursLog, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Hora de Início *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={hoursLog.startTime}
                  onChange={(e) => setHoursLog({ ...hoursLog, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Hora de Término *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={hoursLog.endTime}
                  onChange={(e) => setHoursLog({ ...hoursLog, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Atividade *</Label>
              <Textarea
                id="description"
                placeholder="Descreva brevemente o que foi realizado..."
                className="resize-none h-24"
                value={hoursLog.description}
                onChange={(e) => setHoursLog({ ...hoursLog, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsHoursDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLogHours}>Salvar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
