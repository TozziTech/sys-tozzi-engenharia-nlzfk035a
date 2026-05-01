import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Building2,
  Activity,
  Layers,
  ArrowRight,
  Phone,
  Calendar,
  Loader2,
  DollarSign,
  CheckCircle2,
  Clock,
  MessageSquare,
  Download,
} from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { exportClientDashboardPDF } from '@/lib/exportPdf'
import {
  getClientProjects,
  getClientPhases,
  getClientPayments,
  getClientComments,
} from '@/services/client_dashboard'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

export default function ClientDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [projects, setProjects] = useState<any[]>([])
  const [phases, setPhases] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const loadData = async () => {
    if (!user) return
    try {
      const [projs, phs, pays, comms] = await Promise.all([
        getClientProjects(),
        getClientPhases(user.id),
        getClientPayments(user.id),
        getClientComments(user.id),
      ])
      setProjects(projs)
      setPhases(phs)
      setPayments(pays)
      setComments(comms)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])
  useRealtime('projetos_cliente', loadData)
  useRealtime('fases_projeto', loadData)
  useRealtime('pagamentos_projeto', loadData)
  useRealtime('comentarios_projeto', loadData)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const settings = await pb
        .collection('company_settings')
        .getFirstListItem('')
        .catch(() => null)
      exportClientDashboardPDF(user, projects, phases, payments, comments, settings)
    } catch (err) {
      console.error(err)
    } finally {
      setIsExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const avgProgress =
    projects.length > 0
      ? Math.round(projects.reduce((acc, p) => acc + (p.progresso_total || 0), 0) / projects.length)
      : 0
  const phaseStats = phases.reduce(
    (acc, p) => ({ ...acc, [p.status || 'Pendente']: (acc[p.status || 'Pendente'] || 0) + 1 }),
    {} as Record<string, number>,
  )
  const totalPago = payments
    .filter((p) => p.status === 'Pago')
    .reduce((sum, p) => sum + (p.valor || 0), 0)
  const totalPendente = payments
    .filter((p) => p.status === 'Pendente' || p.status === 'Atrasado')
    .reduce((sum, p) => sum + (p.valor || 0), 0)
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 space-y-6 mx-auto animate-fade-in pb-20 max-w-7xl">
      <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10 pointer-events-none" />
        <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center md:items-start gap-6 relative z-10">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
              Bem-vindo(a),{' '}
              <span className="text-primary">{user?.name?.split(' ')[0] || 'Cliente'}</span>!
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-xl">
              Acompanhe o andamento dos seus projetos, status de fases, detalhes financeiros e as
              últimas atualizações da equipe de forma centralizada.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 relative shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full text-primary">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray="100, 100"
                    className="opacity-20"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${avgProgress}, 100`}
                    strokeLinecap="round"
                    className="animate-[spin_1s_ease-out]"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                  {avgProgress}%
                </div>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Progresso</p>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs">Média Geral</p>
              </div>
            </div>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="shadow-sm transition-all whitespace-nowrap"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={CheckCircle2}
          title="Fases Concluídas"
          value={phaseStats['Concluído'] || 0}
          iconClass="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          icon={Clock}
          title="Em Andamento"
          value={phaseStats['Em Andamento'] || 0}
          iconClass="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          icon={DollarSign}
          title="Total Pago"
          value={formatCurrency(totalPago)}
          iconClass="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          icon={Activity}
          title="Pendências"
          value={formatCurrency(totalPendente)}
          iconClass="bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
            <Layers className="w-5 h-5 text-primary" /> Meus Projetos
          </h2>
          {projects.length === 0 ? (
            <Card className="border-dashed bg-transparent">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                <h3 className="text-lg font-bold mb-2 text-zinc-800 dark:text-zinc-100">
                  Nenhum projeto ativo
                </h3>
                <p className="text-zinc-500 text-sm mb-4">
                  Você ainda não possui projetos vinculados.
                </p>
                <Button
                  onClick={() => (window.location.href = 'mailto:contato@tozzi.com')}
                  variant="outline"
                >
                  <Phone className="w-4 h-4 mr-2" /> Atendimento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/gestao/painel-cliente/${project.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 flex flex-col">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
            <MessageSquare className="w-5 h-5 text-primary" /> Atualizações Recentes
          </h2>
          <Card className="flex-1 min-h-[400px] flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 h-[400px]">
              {comments.length > 0 ? (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {comments.map((comment) => (
                    <ActivityItem key={comment.id} comment={comment} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-12">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">Nenhuma atividade recente.</p>
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, title, value, iconClass }: any) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn('p-3 rounded-full shrink-0', iconClass)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 truncate">{title}</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectCard({ project, onClick }: any) {
  const getStatusColor = (status: string) => {
    if (status === 'Concluído') return 'bg-emerald-500 hover:bg-emerald-600 text-white'
    if (status === 'Em Execução') return 'bg-blue-500 hover:bg-blue-600 text-white'
    if (status === 'Planejamento') return 'bg-amber-500 hover:bg-amber-600 text-white'
    return 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
  }

  return (
    <Card
      className="group cursor-pointer hover:border-primary/50 transition-all flex flex-col h-full"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4 mb-2">
          <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
            {project.nome_projeto}
          </CardTitle>
          <Badge
            className={cn('border-transparent shrink-0', getStatusColor(project.status_geral))}
          >
            {project.status_geral}
          </Badge>
        </div>
        <div className="flex items-center text-xs text-zinc-500 gap-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            Início:{' '}
            {project.data_inicio ? format(new Date(project.data_inicio), 'dd/MM/yyyy') : 'N/A'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="mt-auto pb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="font-medium text-zinc-600 dark:text-zinc-300">Progresso</span>
          <span className="font-bold text-primary">{project.progresso_total || 0}%</span>
        </div>
        <Progress value={project.progresso_total || 0} className="h-1.5" />
      </CardContent>
      <CardFooter className="pt-3 bg-zinc-50/50 dark:bg-zinc-900/50 group-hover:bg-primary/5 border-t border-zinc-100 dark:border-zinc-800/50">
        <span className="text-xs font-semibold flex items-center text-primary">
          Acessar projeto{' '}
          <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
        </span>
      </CardFooter>
    </Card>
  )
}

function ActivityItem({ comment }: any) {
  const isSystem = !comment.expand?.autor
  return (
    <div className="p-4 flex gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
      <Avatar className="w-8 h-8 border border-zinc-200 dark:border-zinc-700 shrink-0 mt-0.5">
        <AvatarImage
          src={
            comment.expand?.autor?.avatar
              ? pb.files.getUrl(comment.expand.autor, comment.expand.autor.avatar)
              : undefined
          }
        />
        <AvatarFallback
          className={isSystem ? 'bg-blue-100 text-blue-600' : 'bg-primary/10 text-primary'}
        >
          {isSystem ? (
            <Activity className="w-4 h-4" />
          ) : (
            comment.expand?.autor?.name?.charAt(0) || 'U'
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate pr-2">
            {comment.expand?.autor?.name || 'Sistema'}
          </span>
          <span className="text-[10px] text-zinc-500 whitespace-nowrap shrink-0">
            {formatDistanceToNow(new Date(comment.created), { addSuffix: true, locale: ptBR })}
          </span>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 break-words leading-relaxed">
          {comment.mensagem}
        </p>
        {comment.expand?.projeto_id?.nome_projeto && (
          <p className="text-[10px] font-medium text-primary mt-1.5 truncate">
            Projeto: {comment.expand.projeto_id.nome_projeto}
          </p>
        )}
      </div>
    </div>
  )
}
