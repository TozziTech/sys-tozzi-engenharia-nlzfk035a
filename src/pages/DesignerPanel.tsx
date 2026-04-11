import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  HardHat,
  PlayCircle,
  PauseCircle,
  File,
  Download,
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

// Mock Data
const MOCK_PROJECTS = [
  {
    id: 'p1',
    name: 'Residencial Aurora',
    status: 'Em Andamento',
    deadline: '2026-10-15',
    progress: 45,
    lastActivity: 'Atualizou planta baixa',
    client: 'Construtora Alpha',
  },
  {
    id: 'p2',
    name: 'Edifício Horizonte',
    status: 'Atrasado',
    deadline: '2024-05-20',
    progress: 80,
    lastActivity: 'Revisão estrutural pendente',
    client: 'Beta Engenharia',
  },
  {
    id: 'p3',
    name: 'Shopping Central',
    status: 'Planejamento',
    deadline: '2026-12-10',
    progress: 10,
    lastActivity: 'Reunião de kickoff',
    client: 'Malls Brasil',
  },
  {
    id: 'p4',
    name: 'Hospital São João',
    status: 'Concluído',
    deadline: '2025-12-01',
    progress: 100,
    lastActivity: 'Entrega final do as-built',
    client: 'Gov. do Estado',
  },
  {
    id: 'p5',
    name: 'Ponte Estaiada Sul',
    status: 'Em Andamento',
    deadline: addDays(new Date(), 5).toISOString(), // Next 7 days
    progress: 65,
    lastActivity: 'Cálculo de tensões',
    client: 'Prefeitura Municipal',
  },
]

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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [dateFilter, setDateFilter] = useState('Todos')
  const { toast } = useToast()

  const [hoursLog, setHoursLog] = useState({
    hours: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })
  const [isHoursDialogOpen, setIsHoursDialogOpen] = useState(false)
  const [selectedProjectForHours, setSelectedProjectForHours] = useState<string | null>(null)

  const handleLogHours = () => {
    toast({
      title: 'Horas registradas com sucesso!',
      description: `${hoursLog.hours}h registradas no projeto.`,
    })
    setIsHoursDialogOpen(false)
    setHoursLog({ hours: '', description: '', date: format(new Date(), 'yyyy-MM-dd') })
    setSelectedProjectForHours(null)
  }

  const filteredProjects = useMemo(() => {
    const today = new Date()
    return MOCK_PROJECTS.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.client.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'Todos' || p.status === statusFilter

      let matchesDate = true
      const deadlineDate = new Date(p.deadline)
      if (dateFilter === 'Atrasados') {
        matchesDate = isBefore(deadlineDate, today) && p.status !== 'Concluído'
      } else if (dateFilter === 'Proximos7') {
        matchesDate = isAfter(deadlineDate, today) && isBefore(deadlineDate, addDays(today, 7))
      } else if (dateFilter === 'Proximos30') {
        matchesDate = isAfter(deadlineDate, today) && isBefore(deadlineDate, addDays(today, 30))
      }

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [search, statusFilter, dateFilter])

  return (
    <div className="flex-1 space-y-6 p-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <HardHat className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            Painel do Projetista
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Bem-vindo, Eduardo. Gerencie suas atribuições e registre suas horas.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar projeto ou cliente..."
            className="pl-9 bg-slate-50 dark:bg-slate-800/50"
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
              <SelectItem value="Planejamento">Planejamento</SelectItem>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Concluído">Concluído</SelectItem>
              <SelectItem value="Atrasado">Atrasado</SelectItem>
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

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="flex flex-col overflow-hidden hover:shadow-md transition-shadow dark:bg-slate-900/50"
          >
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="text-lg leading-tight">{project.name}</CardTitle>
                  <CardDescription className="font-medium text-slate-500">
                    {project.client}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(project.status)} variant="outline">
                  {getStatusIcon(project.status)}
                  {project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="py-5 flex-1 space-y-5">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> Prazo
                  </span>
                  <span
                    className={
                      new Date(project.deadline) < new Date() && project.status !== 'Concluído'
                        ? 'text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-md'
                        : 'font-medium'
                    }
                  >
                    {format(new Date(project.deadline), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> Última Ativ.
                  </span>
                  <span
                    className="font-medium text-right max-w-[150px] truncate"
                    title={project.lastActivity}
                  >
                    {project.lastActivity}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-600 dark:text-slate-300">Progresso</span>
                  <span
                    className={
                      project.progress === 100 ? 'text-emerald-600 dark:text-emerald-400' : ''
                    }
                  >
                    {project.progress}%
                  </span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-wrap gap-2">
              <Button asChild variant="default" className="flex-1 min-w-[120px] shadow-sm">
                <Link to={`/projects/${project.id}`}>Ver Detalhes</Link>
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 min-w-[120px]">
                    <FileText className="h-4 w-4 mr-2" />
                    Documentos
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Documentos do Projeto</DialogTitle>
                    <DialogDescription>
                      Arquivos e plantas referentes a {project.name}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-4">
                    {[
                      'Planta_Baixa_v2.pdf',
                      'Memorial_Descritivo.docx',
                      'Calculo_Estrutural.xlsx',
                    ].map((doc, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-md">
                            <File className="h-4 w-4 text-indigo-500" />
                          </div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {doc}
                          </span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:text-slate-600"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="secondary"
                className="w-full mt-1 bg-white dark:bg-slate-800 border shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                onClick={() => {
                  setSelectedProjectForHours(project.id)
                  setIsHoursDialogOpen(true)
                }}
              >
                <Clock className="h-4 w-4 mr-2 text-indigo-500" />
                Registrar Horas
              </Button>
            </CardFooter>
          </Card>
        ))}

        {filteredProjects.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <HardHat className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Nenhum projeto encontrado
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Não encontramos nenhum projeto correspondente aos filtros aplicados. Tente ajustar sua
              busca.
            </p>
          </div>
        )}
      </div>

      <Dialog open={isHoursDialogOpen} onOpenChange={setIsHoursDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Horas Trabalhadas</DialogTitle>
            <DialogDescription>Insira o tempo dedicado ao projeto selecionado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data da Atividade</Label>
              <Input
                id="date"
                type="date"
                value={hoursLog.date}
                onChange={(e) => setHoursLog({ ...hoursLog, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">Horas Trabalhadas (Ex: 2.5)</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                placeholder="0.0"
                value={hoursLog.hours}
                onChange={(e) => setHoursLog({ ...hoursLog, hours: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Atividade</Label>
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
            <Button onClick={handleLogHours} disabled={!hoursLog.hours || !hoursLog.description}>
              Salvar Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
