import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Clock,
  Target,
  Activity,
  Info,
  Calendar,
  Users,
  File,
  Download,
  DollarSign,
  Loader2,
  FileText,
  ArrowLeft,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { TimelineView, EvolutionChart } from '@/components/client-dashboard/ClientWidgets'
import { exportProjectProgressPDF } from '@/lib/exportPdf'
import { ClientComments } from '@/components/client-dashboard/ClientComments'
import { ClientDocumentUpload } from '@/components/client-dashboard/ClientDocumentUpload'
import {
  getClientProject,
  getProjectPhases,
  getProjectPayments,
  getProjectDocuments,
  getProjectComments,
} from '@/services/client_dashboard'
import { useParams, useNavigate } from 'react-router-dom'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return format(new Date(dateStr), 'dd/MM/yyyy')
}

const getPaymentStatusBadge = (status: string) => {
  switch (status) {
    case 'Pago':
      return (
        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent">
          Pago
        </Badge>
      )
    case 'Pendente':
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-transparent">
          Pendente
        </Badge>
      )
    case 'Atrasado':
      return <Badge variant="destructive">Atrasado</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function ClientProjectDetails() {
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<any>(null)
  const [phases, setPhases] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentFilter, setPaymentFilter] = useState('Todos')

  const loadData = async () => {
    if (!id) return
    try {
      const activeProject = await getClientProject(id)
      setProject(activeProject)
      const [phs, pymts, docs, comms] = await Promise.all([
        getProjectPhases(activeProject.id),
        getProjectPayments(activeProject.id),
        getProjectDocuments(activeProject.id),
        getProjectComments(activeProject.id),
      ])
      setPhases(phs)
      setPayments(pymts)
      setDocuments(docs)
      setComments(comms)
    } catch (error) {
      console.error(error)
      navigate('/gestao/painel-cliente', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user, id])

  useRealtime('projetos_cliente', loadData)
  useRealtime('fases_projeto', loadData)
  useRealtime('pagamentos_projeto', loadData)
  useRealtime('documentos_projeto', loadData)
  useRealtime('comentarios_projeto', loadData)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!project) return null

  const nextMilestone =
    phases.find((p) => p.status === 'Em Andamento' || p.status === 'Pendente') ||
    phases[phases.length - 1]
  const totalPaid = payments.filter((p) => p.status === 'Pago').reduce((acc, p) => acc + p.valor, 0)
  const totalPending = payments
    .filter((p) => p.status !== 'Pago')
    .reduce((acc, p) => acc + p.valor, 0)
  const health = payments.some((p) => p.status === 'Atrasado') ? 'Atenção' : 'Saudável'

  const filteredPayments = payments.filter(
    (p) => paymentFilter === 'Todos' || p.status === paymentFilter,
  )

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full animate-fade-in pb-20">
      <header className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            className="mb-4 -ml-4"
            onClick={() => navigate('/gestao/painel-cliente')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Painel
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Detalhes do Projeto</h1>
          <p className="text-muted-foreground mt-2">
            Visão geral do projeto:{' '}
            <span className="font-semibold text-foreground">{project.nome_projeto}</span>
          </p>
        </div>
        <Button
          onClick={() =>
            exportProjectProgressPDF(project, phases, payments, user?.name || 'Cliente')
          }
          variant="outline"
          className="shrink-0 gap-2 mt-auto"
        >
          <FileText className="w-4 h-4" />
          Exportar Relatório
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.progresso_total || 0}%</div>
            <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-out"
                style={{ width: `${project.progresso_total || 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">{project.status_geral}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Próximo Marco</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{nextMilestone?.nome_fase || 'N/A'}</div>
            <div className="flex items-center text-sm text-muted-foreground mt-3 gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-medium">
                Estimativa:{' '}
                {nextMilestone?.data_conclusao_estimada
                  ? formatDate(nextMilestone.data_conclusao_estimada)
                  : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Situação Financeira</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
              {health}
            </div>
            <div className="flex flex-col gap-1 mt-3 text-sm text-muted-foreground">
              <span>
                Pago:{' '}
                <strong className="text-foreground font-medium">{formatCurrency(totalPaid)}</strong>
              </span>
              <span>
                Pendente:{' '}
                <strong className="text-foreground font-medium">
                  {formatCurrency(totalPending)}
                </strong>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" /> Detalhes do Projeto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-2">Escopo do Projeto</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {project.descricao_escopo}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Cronograma
                  </h3>
                  <div className="flex gap-6">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Início</span>
                      <span className="text-sm font-medium">{formatDate(project.data_inicio)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Previsão Término</span>
                      <span className="text-sm font-medium">
                        {formatDate(project.data_previsao_entrega)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Equipe Responsável
                  </h3>
                  <div className="flex flex-col gap-3">
                    {(project.equipe_responsaveis || []).map((member: any) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name?.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{member.name}</span>
                          <span className="text-xs text-muted-foreground">{member.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linha do Tempo do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <TimelineView phases={phases} progress={project.progresso_total || 0} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" /> Transações Financeiras
              </CardTitle>
              <Tabs
                value={paymentFilter}
                onValueChange={setPaymentFilter}
                className="w-full sm:w-auto"
              >
                <TabsList className="grid grid-cols-4 sm:flex w-full">
                  <TabsTrigger value="Todos">Todos</TabsTrigger>
                  <TabsTrigger value="Pago">Pago</TabsTrigger>
                  <TabsTrigger value="Pendente">Pendente</TabsTrigger>
                  <TabsTrigger value="Atrasado">Atrasado</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        Nenhum pagamento{' '}
                        {paymentFilter !== 'Todos' ? paymentFilter.toLowerCase() : ''} encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.descricao}</TableCell>
                        <TableCell>{formatDate(payment.data_vencimento)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(payment.valor)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getPaymentStatusBadge(payment.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Central de Documentos
              </CardTitle>
              {user?.role === 'Administrador' && <ClientDocumentUpload projectId={project.id} />}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.length === 0 ? (
                  <div className="col-span-full py-6 text-center text-sm text-muted-foreground">
                    Nenhum documento anexado ao projeto.
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors bg-muted/20"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-primary/10 p-2 rounded-md shrink-0">
                          <File className="w-5 h-5 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium truncate" title={doc.nome_arquivo}>
                            {doc.nome_arquivo}
                          </p>
                          <p className="text-xs text-muted-foreground">{doc.tipo}</p>
                        </div>
                      </div>
                      {doc.arquivo && (
                        <a
                          href={pb.files.getUrl(doc, doc.arquivo)}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            title="Baixar documento"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comunicações do Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientComments projectId={project.id} comments={comments} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              <EvolutionChart phases={phases} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
