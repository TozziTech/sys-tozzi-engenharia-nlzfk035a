import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  getClientProjects,
  getClientPhases,
  getClientPayments,
  getClientComments,
} from '@/services/client_dashboard'
import pb from '@/lib/pocketbase/client'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

export default function ClientDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [projects, setProjects] = useState<any[]>([])
  const [phases, setPhases] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent'
      case 'Em Execução':
        return 'bg-blue-500 hover:bg-blue-600 text-white border-transparent'
      case 'Planejamento':
        return 'bg-amber-500 hover:bg-amber-600 text-white border-transparent'
      default:
        return 'bg-zinc-200 text-zinc-800 border-transparent dark:bg-zinc-800 dark:text-zinc-200'
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

  const progressData = [
    { name: 'Concluído', value: avgProgress, color: 'hsl(var(--primary))' },
    { name: 'Restante', value: 100 - avgProgress, color: 'hsl(var(--muted))' },
  ]

  const phaseStats = phases.reduce(
    (acc, p) => {
      const st = p.status || 'Pendente'
      acc[st] = (acc[st] || 0) + 1
      return acc
    },
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
    <div className="w-full p-4 md:p-6 lg:p-8 space-y-8 mx-auto animate-fade-in pb-20 max-w-7xl">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-elevation">
        <div className="absolute inset-0 bg-[url('https://img.usecurling.com/p/800/400?q=modern%20architecture&color=gray')] opacity-[0.03] dark:opacity-10 bg-cover bg-center mix-blend-overlay" />
        <div className="relative p-8 md:p-12 backdrop-blur-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-zinc-900 dark:text-zinc-50 animate-fade-in-up">
              Bem-vindo(a),{' '}
              <span className="text-primary">{user?.name?.split(' ')[0] || 'Cliente'}</span>!
            </h1>
            <p
              className="text-zinc-600 dark:text-zinc-400 text-lg md:text-xl max-w-2xl animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              Acompanhe o andamento dos seus projetos, status de fases, detalhes financeiros e as
              últimas atualizações da equipe em tempo real.
            </p>
          </div>
          <div
            className="hidden md:flex w-32 h-32 relative flex-shrink-0 animate-fade-in-up"
            style={{ animationDelay: '150ms' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={progressData}
                  innerRadius={40}
                  outerRadius={60}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  {progressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {avgProgress}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Widgets Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in-up"
        style={{ animationDelay: '200ms' }}
      >
        {/* Left Column: Progress & Financial */}
        <div className="md:col-span-4 space-y-6">
          {/* Status Fases Widget */}
          <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                <Activity className="w-5 h-5 text-primary" />
                Status das Fases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">Concluídas</span>
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-50">
                    {phaseStats['Concluído'] || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <Loader2 className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Em Andamento</span>
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-50">
                    {phaseStats['Em Andamento'] || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">Pendentes</span>
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-50">
                    {(phaseStats['Pendente'] || 0) + (phaseStats['Aguardando Aprovação'] || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Status Widget */}
          <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                <DollarSign className="w-5 h-5 text-primary" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 mt-2">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                    Total Pago
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(totalPago)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
                    Pendente
                  </p>
                  <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                    {formatCurrency(totalPendente)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center/Right Column: Projects List & Activity Feed */}
        <div className="md:col-span-8 space-y-6">
          {/* Projects */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
              <Layers className="w-6 h-6 text-primary" /> Meus Projetos
            </h2>
          </div>

          {projects.length === 0 ? (
            <Card className="border-dashed border-2 bg-transparent border-zinc-200 dark:border-zinc-800">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Building2 className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mb-4" />
                <h3 className="text-xl font-bold mb-2 text-zinc-800 dark:text-zinc-100">
                  Nenhum projeto ativo
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
                  Você ainda não possui projetos vinculados à sua conta.
                </p>
                <Button
                  onClick={() => (window.location.href = 'mailto:contato@tozzi.com')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Phone className="w-4 h-4 mr-2" /> Falar com Atendimento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((project, idx) => (
                <Card
                  key={project.id}
                  className="group overflow-hidden flex flex-col cursor-pointer bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:shadow-lg hover:border-primary/50 transition-all duration-300"
                  onClick={() => navigate(`/gestao/painel-cliente/${project.id}`)}
                  style={{ animationDelay: `${300 + idx * 50}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <CardTitle className="text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors text-zinc-800 dark:text-zinc-100">
                        {project.nome_projeto}
                      </CardTitle>
                      <Badge className={getStatusColor(project.status_geral)} variant="outline">
                        {project.status_geral}
                      </Badge>
                    </div>
                    <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400 gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Início:{' '}
                        {project.data_inicio
                          ? format(new Date(project.data_inicio), 'dd/MM/yyyy')
                          : 'N/A'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pb-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-zinc-600 dark:text-zinc-300">
                          Progresso
                        </span>
                        <span className="font-bold text-primary">
                          {project.progresso_total || 0}%
                        </span>
                      </div>
                      <Progress
                        value={project.progresso_total || 0}
                        className="h-1.5 bg-zinc-100 dark:bg-zinc-800"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-3 bg-zinc-50/50 dark:bg-zinc-900/50 group-hover:bg-primary/5 transition-colors border-t border-zinc-100 dark:border-zinc-800/50">
                    <span className="text-xs font-semibold flex items-center text-primary">
                      Acessar painel do projeto{' '}
                      <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* Recent Activity Feed */}
          <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm mt-6">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50 py-4">
              <CardTitle className="text-base flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                <MessageSquare className="w-4 h-4 text-primary" />
                Atualizações Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[280px]">
                {comments.length > 0 ? (
                  <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-4 flex gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                      >
                        <Avatar className="w-9 h-9 border border-zinc-200 dark:border-zinc-700">
                          <AvatarImage
                            src={
                              comment.expand?.autor?.avatar
                                ? pb.files.getUrl(comment.expand.autor, comment.expand.autor.avatar)
                                : undefined
                            }
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {comment.expand?.autor?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {comment.expand?.autor?.name || 'Equipe Tozzi'}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {formatDistanceToNow(new Date(comment.created), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                            {comment.mensagem}
                          </p>
                          {comment.expand?.projeto_id?.nome_projeto && (
                            <p className="text-xs font-medium text-primary mt-1">
                              Projeto: {comment.expand.projeto_id.nome_projeto}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400 p-6 text-center">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">Nenhuma atividade recente encontrada.</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
